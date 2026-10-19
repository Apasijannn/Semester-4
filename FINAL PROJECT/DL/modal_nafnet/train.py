"""Train ablation variant(s).

    modal run train.py --variant A4        # one variant
    modal run train.py --all               # A1 -> A2 -> A3 -> A4 sequentially
    modal run train.py --variant A1 --smoke  # 1-epoch sanity check
"""
from modal_app import app, train_fn, VARIANTS


@app.local_entrypoint()
def main(variant: str = "A4", all: bool = False, smoke: bool = False):
    targets = VARIANTS if all else [variant]
    for v in targets:
        print(f">>> training {v}")
        call = train_fn.spawn(v, smoke)
        best = call.get()
        print(f">>> {v} best PSNR = {best:.2f}")
