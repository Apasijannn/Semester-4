extends Node2D

# ==========================================
# 1. VARIABEL & PENGATURAN DASAR
# ==========================================
enum Fase { PAGI, SIANG, MALAM }
var fase_sekarang = Fase.PAGI

var hari_ke: int             = 1
var bangkrut: bool           = false
var hari_minus_berturut: int = 0
var konversi_pasar: float    = 0.0  

var sel_terisi = {}
var tipe_lapak_terpilih: String = "minuman" 

@export var lapak_scene: PackedScene
@export var npc_scene: PackedScene


@onready var status_label  = $UILayer/StatusLabel
@onready var spawner_timer = $NPCSpawnerTimer
@onready var layer_tanah   = $LayerTanah
@onready var layer_jalan   = $LayerJalan
@onready var kursor_lapak  = $KursorLapak
@onready var filter_cahaya = $CanvasModulate
@onready var lampu         = $PointLight2D
@onready var kamera        = $Camera2D
@onready var timer_siang   = $TimerSiang
@onready var teks_hari     = $UILayer/CountSign/TeksHari
@onready var teks_npc      = $UILayer/CountSign/TeksPelanggan
@onready var teks_uang     = $UILayer/MoneySign/TeksUang

var total_uang: int          = 350000   
var pendapatan_hari_ini: int = 0

const TIER_LAPAK: Dictionary = {
	"minuman": {
		"nama"  : "Minuman (Tier 1)",
		"capex" : 250000,
		"harga" : 5000,
		"opex"  : 20000
	},
	"makanan": {
		"nama"  : "Makanan (Tier 2)",
		"capex" : 1200000,
		"harga" : 15000,
		"opex"  : 620000
	},
	"pakaian": {
		"nama"  : "Pakaian (Tier 3)",
		"capex" : 3000000,
		"harga" : 30000,
		"opex"  : 180000
	}
}

# STATISTIK 
var pengunjung_hari_ini: int    = 0
var pembeli_hari_ini: int       = 0
var tolak_harga: int            = 0
var tolak_antrean: int          = 0
var tolak_intention: int        = 0

var event_hari_ini: String   = ""
var multiplier_budget: float = 1.0
var batas_lapak: int = 999      

# ==========================================
# 2. SIKLUS UTAMA (CORE LOOP)
# ==========================================
func _ready():
	print("=== GAME PASAR CUAN DIMULAI ===")
	teks_uang.text = "Rp" + str(total_uang)
	kamera.global_position = Vector2(500, 300)
	jalankan_fase(fase_sekarang)

func jalankan_fase(fase_baru):
	fase_sekarang = fase_baru

	match fase_sekarang:
		Fase.PAGI:
			filter_cahaya.color = Color(1.0, 0.95, 0.8)
			teks_hari.text      = str(hari_ke)
			teks_npc.text       = "0"

			pendapatan_hari_ini = 0
			pengunjung_hari_ini = 0
			pembeli_hari_ini    = 0
			tolak_harga         = 0
			tolak_antrean       = 0
			tolak_intention     = 0

			_reset_statistik_semua_lapak()
			spawner_timer.stop()
			_tentukan_event_harian()

			var pesan_pagi  = "FASE PAGI — Hari ke-" + str(hari_ke) + "\n"
			pesan_pagi     += "Pilih lapak di laci dan klik rumput untuk membangun.\n"
			pesan_pagi     += "Terpilih saat ini: " + TIER_LAPAK[tipe_lapak_terpilih]["nama"] + "\n"
			pesan_pagi     += "─────────────────────────\n"
			pesan_pagi     += event_hari_ini
			pesan_pagi     += "\n\n[Tekan Spasi untuk Buka Pasar]"
			status_label.text = pesan_pagi

		Fase.SIANG:
			filter_cahaya.color = Color(1.0, 1.0, 1.0)
			timer_siang.start()
			status_label.text = "FASE SIANG: Menunggu pelanggan..."
			spawner_timer.start()
			kursor_lapak.hide()

		Fase.MALAM:
			filter_cahaya.color = Color(0.2, 0.2, 0.4)

			if pengunjung_hari_ini > 0:
				konversi_pasar = (float(pembeli_hari_ini) / float(pengunjung_hari_ini)) * 100.0
			else:
				konversi_pasar = 0.0

			var total_evaluasi_aoe = pembeli_hari_ini + tolak_harga + tolak_antrean + tolak_intention

			var konversi_aoe: float = 0.0
			if total_evaluasi_aoe > 0:
				konversi_aoe = (float(pembeli_hari_ini) / float(total_evaluasi_aoe)) * 100.0

			var jumlah_per_tier: Dictionary = { "minuman": 0, "makanan": 0, "pakaian": 0 }
			for sel in sel_terisi:
				var nilai = sel_terisi[sel]
				if TIER_LAPAK.has(nilai):          
					jumlah_per_tier[nilai] += 1

			var total_opex: int = 0
			var rincian_opex: String = ""
			for tipe in jumlah_per_tier:
				var jumlah = jumlah_per_tier[tipe]
				if jumlah > 0:
					var opex_tipe = jumlah * TIER_LAPAK[tipe]["opex"]
					total_opex   += opex_tipe
					rincian_opex += "    " + TIER_LAPAK[tipe]["nama"] + " x" + str(jumlah) \
								  + " : -Rp" + str(opex_tipe) + "\n"

			total_uang     -= total_opex
			teks_uang.text  = "Rp" + str(total_uang)

			var jumlah_lapak = jumlah_per_tier["minuman"] + jumlah_per_tier["makanan"] + jumlah_per_tier["pakaian"]
			var laba_bersih  = pendapatan_hari_ini - total_opex

			if total_uang < 0:
				hari_minus_berturut += 1
			else:
				hari_minus_berturut = 0

			if hari_minus_berturut >= 3:
				bangkrut = true

			var menang = (hari_ke >= 30 and total_uang >= 50000000 and konversi_pasar >= 70.0)

			var laporan  = "LAPORAN MALAM — HARI KE-" + str(hari_ke) + "\n"
			laporan     += "═════════════════════════\n"
			laporan     += "👥 PENGUNJUNG PASAR:\n"
			laporan     += "  Hadir hari ini        : " + str(pengunjung_hari_ini) + " orang\n"
			laporan     += "  Masuk AoE lapak       : " + str(total_evaluasi_aoe) + " orang\n"
			laporan     += "  Berhasil transaksi    : " + str(pembeli_hari_ini) + " orang\n"
			laporan     += "─────────────────────────\n"
			laporan     += "📊 KONVERSI:\n"
			laporan     += "  Pasar (beli/hadir)    : " + str(snappedf(konversi_pasar, 0.1)) + "%\n"
			laporan     += "  AoE  (beli/masuk AoE) : " + str(snappedf(konversi_aoe, 0.1)) + "%\n"
			laporan     += "─────────────────────────\n"
			laporan     += "❌ ALASAN PENOLAKAN (di AoE):\n"
			laporan     += "  Harga terlalu mahal   : " + str(tolak_harga) + " orang\n"
			laporan     += "  Antrean terlalu panjang: " + str(tolak_antrean) + " orang\n"
			laporan     += "  Tidak tertarik        : " + str(tolak_intention) + " orang\n"
			laporan     += "─────────────────────────\n"
			laporan     += "💰 KEUANGAN:\n"
			laporan     += "  Pendapatan Kotor      : Rp" + str(pendapatan_hari_ini) + "\n"
			laporan     += "  OpEx (" + str(jumlah_lapak) + " lapak total):\n"
			laporan     += rincian_opex
			laporan     += "  Total OpEx            : -Rp" + str(total_opex) + "\n"
			laporan     += "  Laba Bersih           : Rp" + str(laba_bersih) + "\n"
			laporan     += "═════════════════════════\n"
			laporan     += "  TOTAL SALDO           : Rp" + str(total_uang) + "\n"
			laporan     += "═════════════════════════\n"

			if bangkrut:
				laporan += "\n💀 BANGKRUT — Saldo minus " + str(hari_minus_berturut) + " hari berturut!\n"
				laporan += "[ GAME OVER ]"
			elif menang:
				laporan += "\n🏆 SELAMAT! Kamu mencapai target Rp50.000.000!\n"
				laporan += "[ KAMU MENANG! ]"
			else:
				laporan += "\n[Tekan Spasi untuk lanjut ke Hari " + str(hari_ke + 1) + "]"

			status_label.text = laporan
			spawner_timer.stop()


# ==========================================
# 3. PENCATATAN DATA 
# ==========================================
func catat_pengunjung_baru():
	if fase_sekarang != Fase.SIANG:
		return
	pengunjung_hari_ini += 1
	teks_npc.text = str(pengunjung_hari_ini)

func catat_hasil_evaluasi(terjual: bool, harga: int, alasan: String = ""):
	if fase_sekarang != Fase.SIANG:
		return

	if terjual:
		pembeli_hari_ini    += 1
		pendapatan_hari_ini += harga
		total_uang          += harga
		teks_uang.text       = "Rp" + str(total_uang)
	else:
		match alasan:
			"harga":           tolak_harga         += 1
			"antrean":         tolak_antrean        += 1
			"tidak_tertarik":  tolak_intention      += 1


# ==========================================
# 4. INPUT & UI RECEIVER
# ==========================================
func _input(event):
	if event.is_action_pressed("ui_accept"):
		if bangkrut:
			return
		if fase_sekarang == Fase.PAGI:
			jalankan_fase(Fase.SIANG)
		elif fase_sekarang == Fase.MALAM:
			hari_ke += 1
			jalankan_fase(Fase.PAGI)

func set_tipe_lapak(tipe: String):
	if TIER_LAPAK.has(tipe) and fase_sekarang == Fase.PAGI:
		tipe_lapak_terpilih = tipe
		var pesan = status_label.text.split("Terpilih saat ini:")[0]
		status_label.text = pesan + "Terpilih saat ini: " + TIER_LAPAK[tipe]["nama"] + "\n─────────────────────────\n" + event_hari_ini + "\n\n[Tekan Spasi untuk Buka Pasar]"


# ==========================================
# 5. LOGIKA PEMBANGUNAN & KURSOR VISUAL
# ==========================================
func _process(_delta):
	if fase_sekarang == Fase.SIANG:
		var progres     = 1.0 - (timer_siang.time_left / timer_siang.wait_time)
		var warna_siang = Color(1.0, 1.0, 1.0)
		var warna_malam = Color(0.2, 0.2, 0.4)
		filter_cahaya.color = warna_siang.lerp(warna_malam, progres)
		status_label.text   = "FASE SIANG: Sisa Waktu " + str(int(timer_siang.time_left)) + " detik"

	if fase_sekarang == Fase.PAGI:
		kursor_lapak.show()
		var posisi_mouse   = get_global_mouse_position()
		var kordinat_utama = layer_tanah.local_to_map(posisi_mouse)
		kursor_lapak.global_position = layer_tanah.map_to_local(kordinat_utama) - Vector2(16, 16)

		var area_dibutuhkan = [
			kordinat_utama,
			kordinat_utama + Vector2i(1, 0),
			kordinat_utama + Vector2i(0, 1),
			kordinat_utama + Vector2i(1, 1)
		]

		var bisa_dibangun = true
		for sel in area_dibutuhkan:
			var nabrak_aspal    = layer_jalan.get_cell_source_id(sel) != -1
			var luar_tanah      = layer_tanah.get_cell_source_id(sel) == -1
			var sudah_ada_lapak = sel_terisi.has(sel)
			if nabrak_aspal or luar_tanah or sudah_ada_lapak:
				bisa_dibangun = false
				break

		var capex_aktif = TIER_LAPAK[tipe_lapak_terpilih]["capex"]
		var miskin = total_uang < capex_aktif
		
		kursor_lapak.color = Color(1, 0, 0, 0.5) if (not bisa_dibangun or miskin) else Color(0, 1, 0, 0.5)

		if Input.is_action_just_pressed("ui_click") and bisa_dibangun and not miskin:
			bangun_lapak(kordinat_utama, area_dibutuhkan, tipe_lapak_terpilih)


func bangun_lapak(kordinat_utama, area_dibutuhkan, tipe_lapak: String = "minuman"):
	var jumlah_lapak_sekarang = sel_terisi.values().filter(
		func(v): return not v.ends_with("_sub")
	).size()
	if jumlah_lapak_sekarang >= batas_lapak:
		status_label.text = "Kota baru bisa menampung " + str(batas_lapak) + " lapak dulu!"
		return
		
	if not TIER_LAPAK.has(tipe_lapak): return

	if lapak_scene != null:
		var posisi_terkunci = layer_tanah.map_to_local(kordinat_utama) + Vector2(16, 16)
		var lapak_baru      = lapak_scene.instantiate()
		lapak_baru.global_position = posisi_terkunci

		if lapak_baru.get("harga_barang") != null:
			lapak_baru.harga_barang = TIER_LAPAK[tipe_lapak]["harga"]
		if lapak_baru.get("nama_lapak") != null:
			lapak_baru.nama_lapak = TIER_LAPAK[tipe_lapak]["nama"]

		add_child(lapak_baru)

		var capex      = TIER_LAPAK[tipe_lapak]["capex"]
		total_uang    -= capex
		teks_uang.text = "Rp" + str(total_uang)

		for i in area_dibutuhkan.size():
			var sel = area_dibutuhkan[i]
			if i == 0:
				sel_terisi[sel] = tipe_lapak           
			else:
				sel_terisi[sel] = tipe_lapak + "_sub"  


# ==========================================
# 6. PABRIK NPC & TIMER
# ==========================================
func _on_npc_spawner_timer_timeout():
	if npc_scene == null: return

	var npc_baru = npc_scene.instantiate()
	npc_baru.global_position = Vector2(-50, 270) # PASTIKAN NavigationRegion2D menutupi area ini
	add_child(npc_baru)

	if npc_baru.get("budget") != null:
		npc_baru.budget = int(npc_baru.budget * multiplier_budget)

	catat_pengunjung_baru()

func _on_timer_siang_timeout():
	if fase_sekarang == Fase.SIANG:
		jalankan_fase(Fase.MALAM)


# ==========================================
# 7. SISTEM EVENT HARIAN
# ==========================================
func _tentukan_event_harian():
	var hari_dalam_minggu = (hari_ke - 1) % 7 

	if hari_dalam_minggu >= 5:
		event_hari_ini    = "📅 Hari ini AKHIR PEKAN — Budget pengunjung +30%!"
		multiplier_budget = 1.3
	else:
		event_hari_ini    = "📅 Hari kerja biasa — Kondisi pasar normal."
		multiplier_budget = 1.0

	if hari_ke % 5 == 0:
		event_hari_ini    = "🎉 Hari Pasar Malam Spesial! Budget NPC +50% hari ini!"
		multiplier_budget = 1.5
	elif hari_ke % 7 == 0:
		event_hari_ini    = "🌧️ Cuaca kurang baik — Budget NPC -20% hari ini."
		multiplier_budget = 0.8


# ==========================================
# 8. RESET STATISTIK LAPAK
# ==========================================
func _reset_statistik_semua_lapak():
	for child in get_children():
		if child.has_method("reset_statistik_harian"):
			child.reset_statistik_harian()
