extends Node
# EconomyManager.gd (Autoload)

# Sinyal untuk memberitahu UI
signal money_changed(new_amount: int)
signal game_over_bangkrut() 
signal visitor_count_changed(new_count: int)

# --- SINYAL UI ---
signal exp_changed(current_exp: float, max_exp: float)
signal level_changed(new_level: int)
signal rating_diperbarui(rating_realtime: float)

# Inisiasi awal
const STARTING_MONEY: int = 250000

var current_money: int = STARTING_MONEY :
	set(value):
		current_money = value
		money_changed.emit(current_money)

# --- VARIABEL REKAP HARIAN (Sesuai GDD) ---
var biaya_operasional_harian: int = 150
var pendapatan_hari_ini: int = 0
var npc_sukses_hari_ini: int = 0
var npc_kecewa_hari_ini: int = 0
var total_pengunjung_hari_ini: int = 0

# var hari_minus_berturut: int = 0 
var current_level: int = 1
var current_exp: float = 0.0
var exp_to_next_level: float = 100.0 

const BASE_XP: float = 100.0
const EXPO_FACTOR: float = 1.3

var rating_global: float = 0.5 
var rating_awal_hari: float = 0.5 
var total_akumulasi_pengunjung: int = 0
var total_akumulasi_sukses: int = 0
var total_akumulasi_kecewa: int = 0

# --- 1. LOGIKA PEMBANGUNAN (FASE PAGI) ---

func can_afford(harga_spesifik: int) -> bool:
	return current_money >= harga_spesifik

func beli_lapak(harga_spesifik: int) -> bool:
	if can_afford(harga_spesifik):
		current_money -= harga_spesifik
		return true
	return false

# --- 2. LOGIKA TRANSAKSI (FASE SIANG) ---

func catat_transaksi(jumlah: int) -> void:
	pendapatan_hari_ini += jumlah
	current_money += jumlah
	money_changed.emit(current_money)
	
	var xp_didapat: float = float(jumlah) / 500.0
	_tambah_exp(xp_didapat)

func catat_npc_sukses():
	npc_sukses_hari_ini += 1
	total_akumulasi_sukses += 1
	total_akumulasi_pengunjung += 1
	_recalculate_rating_realtime()

func catat_npc_kecewa():
	npc_kecewa_hari_ini += 1
	total_akumulasi_kecewa += 1
	total_akumulasi_pengunjung += 1
	_recalculate_rating_realtime()

# --- 3. LOGIKA REKAPITULASI (FASE MALAM & PAGI BARU) ---

func proses_rekap_malam() -> void:
	current_money -= biaya_operasional_harian
	
func catat_pengunjung_masuk() -> void:
	total_pengunjung_hari_ini += 1
	visitor_count_changed.emit(total_pengunjung_hari_ini)

func reset_data_harian() -> void:
	pendapatan_hari_ini = 0
	npc_sukses_hari_ini = 0
	npc_kecewa_hari_ini = 0
	total_pengunjung_hari_ini = 0
	visitor_count_changed.emit(total_pengunjung_hari_ini)
	rating_diperbarui.emit(rating_global)
	
	rating_awal_hari = rating_global

# --- 4. MESIN MATEMATIKA LEVELING ---

func get_target_xp(level: int) -> float:
	return BASE_XP * pow(float(level), EXPO_FACTOR)

func _tambah_exp(jumlah_xp: float) -> void:
	current_exp += jumlah_xp
	exp_to_next_level = get_target_xp(current_level)
	
	while current_exp >= exp_to_next_level:
		current_exp -= exp_to_next_level 
		current_level += 1
		level_changed.emit(current_level)
		
		exp_to_next_level = get_target_xp(current_level)
		print("LEVEL UP MUTLAK! Sekarang Level: ", current_level, " | Target XP baru: ", exp_to_next_level)
		
	exp_changed.emit(current_exp, exp_to_next_level)

# --- 5. LOGIKA RATING MALAM ---

func proses_tutup_buku(tagihan_opex: int) -> Dictionary:
	current_money -= tagihan_opex
	money_changed.emit(current_money)
	
	var profit_bersih = pendapatan_hari_ini - tagihan_opex
	var teks_saran = ""
	
	if (npc_sukses_hari_ini + npc_kecewa_hari_ini) == 0:
		teks_saran = "Pasar mati. Pastikan lapakmu bersentuhan dengan jalan aspal."
	elif profit_bersih < 0:
		teks_saran = "Beban Operasional (Rp " + str(tagihan_opex) + ") mencekik lehermu! Kamu rugi hari ini. Jual lapak yang sepi pengunjung."
	elif npc_kecewa_hari_ini > npc_sukses_hari_ini:
		teks_saran = "Pengunjung kecewa karena antrean panjang. Kamu harus upgrade lapak atau atur tata letaknya."
	else:
		teks_saran = "Manajemen finansial yang solid. Keuntungan bersihmu hari ini positif."

	var selisih_rating = rating_global - rating_awal_hari

	return {
		"opex": tagihan_opex,
		"pendapatan": pendapatan_hari_ini,
		"rating_baru": rating_global,
		"advisor": teks_saran,
		"selisih": selisih_rating 
	}
	
func _hitung_rating_realtime() -> void:
	var total = npc_sukses_hari_ini + npc_kecewa_hari_ini
	var rating_sementara = rating_global
	
	if total > 0:
		rating_sementara = (float(npc_sukses_hari_ini) / float(total)) * 5.0
		
	rating_diperbarui.emit(rating_sementara)

func reset_sesi_baru() -> void:
	current_money = STARTING_MONEY
	current_level = 1
	current_exp = 0.0
	exp_to_next_level = get_target_xp(1)
	rating_global = 0.5 
	rating_awal_hari = 0.5 
	# hari_minus_berturut = 0
	total_akumulasi_pengunjung = 0
	total_akumulasi_sukses = 0
	total_akumulasi_kecewa = 0
	reset_data_harian()
	print("EconomyManager: Ingatan sesi sebelumnya telah dihapus total.")

func _recalculate_rating_realtime():
	var total_all_visitors = total_akumulasi_sukses + total_akumulasi_kecewa
	
	if total_all_visitors > 0:
		rating_global = (float(total_akumulasi_sukses) / float(total_all_visitors)) * 5.0
	else:
		rating_global = 0.0
	
	rating_diperbarui.emit(rating_global)
