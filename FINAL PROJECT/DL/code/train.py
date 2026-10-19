"""Train ablation variant(s).

    modal run train.py --variant A4          # one variant
    modal run --detach train.py --all        # A1->A4 sequentially, survives disconnect
    modal run train.py --variant A1 --smoke  # 1-epoch sanity check
"""
from modal_app import app, train_fn, train_all_fn, VARIANTS


@app.local_entrypoint()
def main(variant: str = "A4", all: bool = False, smoke: bool = False):
    if all:
        # Orchestration runs server-side — safe to close terminal after spawn.
        call = train_all_fn.spawn(VARIANTS, smoke)
        print(f">>> all variants spawned (server-side). safe to close terminal.")
        print(f">>> monitor: modal app logs uie-nafnet-pinn")
        results = call.get()
        for v, best in results.items():
            print(f">>> {v} best PSNR = {best:.2f}")
    else:
        print(f">>> training {variant}")
        call = train_fn.spawn(variant, smoke)
        best = call.get()
        print(f">>> {variant} best PSNR = {best:.2f}")
