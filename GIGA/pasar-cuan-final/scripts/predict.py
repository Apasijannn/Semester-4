"""
predict.py  — dipanggil oleh Godot via OS.execute() atau subprocess
Usage: python3 predict.py <hari_ke> <level_pemain> <rating_pasar>
Output: JSON ke stdout
"""
import sys, json, pickle, os
# Sembunyikan warning dari pandas/sklearn agar tidak mengganggu parsing JSON di Godot
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3" 
import warnings
warnings.filterwarnings("ignore")
import pandas as pd

def main():
    # Gunakan path absolut ke folder script ini agar bisa menemukan model_harga.pkl
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, "model_harga.pkl")

    if not os.path.exists(model_path):
        print(json.dumps({"pesan": "Error: model_harga.pkl tidak ditemukan!"}))
        return

    hari_ke      = int(sys.argv[1])
    level_pemain = int(sys.argv[2])
    rating_pasar = float(sys.argv[3])

    NAMA_LAPAK = {1: "Minuman", 2: "Makanan", 3: "Pakaian"}

    with open(model_path, "rb") as f:
        model = pickle.load(f)

    saran = {}
    for jenis in [1, 2, 3]:
        fitur = pd.DataFrame([{
            "hari_ke": hari_ke,
            "jenis_lapak": jenis,
            "level_pemain": level_pemain,
            "avg_rating_pasar": rating_pasar
        }])
        harga_pred = model.predict(fitur)[0]
        
        # Logika pembulatan: Minuman (1) wajib berakhiran 500 (8500, 9500, dsb)
        if jenis == 1:
            # Bulatkan ke ribuan terdekat lalu tambahkan 500
            harga_rounded = (round(harga_pred / 1000) * 1000) + 500
            
            # Pengecualian: Batas harga maksimal minuman tetap 10.000
            if harga_rounded > 10000:
                harga_rounded = 10000
        else:
            harga_rounded = round(harga_pred / 1000) * 1000
            
        saran[str(jenis)] = {
            "nama": NAMA_LAPAK[jenis],
            "harga": int(harga_rounded)
        }

    pesan = "AI Advisor: Harga ideal lapak besok:\n"
    pesan += f"- Minuman: Rp {saran['1']['harga']:,}"
    
    if level_pemain >= 5:
        pesan += f"\n- Makanan: Rp {saran['2']['harga']:,}"
    
    if level_pemain >= 10:
        pesan += f"\n- Pakaian: Rp {saran['3']['harga']:,}"

    hasil = {
        "hari_ke": hari_ke,
        "saran": saran,
        "pesan": pesan
    }
    print(json.dumps(hasil))

if __name__ == "__main__":
    main()
