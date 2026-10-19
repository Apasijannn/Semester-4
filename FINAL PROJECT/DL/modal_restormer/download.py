"""Download LSUI + UIEB + pretrained into the Modal Volume.

    modal run download.py
"""
from modal_app import app, download_assets


@app.local_entrypoint()
def main():
    download_assets.remote()
