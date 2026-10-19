"""Modal app: shared image / volume / secret + the remote functions.

Entry points live in download.py, train.py, evaluate.py (each a thin
local_entrypoint that calls these functions). Run them with `modal run <file>.py`.
"""
import os
from pathlib import Path

import modal

HERE = Path(__file__).parent
CONFIGS_LOCAL = HERE / "configs"
VARIANTS = ["A1", "A2", "A3", "A4"]

app = modal.App("uie-nafnet-pinn")

image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("libgl1", "libglib2.0-0")  # opencv/skimage runtime deps
    .pip_install(
        "torch==2.3.1", "torchvision==0.18.1",
        "einops", "pyyaml", "numpy<2", "pillow", "matplotlib",
        "scikit-image", "scipy", "torchmetrics", "lpips",
        "tqdm", "kaggle",
    )
    .add_local_python_source("src")
    .add_local_dir(str(CONFIGS_LOCAL), "/root/configs")
)

vol = modal.Volume.from_name("uie-vol", create_if_missing=True)
kaggle_secret = modal.Secret.from_name("kaggle-secret")

VOL_PATH = "/vol"
CONFIGS_REMOTE = "/root/configs"


def _set_cache_env():
    os.environ["TORCH_HOME"] = "/vol/cache"
    os.environ["HF_HOME"] = "/vol/cache/hf"
    os.makedirs("/vol/cache", exist_ok=True)


# ── Download ───────────────────────────────────────────────────────────────────

@app.function(image=image, volumes={VOL_PATH: vol}, secrets=[kaggle_secret], timeout=3600)
def download_assets():
    import subprocess
    import yaml
    from src import assets

    with open(os.path.join(CONFIGS_REMOTE, "base.yaml")) as f:
        cfg = yaml.safe_load(f)
    a = cfg["assets"]
    p = cfg["paths"]
    dl = "/vol/data/_dl"
    os.makedirs(dl, exist_ok=True)

    def kaggle_dl(slug, sub):
        dst = os.path.join(dl, sub)
        if os.path.exists(dst) and any(os.scandir(dst)):
            print(f"[download] {sub} already present, skip")
            return dst
        os.makedirs(dst, exist_ok=True)
        print(f"[download] kaggle {slug} -> {dst}")
        subprocess.run(["kaggle", "datasets", "download", "-d", slug, "-p", dst, "--unzip"],
                       check=True)
        return dst

    # LSUI (raw + ref in one dataset)
    if not (os.path.isdir(p["lsui_raw"]) and os.path.isdir(p["lsui_ref"])):
        root = kaggle_dl(a["kaggle"]["lsui"], "lsui")
        nr, nf = assets.arrange_paired(root, p["lsui_raw"], p["lsui_ref"])
        print(f"[download] LSUI arranged: {nr} raw / {nf} ref")
    else:
        print("[download] LSUI already arranged, skip")

    # UIEB raw + reference (two separate datasets)
    if not os.path.isdir(p["uieb_raw"]):
        root = kaggle_dl(a["kaggle"]["uieb_raw"], "uieb_raw")
        n = assets.arrange_single(root, p["uieb_raw"])
        print(f"[download] UIEB raw arranged: {n}")
    if not os.path.isdir(p["uieb_ref"]):
        root = kaggle_dl(a["kaggle"]["uieb_ref"], "uieb_ref")
        n = assets.arrange_single(root, p["uieb_ref"])
        print(f"[download] UIEB ref arranged: {n}")

    # Pretrained NAFNet (direct HF download)
    if not os.path.exists(p["pretrained"]):
        import urllib.request
        os.makedirs(os.path.dirname(p["pretrained"]), exist_ok=True)
        url = a["pretrained_url"]
        print(f"[download] pretrained {url}")
        urllib.request.urlretrieve(url, p["pretrained"])
        print(f"[download] pretrained -> {p['pretrained']} "
              f"({os.path.getsize(p['pretrained'])/1e6:.0f} MB)")
    else:
        print("[download] pretrained already present, skip")

    # Validate
    from src.assets import _count_images
    counts = {
        "lsui_raw": _count_images(p["lsui_raw"]), "lsui_ref": _count_images(p["lsui_ref"]),
        "uieb_raw": _count_images(p["uieb_raw"]), "uieb_ref": _count_images(p["uieb_ref"]),
    }
    print(f"[download] counts: {counts}")
    assert counts["lsui_raw"] == counts["lsui_ref"] > 0, "LSUI pair count mismatch"
    assert counts["uieb_raw"] == counts["uieb_ref"] > 0, "UIEB pair count mismatch"
    assert os.path.exists(p["pretrained"]), "pretrained missing"
    vol.commit()
    print("[download] DONE")


# ── Train ──────────────────────────────────────────────────────────────────────

@app.function(image=image, volumes={VOL_PATH: vol}, gpu="A100-40GB", timeout=86400)
def train_fn(variant: str, smoke: bool = False):
    _set_cache_env()
    from src.config import load_config
    from src.trainer import run_training
    cfg = load_config(variant, configs_dir=CONFIGS_REMOTE)
    return run_training(cfg, commit_fn=vol.commit, smoke=smoke)


# ── Evaluate + summarize ────────────────────────────────────────────────────────

@app.function(image=image, volumes={VOL_PATH: vol}, gpu="A100-40GB", timeout=14400)
def eval_fn(variant: str, use_tta: bool = True):
    _set_cache_env()
    from src.config import load_config
    from src.evaluator import run_evaluation
    cfg = load_config(variant, configs_dir=CONFIGS_REMOTE)
    m = run_evaluation(cfg, use_tta=use_tta)
    vol.commit()
    return m


@app.function(image=image, volumes={VOL_PATH: vol}, timeout=600)
def summarize_fn(variants: list):
    from src.config import load_config
    from src.evaluator import build_summary
    outputs = load_config(variants[0], configs_dir=CONFIGS_REMOTE)["paths"]["outputs"]
    build_summary(variants, outputs)
    vol.commit()
