"""Load the official NAFNet SIDD-width32 denoising checkpoint into NAFNetPINN.

Backbone names match megvii-research/NAFNet exactly, so no key remapping is
needed. The only weights that stay random are the PINN branch (`pinn.*`), which
has no pretrained counterpart. We load the whole backbone (intro/encoders/downs/
middle_blks/ups/decoders/ending) and fine-tune all of it at a low LR — the net
adapts denoising -> underwater colour correction.
"""
import torch


def load_pretrained(model, ckpt_path, verbose=True):
    """Load backbone weights; report what loaded / stayed random.

    Returns dict(loaded, missing, unexpected). Raises if the load looks wrong
    (e.g. nothing matched — usually a width/block-config mismatch).
    """
    ckpt = torch.load(ckpt_path, map_location="cpu")
    state = ckpt.get("params", ckpt)

    result = model.load_state_dict(state, strict=False)
    missing = list(result.missing_keys)
    unexpected = list(result.unexpected_keys)
    loaded = len(state) - len(unexpected)

    non_pinn_missing = [k for k in missing if not k.startswith("pinn.")]

    if verbose:
        print(f"[pretrained] {loaded}/{len(state)} checkpoint tensors loaded")
        print(f"[pretrained] {len(missing)} missing in model "
              f"({len(missing) - len(non_pinn_missing)} are PINN branch, expected)")
        print(f"[pretrained] {len(unexpected)} unexpected (skipped)")
        if non_pinn_missing:
            print(f"[pretrained] WARNING non-PINN missing keys: {non_pinn_missing[:8]}"
                  f"{' ...' if len(non_pinn_missing) > 8 else ''}")
        if unexpected:
            print(f"[pretrained] WARNING unexpected keys: {unexpected[:8]}"
                  f"{' ...' if len(unexpected) > 8 else ''}")

    if loaded == 0:
        raise RuntimeError(
            "Pretrained load matched 0 tensors — width/block-config mismatch. "
            "Check model.width/enc_blk_nums/middle_blk_num/dec_blk_nums match the "
            "SIDD-width32 config (32 / [2,2,4,8] / 12 / [2,2,2,2])."
        )
    # Backbone should load completely; tolerate only the PINN gap.
    if non_pinn_missing:
        raise RuntimeError(
            f"{len(non_pinn_missing)} backbone tensors did not load (non-PINN). "
            "Refusing to train on a partially-initialised backbone — fix arch first."
        )
    return {"loaded": loaded, "missing": missing, "unexpected": unexpected}
