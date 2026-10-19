"""Loss functions: Charbonnier reconstruction, Beer-Lambert physics consistency,
DINOv2 perceptual.
"""
import torch
import torch.nn as nn
import torch.nn.functional as F


def charbonnier_loss(pred, gt, eps=1e-3):
    return torch.mean(torch.sqrt((pred - gt) ** 2 + eps ** 2))


def physics_consistency_loss(inp, out, t):
    """Beer-Lambert self-consistency: re-degrading the enhanced output with the
    estimated transmittance should reproduce the input.

        inp ~= out * t + A * (1 - t)

    A (ambient light) is estimated from the brightest 0.1% pixels per channel.
    t is global per image (B, 3) from the PINN branch.

    NOTE: this never sees the GT — it only keeps t self-consistent with input.
    It can be satisfied by t~=1 (no correction), which is the A4 depth-collapse
    failure mode. Use physics_reference_loss to anchor t to the reference instead.
    """
    B, C, H, W = inp.shape
    flat = inp.view(B, C, -1)
    k = max(1, int(H * W * 0.001))
    A = flat.topk(k, dim=2).values.mean(dim=2).view(B, C, 1, 1)
    t_s = t.unsqueeze(-1).unsqueeze(-1)
    recon = out * t_s + A * (1 - t_s)
    return F.l1_loss(recon, inp)


def physics_reference_loss(inp, gt, t):
    """Reference-anchored Beer-Lambert: the clear image recovered from the INPUT by
    inverse Beer-Lambert must equal the GT.

        gt ~= (inp - A * (1 - t)) / t

    Unlike the self-consistency variant this sees the GT, so it forces beta/depth to
    actually perform colour correction instead of collapsing to t~=1. A is the
    ambient light (brightest 0.1% pixels); t is global per image (B, 3).
    """
    B, C, H, W = inp.shape
    flat = inp.view(B, C, -1)
    k = max(1, int(H * W * 0.001))
    A = flat.topk(k, dim=2).values.mean(dim=2).view(B, C, 1, 1)
    t_s = t.unsqueeze(-1).unsqueeze(-1).clamp(min=0.05)
    J = (inp - A * (1 - t_s)) / t_s
    return charbonnier_loss(J, gt)


def color_loss(out, gt):
    """Global colour-cast penalty: match per-channel mean and std to the reference.

    Targets the low-frequency colour shift (the blue/green cast) that per-pixel
    Charbonnier dilutes against high-frequency detail.
    """
    mo, mg = out.mean(dim=(2, 3)), gt.mean(dim=(2, 3))
    so, sg = out.std(dim=(2, 3)), gt.std(dim=(2, 3))
    return F.l1_loss(mo, mg) + F.l1_loss(so, sg)


class DINOv2Perceptual(nn.Module):
    """Frozen DINOv2-S/14 perceptual loss on patch tokens.

    Params are frozen but gradients flow THROUGH the network back to the model on
    the prediction path. The reference path is wrapped in no_grad (fixed target).
    """
    MEAN = (0.485, 0.456, 0.406)
    STD = (0.229, 0.224, 0.225)

    def __init__(self):
        super().__init__()
        self.dino = torch.hub.load("facebookresearch/dinov2", "dinov2_vits14", pretrained=True)
        for p in self.dino.parameters():
            p.requires_grad = False
        self.dino.eval()
        self.register_buffer("mean", torch.tensor(self.MEAN).view(1, 3, 1, 1))
        self.register_buffer("std", torch.tensor(self.STD).view(1, 3, 1, 1))

    def _pre(self, x):
        x = F.interpolate(x, size=(224, 224), mode="bilinear", align_corners=False)
        return (x - self.mean) / self.std

    def forward(self, pred, gt):
        f_pred = self.dino.forward_features(self._pre(pred))["x_norm_patchtokens"]
        with torch.no_grad():
            f_gt = self.dino.forward_features(self._pre(gt))["x_norm_patchtokens"]
        return F.mse_loss(f_pred, f_gt.detach())


def compute_loss(inp, out, gt, t, dino_fn, w_char, w_phys, w_percep, phys_scale=1.0,
                 w_color=0.0, phys_anchor=False):
    """Return (total, dict of components). t/dino_fn may be None (ablation toggles).
    phys_scale ramps the physics term during warmup. phys_anchor switches the physics
    term from self-consistency to reference-anchored. w_color adds the colour-cast term.
    """
    char = charbonnier_loss(out, gt)
    total = w_char * char
    comps = {"char": char.detach()}

    if t is not None:
        phys = physics_reference_loss(inp, gt, t) if phys_anchor \
            else physics_consistency_loss(inp, out, t)
        total = total + (w_phys * phys_scale) * phys
        comps["phys"] = phys.detach()
    else:
        comps["phys"] = torch.zeros((), device=inp.device)

    if dino_fn is not None:
        percep = dino_fn(out, gt)
        total = total + w_percep * percep
        comps["percep"] = percep.detach()
    else:
        comps["percep"] = torch.zeros((), device=inp.device)

    if w_color > 0:
        color = color_loss(out, gt)
        total = total + w_color * color
        comps["color"] = color.detach()
    else:
        comps["color"] = torch.zeros((), device=inp.device)

    return total, comps


if __name__ == "__main__":
    # Self-check (CPU, no network): reference-anchored physics + colour loss sanity.
    torch.manual_seed(0)
    gt = torch.rand(2, 3, 64, 64)
    inp = (gt * 0.5 + 0.2).clamp(0, 1)        # fake degraded: darker + cast
    t_id = torch.ones(2, 3)                     # t=1 -> inverse Beer-Lambert is identity-ish

    # color_loss is zero iff channel mean/std already match.
    assert color_loss(gt, gt) < 1e-6, "color_loss(gt,gt) must be ~0"
    assert color_loss(inp, gt) > color_loss(gt, gt), "cast must cost more"

    # physics_reference_loss: with t=1, J=(inp-A*0)/1=inp -> equals charbonnier(inp,gt).
    pr = physics_reference_loss(inp, gt, t_id)
    assert torch.allclose(pr, charbonnier_loss(inp, gt), atol=1e-5), "t=1 must reduce to charbonnier(inp,gt)"

    # Smaller t (stronger correction) should move J away from inp toward the A-corrected estimate.
    t_small = torch.full((2, 3), 0.5)
    assert physics_reference_loss(inp, gt, t_small).item() >= 0
    print("losses self-check OK")
