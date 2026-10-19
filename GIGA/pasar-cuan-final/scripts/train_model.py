"""
train_model.py
==============
Script untuk melatih model AI penyaran harga lapak dari data_harga.csv.
Output: model_harga.pkl (dipakai di Godot via subprocess atau file JSON)

Pendekatan:
- Masalah: prediksi harga jual OPTIMAL per jenis_lapak untuk hari berikutnya
- Cara: dari data historis, cari harga tertinggi yang masih sering dibeli NPC
- Model: RandomForest Regressor (ringan, tidak perlu normalisasi, cocok data kecil)
- Input fitur: hari_ke, jenis_lapak, level_pemain, rating_pasar
- Target: harga_jual optimal (harga tertinggi yang masih 'Beli')
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import pickle
import json

# ──────────────────────────────────────────────
# 1. LOAD & EKSPLORASI DATA
# ──────────────────────────────────────────────
df = pd.read_csv("data_harga.csv")

print("=== INFO DATASET ===")
print(f"Total baris  : {len(df)}")
print(f"Kolom        : {list(df.columns)}")
print(f"Jenis lapak  : {sorted(df['jenis_lapak'].unique())}  (1=Minuman, 2=Makanan, 3=Pakaian)")
print(f"Level pemain : {df['level_pemain'].min()} - {df['level_pemain'].max()}")
print(f"Distribusi keputusan:\n{df['keputusan'].value_counts()}")
print()

# ──────────────────────────────────────────────
# 2. REKAYASA FITUR & LABEL
# ──────────────────────────────────────────────
# Label: harga "optimal" = harga tertinggi yang masih menghasilkan keputusan 'Beli'
# Kita buat target per kombinasi (hari_ke, jenis_lapak, level_pemain)
# yaitu: median harga dari semua transaksi 'Beli' pada kombinasi tsb

df_beli = df[df['keputusan'] == 'Beli'].copy()

# Hitung harga optimal (median harga Beli) per grup
harga_optimal = (
    df_beli
    .groupby(['hari_ke', 'jenis_lapak', 'level_pemain'])['harga_jual']
    .agg(harga_optimal='median')
    .reset_index()
)

# Tambahkan rata-rata rating_pasar per grup sebagai fitur konteks
rating_avg = (
    df
    .groupby(['hari_ke', 'jenis_lapak', 'level_pemain'])['rating_pasar']
    .mean()
    .reset_index()
    .rename(columns={'rating_pasar': 'avg_rating_pasar'})
)

data_model = harga_optimal.merge(rating_avg, on=['hari_ke', 'jenis_lapak', 'level_pemain'])

print("=== DATA MODEL (sample) ===")
print(data_model.head(10).to_string())
print(f"\nTotal sampel training: {len(data_model)}")
print()

# ──────────────────────────────────────────────
# 3. TRAINING MODEL
# ──────────────────────────────────────────────
FITUR = ['hari_ke', 'jenis_lapak', 'level_pemain', 'avg_rating_pasar']
TARGET = 'harga_optimal'

X = data_model[FITUR]
y = data_model[TARGET]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = RandomForestRegressor(
    n_estimators=100,   # jumlah pohon keputusan
    max_depth=6,        # kedalaman pohon (jaga tetap sederhana)
    random_state=42
)
model.fit(X_train, y_train)

# ──────────────────────────────────────────────
# 4. EVALUASI
# ──────────────────────────────────────────────
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)

print("=== EVALUASI MODEL ===")
print(f"MAE (Mean Absolute Error): {mae:.0f}")
print(f"  → rata-rata prediksi meleset ±{mae:.0f} dari harga optimal")
print()

# Feature importance
importances = pd.Series(model.feature_importances_, index=FITUR).sort_values(ascending=False)
print("=== FEATURE IMPORTANCE ===")
for feat, imp in importances.items():
    print(f"  {feat}: {imp:.3f}")
print()

# ──────────────────────────────────────────────
# 5. SIMPAN MODEL  → model_harga.pkl
# ──────────────────────────────────────────────
with open("model_harga.pkl", "wb") as f:
    pickle.dump(model, f)

print("✅ Model disimpan ke model_harga.pkl")
print()

# ──────────────────────────────────────────────
# 6. BUAT FUNGSI PREDIKSI & SARAN HARGA
# ──────────────────────────────────────────────
NAMA_LAPAK = {1: "Minuman", 2: "Makanan", 3: "Pakaian"}

def prediksi_harga_saran(hari_ke: int, level_pemain: int, rating_pasar: float) -> dict:
    """
    Menghasilkan saran harga untuk semua jenis lapak.

    Parameter:
        hari_ke       : hari ke berapa besok (misal hari ini 5, kirim 6)
        level_pemain  : level pemain saat ini
        rating_pasar  : rata-rata rating pasar hari ini

    Return:
        dict berisi harga saran per jenis lapak, contoh:
        {
            "hari_ke": 6,
            "saran": {
                1: {"nama": "Minuman", "harga": 9500},
                2: {"nama": "Makanan", "harga": 31000},
                3: {"nama": "Pakaian", "harga": 65000},
            },
            "pesan": "AI Advisor: Harga ideal lapak besok:\n- Minuman: 9.500\n- ..."
        }
    """
    with open("model_harga.pkl", "rb") as f:
        mdl = pickle.load(f)

    saran = {}
    for jenis in [1, 2, 3]:
        input_fitur = pd.DataFrame([{
            'hari_ke': hari_ke,
            'jenis_lapak': jenis,
            'level_pemain': level_pemain,
            'avg_rating_pasar': rating_pasar
        }])
        harga_pred = mdl.predict(input_fitur)[0]

        # Bulatkan ke kelipatan 500 (supaya terasa natural di game)
        harga_rounded = round(harga_pred / 500) * 500

        saran[jenis] = {
            "nama": NAMA_LAPAK[jenis],
            "harga": int(harga_rounded)
        }

    # Format pesan saran (template untuk Godot)
    pesan = f"AI Advisor: Harga ideal lapak besok:\n"
    pesan += f"- Minuman: {saran[1]['harga']:,}\n"
    pesan += f"- Makanan: {saran[2]['harga']:,}\n"
    pesan += f"- Pakaian: {saran[3]['harga']:,}"

    return {
        "hari_ke": hari_ke,
        "saran": saran,
        "pesan": pesan
    }


# ──────────────────────────────────────────────
# 7. CONTOH PENGGUNAAN
# ──────────────────────────────────────────────
print("=== CONTOH SARAN HARGA ===")
for hari, level, rating in [(6, 3, 4.2), (10, 7, 3.8), (15, 12, 4.5)]:
    hasil = prediksi_harga_saran(hari_ke=hari, level_pemain=level, rating_pasar=rating)
    print(f"\n[Hari={hari}, Level={level}, Rating={rating}]")
    print(hasil["pesan"])


# ──────────────────────────────────────────────
# 8. SCRIPT INFERENSI UNTUK GODOT (via JSON)
#    Godot memanggil: python3 predict.py <hari> <level> <rating>
#    Output: JSON string yang dibaca Godot
# ──────────────────────────────────────────────
predict_script = '''"""
predict.py  — dipanggil oleh Godot via OS.execute() atau subprocess
Usage: python3 predict.py <hari_ke> <level_pemain> <rating_pasar>
Output: JSON ke stdout
"""
import sys, json, pickle, pandas as pd

def main():
    hari_ke      = int(sys.argv[1])
    level_pemain = int(sys.argv[2])
    rating_pasar = float(sys.argv[3])

    NAMA_LAPAK = {1: "Minuman", 2: "Makanan", 3: "Pakaian"}

    with open("model_harga.pkl", "rb") as f:
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
        harga_rounded = round(harga_pred / 500) * 500
        saran[str(jenis)] = {
            "nama": NAMA_LAPAK[jenis],
            "harga": int(harga_rounded)
        }

    hasil = {
        "hari_ke": hari_ke,
        "saran": saran,
        "pesan": (
            f"AI Advisor: Harga ideal lapak besok:\\n"
            f"- Minuman: {saran[\'1\'][\'harga\']:,}\\n"
            f"- Makanan: {saran[\'2\'][\'harga\']:,}\\n"
            f"- Pakaian: {saran[\'3\'][\'harga\']:,}"
        )
    }
    print(json.dumps(hasil))

if __name__ == "__main__":
    main()
'''

with open("predict.py", "w") as f:
    f.write(predict_script)

print("\n✅ Script inferensi Godot disimpan ke predict.py")
print()
print("=== CARA PAKAI DI GODOT (GDScript) ===")
print("""
# Di GDScript Godot 4:
func get_ai_advice(hari_ke: int, level: int, rating: float) -> Dictionary:
    var args = [
        "predict.py",
        str(hari_ke),
        str(level),
        str(rating)
    ]
    var output = []
    OS.execute("python3", args, output)
    var json = JSON.new()
    json.parse(output[0])
    return json.get_data()

# Lalu tampilkan:
func show_advice():
    var result = get_ai_advice(hari_besok, player_level, current_rating)
    $AdvisorLabel.text = result["pesan"]
""")
