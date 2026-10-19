"""RestormerPINN — official Restormer backbone + optional Beer-Lambert PINN branch.

The backbone module/parameter names match swz30/Restormer exactly so the official
Gaussian-denoising checkpoint loads with no key remapping (see pretrained.py).
The PINN branch is the only addition; it stays randomly initialised.
"""
import numbers

import torch
import torch.nn as nn
import torch.nn.functional as F
from einops import rearrange
from torch.utils.checkpoint import checkpoint


# ── Layer norm (BiasFree / WithBias) — verbatim from official Restormer ────────

def to_3d(x):
    return rearrange(x, "b c h w -> b (h w) c")


def to_4d(x, h, w):
    return rearrange(x, "b (h w) c -> b c h w", h=h, w=w)


class BiasFree_LayerNorm(nn.Module):
    def __init__(self, normalized_shape):
        super().__init__()
        if isinstance(normalized_shape, numbers.Integral):
            normalized_shape = (normalized_shape,)
        normalized_shape = torch.Size(normalized_shape)
        assert len(normalized_shape) == 1
        self.weight = nn.Parameter(torch.ones(normalized_shape))
        self.normalized_shape = normalized_shape

    def forward(self, x):
        sigma = x.var(-1, keepdim=True, unbiased=False)
        return x / torch.sqrt(sigma + 1e-5) * self.weight


class WithBias_LayerNorm(nn.Module):
    def __init__(self, normalized_shape):
        super().__init__()
        if isinstance(normalized_shape, numbers.Integral):
            normalized_shape = (normalized_shape,)
        normalized_shape = torch.Size(normalized_shape)
        assert len(normalized_shape) == 1
        self.weight = nn.Parameter(torch.ones(normalized_shape))
        self.bias = nn.Parameter(torch.zeros(normalized_shape))
        self.normalized_shape = normalized_shape

    def forward(self, x):
        mu = x.mean(-1, keepdim=True)
        sigma = x.var(-1, keepdim=True, unbiased=False)
        return (x - mu) / torch.sqrt(sigma + 1e-5) * self.weight + self.bias


class LayerNorm(nn.Module):
    def __init__(self, dim, layernorm_type):
        super().__init__()
        self.body = BiasFree_LayerNorm(dim) if layernorm_type == "BiasFree" else WithBias_LayerNorm(dim)

    def forward(self, x):
        h, w = x.shape[-2:]
        return to_4d(self.body(to_3d(x)), h, w)


# ── GDFN feed-forward ──────────────────────────────────────────────────────────

class FeedForward(nn.Module):
    def __init__(self, dim, ffn_expansion_factor, bias):
        super().__init__()
        hidden = int(dim * ffn_expansion_factor)
        self.project_in = nn.Conv2d(dim, hidden * 2, 1, bias=bias)
        self.dwconv = nn.Conv2d(hidden * 2, hidden * 2, 3, stride=1, padding=1, groups=hidden * 2, bias=bias)
        self.project_out = nn.Conv2d(hidden, dim, 1, bias=bias)

    def forward(self, x):
        x = self.project_in(x)
        x1, x2 = self.dwconv(x).chunk(2, dim=1)
        return self.project_out(F.gelu(x1) * x2)


# ── MDTA attention ─────────────────────────────────────────────────────────────

class Attention(nn.Module):
    def __init__(self, dim, num_heads, bias):
        super().__init__()
        self.num_heads = num_heads
        self.temperature = nn.Parameter(torch.ones(num_heads, 1, 1))
        self.qkv = nn.Conv2d(dim, dim * 3, 1, bias=bias)
        self.qkv_dwconv = nn.Conv2d(dim * 3, dim * 3, 3, stride=1, padding=1, groups=dim * 3, bias=bias)
        self.project_out = nn.Conv2d(dim, dim, 1, bias=bias)

    def forward(self, x):
        b, c, h, w = x.shape
        qkv = self.qkv_dwconv(self.qkv(x))
        q, k, v = qkv.chunk(3, dim=1)
        q = rearrange(q, "b (head c) h w -> b head c (h w)", head=self.num_heads)
        k = rearrange(k, "b (head c) h w -> b head c (h w)", head=self.num_heads)
        v = rearrange(v, "b (head c) h w -> b head c (h w)", head=self.num_heads)
        q = F.normalize(q, dim=-1)
        k = F.normalize(k, dim=-1)
        attn = (q @ k.transpose(-2, -1)) * self.temperature
        attn = attn.softmax(dim=-1)
        out = attn @ v
        out = rearrange(out, "b head c (h w) -> b (head c) h w", head=self.num_heads, h=h, w=w)
        return self.project_out(out)


class TransformerBlock(nn.Module):
    def __init__(self, dim, num_heads, ffn_expansion_factor, bias, layernorm_type, use_ckpt=False):
        super().__init__()
        self.use_ckpt = use_ckpt
        self.norm1 = LayerNorm(dim, layernorm_type)
        self.attn = Attention(dim, num_heads, bias)
        self.norm2 = LayerNorm(dim, layernorm_type)
        self.ffn = FeedForward(dim, ffn_expansion_factor, bias)

    def _forward(self, x):
        x = x + self.attn(self.norm1(x))
        x = x + self.ffn(self.norm2(x))
        return x

    def forward(self, x):
        if self.use_ckpt and self.training:
            return checkpoint(self._forward, x, use_reentrant=False)
        return self._forward(x)


class OverlapPatchEmbed(nn.Module):
    def __init__(self, in_c=3, embed_dim=48, bias=False):
        super().__init__()
        self.proj = nn.Conv2d(in_c, embed_dim, 3, stride=1, padding=1, bias=bias)

    def forward(self, x):
        return self.proj(x)


class Downsample(nn.Module):
    def __init__(self, n_feat):
        super().__init__()
        self.body = nn.Sequential(
            nn.Conv2d(n_feat, n_feat // 2, 3, stride=1, padding=1, bias=False),
            nn.PixelUnshuffle(2),
        )

    def forward(self, x):
        return self.body(x)


class Upsample(nn.Module):
    def __init__(self, n_feat):
        super().__init__()
        self.body = nn.Sequential(
            nn.Conv2d(n_feat, n_feat * 2, 3, stride=1, padding=1, bias=False),
            nn.PixelShuffle(2),
        )

    def forward(self, x):
        return self.body(x)


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

class RestormerPINN(nn.Module):
    def __init__(self, dim=48, num_blocks=(4, 6, 6, 8), num_refinement_blocks=4,
                 heads=(1, 2, 4, 8), ffn_expansion_factor=2.66, bias=False,
                 layernorm_type="BiasFree", use_grad_ckpt=True, use_pinn=True,
                 inp_channels=3, out_channels=3):
        super().__init__()
        self.use_pinn = use_pinn
        ck = use_grad_ckpt

        def blk(d, h):
            return TransformerBlock(d, h, ffn_expansion_factor, bias, layernorm_type, use_ckpt=ck)

        def stack(d, h, n):
            return nn.Sequential(*[blk(d, h) for _ in range(n)])

        self.patch_embed = OverlapPatchEmbed(inp_channels, dim, bias=bias)

        self.encoder_level1 = stack(dim, heads[0], num_blocks[0])
        self.down1_2 = Downsample(dim)
        self.encoder_level2 = stack(dim * 2, heads[1], num_blocks[1])
        self.down2_3 = Downsample(dim * 2)
        self.encoder_level3 = stack(dim * 4, heads[2], num_blocks[2])
        self.down3_4 = Downsample(dim * 4)
        self.latent = stack(dim * 8, heads[3], num_blocks[3])

        self.up4_3 = Upsample(dim * 8)
        self.reduce_chan_level3 = nn.Conv2d(dim * 8, dim * 4, 1, bias=bias)
        self.decoder_level3 = stack(dim * 4, heads[2], num_blocks[2])
        self.up3_2 = Upsample(dim * 4)
        self.reduce_chan_level2 = nn.Conv2d(dim * 4, dim * 2, 1, bias=bias)
        self.decoder_level2 = stack(dim * 2, heads[1], num_blocks[1])
        self.up2_1 = Upsample(dim * 2)
        self.decoder_level1 = stack(dim * 2, heads[0], num_blocks[0])
        self.refinement = stack(dim * 2, heads[0], num_refinement_blocks)
        self.output = nn.Conv2d(dim * 2, out_channels, 3, stride=1, padding=1, bias=bias)

        self.pinn = PINNBranch(dim * 8) if use_pinn else None

    def forward(self, inp_img):
        e1 = self.encoder_level1(self.patch_embed(inp_img))
        e2 = self.encoder_level2(self.down1_2(e1))
        e3 = self.encoder_level3(self.down2_3(e2))
        latent = self.latent(self.down3_4(e3))

        beta = d = t = None
        if self.use_pinn:
            beta, d, t = self.pinn(latent)

        x = self.up4_3(latent)
        x = self.reduce_chan_level3(torch.cat([x, e3], 1))
        x = self.decoder_level3(x)
        x = self.up3_2(x)
        x = self.reduce_chan_level2(torch.cat([x, e2], 1))
        x = self.decoder_level2(x)
        x = self.up2_1(x)
        x = self.decoder_level1(torch.cat([x, e1], 1))
        x = self.refinement(x)
        out = self.output(x) + inp_img

        if self.use_pinn:
            t_s = t.unsqueeze(-1).unsqueeze(-1)            # (B, 3, 1, 1)
            out = (out / t_s.clamp(min=0.05)).clamp(0, 1)

        return out, t, beta, d


def build_model(cfg):
    m = cfg["model"]
    return RestormerPINN(
        dim=m["dim"],
        num_blocks=tuple(m["num_blocks"]),
        num_refinement_blocks=m["num_refinement_blocks"],
        heads=tuple(m["heads"]),
        ffn_expansion_factor=m["ffn_expansion_factor"],
        bias=m["bias"],
        layernorm_type=m["layernorm_type"],
        use_grad_ckpt=m["use_grad_ckpt"],
        use_pinn=cfg["use_pinn"],
    )


if __name__ == "__main__":
    # Smoke test (CPU): shapes + PINN toggle, no GPU needed.
    for use_pinn in (False, True):
        net = RestormerPINN(use_grad_ckpt=False, use_pinn=use_pinn).eval()
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
