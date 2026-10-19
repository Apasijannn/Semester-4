"""Evaluate trained variant(s) on UIEB-890 (or UIEB-U90) and build report tables.

    modal run evaluate.py --variant A4
    modal run evaluate.py --variant A4 --u90   # eval on Test-U90 split only
    modal run evaluate.py --all                # eval A1..A5 + write summary tables
"""
from modal_app import app, eval_fn, summarize_fn, VARIANTS


@app.local_entrypoint()
def main(variant: str = "A4", all: bool = False, no_tta: bool = False, u90: bool = False):
    targets = VARIANTS if all else [variant]
    for v in targets:
        split = "U90" if u90 else "UIEB-890"
        print(f">>> evaluating {v} on {split}")
        eval_fn.remote(v, not no_tta, u90)
    if all:
        summarize_fn.remote(VARIANTS)
