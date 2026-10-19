extends "res://scripts/game_manager.gd"

# ==========================================
# START MANAGER — "Kota Awal" (Hari Pertama)
# ==========================================
# Script ini di-attach ke start.tscn (duplicate dari game_manager.tscn)
# dengan layout jalan yang lebih sedikit di TileMap-nya.
#
# Yang berbeda dari game_manager biasa:
#   - Pesan sambutan di fase pagi
#   - Batas hanya 1 lapak
#   - Setelah hari pertama selesai → otomatis pindah ke game_manager.tscn
# ==========================================

const SCENE_KOTA_UTAMA = "res://sripts/game_manager.tscn"

# Durasi jeda (detik) sebelum pindah scene setelah laporan malam muncul
const DELAY_TRANSISI: float = 4.0

var sudah_transisi: bool = false


func _ready():
	# Set batas lapak ke 1 SEBELUM memanggil _ready() parent
	# agar logika parent sudah pakai nilai yang benar
	batas_lapak  = 1
	total_uang   = 350000  # pastikan modal awal konsisten

	super._ready()


# ==========================================
# OVERRIDE: Pesan tambahan di fase pagi
# ==========================================
func _pesan_pagi_tambahan() -> String:
	if hari_ke == 1:
		return (
			"🏙️ Selamat datang di Kota Cuan!\n"
			+ "Modal awal kamu: Rp350.000\n"
			+ "Cukup untuk 1 lapak minuman.\n"
			+ "Mulai kecil, tumbuh besar!\n"
			+ "─────────────────────────\n"
		)
	return ""


# ==========================================
# OVERRIDE: Pesan batas lapak lebih jelas
# ==========================================
func _pesan_batas_lapak() -> String:
	return (
		"⚠️  Kota baru ini hanya muat 1 lapak dulu.\n"
		+ "Selesaikan hari ini untuk membuka kota yang lebih besar!"
	)


# ==========================================
# OVERRIDE: Pesan lanjut di laporan malam
# ==========================================
func _pesan_lanjut_malam() -> String:
	return (
		"\n\n✨ Kota kamu siap berkembang!\n"
		+ "Sebentar lagi kamu akan dipindahkan\n"
		+ "ke kota yang lebih besar..."
	)


# ==========================================
# OVERRIDE: Transisi ke kota utama
# Dipanggil otomatis di akhir fase MALAM
# ==========================================
func _cek_transisi_ke_kota_utama():
	if sudah_transisi:
		return
	if bangkrut:
		# Kalau bangkrut di hari pertama, tidak transisi — biarkan game over berjalan
		return

	sudah_transisi = true
	_jalankan_transisi()


func _jalankan_transisi():
	# Matikan input sementara agar pemain tidak bisa tekan spasi dan
	# memicu _input() di parent selama countdown transisi berlangsung
	set_process_input(false)

	# Countdown visual di status_label
	for i in range(int(DELAY_TRANSISI), 0, -1):
		status_label.text = (
			status_label.text.split("✨")[0]
			+ "✨ Kota kamu siap berkembang!\n"
			+ "Pindah ke kota yang lebih besar dalam " + str(i) + " detik..."
		)
		await get_tree().create_timer(1.0).timeout

	get_tree().change_scene_to_file(SCENE_KOTA_UTAMA)
