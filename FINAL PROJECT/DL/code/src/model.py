"""NAFNetPINN — official NAFNet backbone + optional Beer-Lambert PINN branch.

The backbone module/parameter names match megvii-research/NAFNet exactly so the
official SIDD-width32 denoising checkpoint loads with no key remapping (see
pretrained.py). The PINN branch is the only addition; it stays randomly init.

NAFNet ref: "Simple Baselines for Image Restoration" (ECCV 2022).
"""
import torch
import torch.nn as nn
from torch.utils.checkpoint import checkpoint


# ── LayerNorm2d (channel-wise) — matches official NAFNet params (weight, bias) ──

class LayerNorm2d(nn.Module):
    def __init__(self, channels, eps=1e-6):
        super().__init__()
        self.weight = nn.Parameter(torch.ones(channels))
        self.bias = nn.Parameter(torch.zeros(channels))
        self.eps = eps

    def forward(self, x):
        mu = x.mean(1, keepdim=True)
        var = x.var(1, keepdim=True, unbiased=False)
        x = (x - mu) / torch.sqrt(var + self.eps)
        return x * self.weight[None, :, None, None] + self.bias[None, :, None, None]


class SimpleGate(nn.Module):
    def forward(self, x):
        x1, x2 = x.chunk(2, dim=1)
        return x1 * x2


# ── NAFBlock — verbatim structure/names from official NAFNet_arch.py ────────────

class NAFBlock(nn.Module):
    def __init__(self, c, dw_expand=2, ffn_expand=2, use_ckpt=False):
        super().__init__()
        self.use_ckpt = use_ckpt
        dw_channel = c * dw_expand
        self.conv1 = nn.Conv2d(c, dw_channel, 1, bias=True)
        self.conv2 = nn.Conv2d(dw_channel, dw_channel, 3, padding=1, groups=dw_channel, bias=True)
        self.conv3 = nn.Conv2d(dw_channel // 2, c, 1, bias=True)
        # Simplified Channel Attention
        self.sca = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Conv2d(dw_channel // 2, dw_channel // 2, 1, bias=True),
        )
        self.sg = SimpleGate()

        ffn_channel = ffn_expand * c
        self.conv4 = nn.Conv2d(c, ffn_channel, 1, bias=True)
        self.conv5 = nn.Conv2d(ffn_channel // 2, c, 1, bias=True)

        self.norm1 = LayerNorm2d(c)
        self.norm2 = LayerNorm2d(c)

        self.beta = nn.Parameter(torch.zeros(1, c, 1, 1))
        self.gamma = nn.Parameter(torch.zeros(1, c, 1, 1))

    def _forward(self, inp):
        x = self.norm1(inp)
        x = self.conv1(x)
        x = self.conv2(x)
        x = self.sg(x)
        x = x * self.sca(x)
        x = self.conv3(x)
        y = inp + x * self.beta

        x = self.conv4(self.norm2(y))
        x = self.sg(x)
        x = self.conv5(x)
        return y + x * self.gamma

    def forward(self, inp):
        if self.use_ckpt and self.training:
            return checkpoint(self._forward, inp, use_reentrant=False)
        return self._forward(inp)


# ── PINN branch: global Beer-Lambert attenuation ───────────────────────────────

class PINNBranch(nn.Module):
    """Estimate per-image attenuation beta_RGB and a depth scalar from latent
    features, then transmittance t = exp(-beta * d).

    Note (honest scope): beta and d are GLOBAL per image (no per-pixel depth map),
    so this acts as a physically-grounded global colour-attenuation prior, not a
    full scene-depth model.

    Initialised so t ~= 1 at the start (d ~= 0): the J/t inversion begins as
    near-identity and does not distort the pretrained decoder output early on.
    """

    def __init__(self, feat_dim, hidden=64):
        super().__init__()
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.beta_head = nn.Sequential(
            nn.Flatten(), nn.Linear(feat_dim, hidden), nn.GELU(),
            nn.Linear(hidden, 3), nn.Softplus(),
        )
        self.depth_head = nn.Sequential(
            nn.Flatten(), nn.Linear(feat_dim, hidden), nn.GELU(),
            nn.Linear(hidden, 1), nn.Sigmoid(),
        )
        # Make d ~= sigmoid(-4) ~= 0.018 at init  ->  t ~= 1.
        nn.init.zeros_(self.depth_head[3].weight)
        nn.init.constant_(self.depth_head[3].bias, -4.0)

    def forward(self, feat):
        p = self.pool(feat)
        beta = self.beta_head(p)          # (B, 3)
        d = self.depth_head(p)            # (B, 1)
        t = torch.exp(-beta * d)          # (B, 3)
        return beta, d, t


# ── Full model ─────────────────────────────────────────────────────────────────

class NAFNetPINN(nn.Module):
    """NAFNet U-Net (official names: intro/ending/encoders/downs/middle_blks/ups/
    decoders) + optional PINN branch reading the bottleneck feature.
    """

    def __init__(self, width=32, enc_blk_nums=(2, 2, 4, 8), middle_blk_num=12,
                 dec_blk_nums=(2, 2, 2, 2), img_channel=3,
                 use_grad_ckpt=False, use_pinn=True):
        super().__init__()
        self.use_pinn = use_pinn
        ck = use_grad_ckpt

        self.intro = nn.Conv2d(img_channel, width, 3, padding=1, stride=1, groups=1, bias=True)
        self.ending = nn.Conv2d(width, img_channel, 3, padding=1, stride=1, groups=1, bias=True)

        self.encoders = nn.ModuleList()
        self.decoders = nn.ModuleList()
        self.middle_blks = nn.ModuleList()
        self.ups = nn.ModuleList()
        self.downs = nn.ModuleList()

        chan = width
        for num in enc_blk_nums:
            self.encoders.append(nn.Sequential(*[NAFBlock(chan, use_ckpt=ck) for _ in range(num)]))
            self.downs.append(nn.Conv2d(chan, 2 * chan, 2, 2))
            chan = chan * 2

        self.middle_blks = nn.Sequential(*[NAFBlock(chan, use_ckpt=ck) for _ in range(middle_blk_num)])

        for num in dec_blk_nums:
            self.ups.append(nn.Sequential(
                nn.Conv2d(chan, chan * 2, 1, bias=False),
                nn.PixelShuffle(2),
            ))
            chan = chan // 2
            self.decoders.append(nn.Sequential(*[NAFBlock(chan, use_ckpt=ck) for _ in range(num)]))

        self.padder_size = 2 ** len(self.encoders)

        # Bottleneck channels = width * 2^(#downsamples).
        self.pinn = PINNBranch(width * (2 ** len(enc_blk_nums))) if use_pinn else None

    def _check_image_size(self, x):
        _, _, h, w = x.size()
        ph = (self.padder_size - h % self.padder_size) % self.padder_size
        pw = (self.padder_size - w % self.padder_size) % self.padder_size
        return nn.functional.pad(x, (0, pw, 0, ph))

    def forward(self, inp_img):
        B, C, H, W = inp_img.shape
        x = self._check_image_size(inp_img)
        inp = x

        x = self.intro(x)
        encs = []
        for encoder, down in zip(self.encoders, self.downs):
            x = encoder(x)
            encs.append(x)
            x = down(x)

        x = self.middle_blks(x)

        beta = d = t = None
        if self.use_pinn:
            beta, d, t = self.pinn(x)

        for decoder, up, enc_skip in zip(self.decoders, self.ups, encs[::-1]):
            x = up(x)
            x = x + enc_skip
            x = decoder(x)

        x = self.ending(x)
        out = x + inp
        out = out[:, :, :H, :W]

        if self.use_pinn:
            t_s = t.unsqueeze(-1).unsqueeze(-1)            # (B, 3, 1, 1)
            out = (out / t_s.clamp(min=0.05)).clamp(0, 1)

        return out, t, beta, d


def build_model(cfg):
    m = cfg["model"]
    return NAFNetPINN(
        width=m["width"],
        enc_blk_nums=tuple(m["enc_blk_nums"]),
        middle_blk_num=m["middle_blk_num"],
        dec_blk_nums=tuple(m["dec_blk_nums"]),
        use_grad_ckpt=m["use_grad_ckpt"],
        use_pinn=cfg["use_pinn"],
    )


if __name__ == "__main__":
    # Smoke test (CPU): shapes + PINN toggle, no GPU needed.
    for use_pinn in (False, True):
        net = NAFNetPINN(use_grad_ckpt=False, use_pinn=use_pinn).eval()
        x = torch.rand(1, 3, 256, 256)
        with torch.no_grad():
            out, t, beta, d = net(x)
        assert out.shape == x.shape, out.shape
        if use_pinn:
            assert t.shape == (1, 3) and beta.shape == (1, 3) and d.shape == (1, 1)
            assert t.mean() > 0.9, f"t should start ~1, got {t.mean():.3f}"
        n = sum(p.numel() for p in net.parameters())
        print(f"use_pinn={use_pinn}: out {tuple(out.shape)}  params {n/1e6:.2f}M  "
              f"t~{None if t is None else round(t.mean().item(),3)}")
    print("model smoke test OK")
