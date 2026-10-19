extends Area2D

# ==========================================
# KONFIGURASI LAPAK (bisa diset di Inspector)
# ==========================================
@export var harga_barang: int = 5000
@export var nama_lapak: String = "Lapak"
@export var teks_melayang_scene: PackedScene

# ==========================================
# SISTEM ANTREAN
# ==========================================
var antrean: Array = []
var sedang_melayani: bool = false

const DURASI_LAYANAN: float = 0.8

# ==========================================
# STATISTIK PER LAPAK
# Dihitung dari NPC yang masuk AoE lapak ini
# ==========================================
var total_evaluasi: int  = 0  # semua NPC yang masuk AoE
var total_pembeli: int   = 0  # yang berhasil transaksi
var total_tolak_harga: int    = 0
var total_tolak_antrean: int  = 0
var total_tolak_intention: int = 0


# ==========================================
# TRIGGER AoE — Inti logika ABM
# Dipanggil Godot tiap kali CharacterBody2D masuk Area2D
# ==========================================
func _on_body_entered(body: Node2D):
	if not body.is_in_group("pelanggan"):
		return

	var npc = body
	var game = _get_game_manager()
	if game == null:
		return

	# Catat bahwa NPC ini masuk ke dalam AoE lapak
	# (berbeda dari "pengunjung" yang dihitung saat spawn)
	total_evaluasi += 1

	# ── EVALUASI 1: Budget ─────────────────
	if npc.budget < harga_barang:
		total_tolak_harga += 1
		game.catat_hasil_evaluasi(false, 0, "harga")
		_tampilkan_teks("💸", Color(1, 0.4, 0.4))
		return

	# ── EVALUASI 2: Antrean ────────────────
	if antrean.size() >= npc.patience:
		total_tolak_antrean += 1
		game.catat_hasil_evaluasi(false, 0, "antrean")
		_tampilkan_teks("😤", Color(1, 0.6, 0))
		return

	# ── EVALUASI 3: Intention ──────────────
	if randf() > npc.intention:
		total_tolak_intention += 1
		game.catat_hasil_evaluasi(false, 0, "tidak_tertarik")
		return

	# ── LOLOS SEMUA EVALUASI → Masuk antrean
	_tambahkan_ke_antrean(npc)


# ==========================================
# MANAJEMEN ANTREAN
# ==========================================
func _tambahkan_ke_antrean(npc):
	npc.state = npc.State.ANTRI
	npc.lapak_target = self
	antrean.append(npc)

	if not sedang_melayani:
		_proses_antrean()


func _proses_antrean():
	if antrean.is_empty():
		sedang_melayani = false
		return

	sedang_melayani = true
	var npc = antrean[0]

	if not is_instance_valid(npc):
		antrean.remove_at(0)
		_proses_antrean()
		return

	await get_tree().create_timer(DURASI_LAYANAN).timeout
	_selesaikan_transaksi(npc)


func _selesaikan_transaksi(npc):
	if not is_instance_valid(npc):
		if not antrean.is_empty():
			antrean.remove_at(0)
		_proses_antrean()
		return

	var idx = antrean.find(npc)
	if idx != -1:
		antrean.remove_at(idx)

	npc.selesai_transaksi()

	total_pembeli += 1

	var game = _get_game_manager()
	if game:
		game.catat_hasil_evaluasi(true, harga_barang, "sukses")

	_tampilkan_teks("+Rp" + str(harga_barang), Color(0.2, 1, 0.3))
	_proses_antrean()


# ==========================================
# HELPER
# ==========================================
func kosongkan_antrean():
	for npc in antrean:
		if is_instance_valid(npc):
			npc.batalkan_antri()
	antrean.clear()
	sedang_melayani = false


func reset_statistik_harian():
	total_evaluasi        = 0
	total_pembeli         = 0
	total_tolak_harga     = 0
	total_tolak_antrean   = 0
	total_tolak_intention = 0


func get_panjang_antrean() -> int:
	return antrean.size()


# Konversi per lapak = pembeli / NPC yang masuk AoE lapak ini
func get_konversi_lapak() -> float:
	if total_evaluasi == 0:
		return 0.0
	return (float(total_pembeli) / float(total_evaluasi)) * 100.0


func _get_game_manager() -> Node:
	var scene_root = get_tree().current_scene
	if scene_root and scene_root.has_method("catat_hasil_evaluasi"):
		return scene_root
	if get_parent() and get_parent().has_method("catat_hasil_evaluasi"):
		return get_parent()
	push_error("Lapak '%s': game_manager tidak ditemukan!" % nama_lapak)
	return null


func _tampilkan_teks(pesan: String, warna: Color):
	if teks_melayang_scene == null:
		return
	var teks = teks_melayang_scene.instantiate()
	teks.global_position = self.global_position
	get_tree().current_scene.add_child(teks)
	teks.setup(pesan, warna)
