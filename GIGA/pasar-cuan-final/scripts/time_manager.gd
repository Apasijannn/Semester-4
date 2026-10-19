extends Node
# TimeManager.gd

enum Fase { PAGI, SIANG, MALAM }

signal fase_berubah(fase_baru: Fase)
signal hari_berganti(hari_baru: int)
signal sisa_waktu_siang(waktu_tersisa: float)
signal siang_waktu_habis() 

const DURASI_SIANG: float = 60.0 

var hari_saat_ini: int = 1
var fase_saat_ini: Fase = Fase.PAGI
var waktu_berjalan: float = 0.0
var is_siang_timer_habis: bool = false

func _process(delta: float) -> void:
	# Waktu HANYA dihitung saat fase SIANG.
	if fase_saat_ini == Fase.SIANG and not is_siang_timer_habis:
		waktu_berjalan += delta
		sisa_waktu_siang.emit(max(0.0, DURASI_SIANG - waktu_berjalan))
		
		# Jika durasi siang habis, beri tahu sistem tapi jangan force end dulu
		if waktu_berjalan >= DURASI_SIANG:
			is_siang_timer_habis = true
			siang_waktu_habis.emit()
			print("Waktu operasional habis! Menunggu pengunjung pulang...")

# --- FUNGSI TRANSISI ---

func mulai_siang() -> void:
	if fase_saat_ini == Fase.PAGI:
		fase_saat_ini = Fase.SIANG
		waktu_berjalan = 0.0
		is_siang_timer_habis = false
		fase_berubah.emit(fase_saat_ini)
		print("Pasar Dibuka! NPC mulai berdatangan.")

func pemicu_malam() -> void:
	if fase_saat_ini == Fase.SIANG:
		_masuk_fase_malam()

func _masuk_fase_malam() -> void:
	fase_saat_ini = Fase.MALAM
	fase_berubah.emit(fase_saat_ini)
	print("Pasar Tutup. Memulai rekapitulasi Malam.")

func lanjut_hari_esok() -> void:
	if fase_saat_ini == Fase.MALAM:
		hari_saat_ini += 1
		fase_saat_ini = Fase.PAGI
		hari_berganti.emit(hari_saat_ini)
		fase_berubah.emit(fase_saat_ini)
		print("Pagi Baru: Hari ke-", hari_saat_ini)

# --- FUNGSI RESET MUTLAK ---
func reset_waktu() -> void:
	hari_saat_ini = 1
	fase_saat_ini = Fase.PAGI
	waktu_berjalan = 0.0
	is_siang_timer_habis = false
	hari_berganti.emit(hari_saat_ini)
	fase_berubah.emit(fase_saat_ini)
	print("TimeManager: Waktu telah di-reset ke Hari 1 Pagi.")
