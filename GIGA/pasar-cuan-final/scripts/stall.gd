extends Area2D
# stall.gd

# --- DATA MANAJEMEN ---
var lapak_id: int = 0
var tekstur_lapak: Texture2D
var nama_lapak: String = "Lapak Baru"
var harga_jual: int = 0
var waktu_layanan: float = 3.0 
var harga_dasar: int = 0
var harga_bangunan: int = 0
var panel_opsi_aktif: Node = null

var sel_grid_terpakai: Array = []

var daftar_antrean: Array[Node2D] = []

@onready var name_tag: Label = $NameTag
@onready var sprite: Sprite2D = $Sprite2D
@onready var titik_antre: Marker2D = $QueuePoint
@onready var lampu: PointLight2D = $StallLamp

func _ready() -> void:
	if tekstur_lapak:
		sprite.texture = tekstur_lapak
	
	ubah_nama_lapak(nama_lapak)
	body_entered.connect(_on_npc_masuk)
	input_event.connect(_on_input_event)
	TimeManager.fase_berubah.connect(_on_waktu_berubah)
	lampu.energy = 0.0
	
func setup_data(id: int, tekstur_baru: Texture2D) -> void:
	lapak_id = id
	tekstur_lapak = tekstur_baru
	match id:
		1: 
			harga_dasar = 5000   # Minuman
			nama_lapak = "Minuman"
			harga_bangunan = 200000
		2: 
			harga_dasar = 20000   # Makanan
			nama_lapak = "Makanan"
			harga_bangunan = 500000
		3: 
			harga_dasar = 60000   # Pakaian
			nama_lapak = "Pakaian" 
			harga_bangunan = 1000000
		_: 
			harga_dasar = 10000
			nama_lapak = "Lapak Misterius"
			harga_bangunan = 100000
			
	harga_jual = harga_dasar
	ubah_nama_lapak(nama_lapak)
	
func _on_npc_masuk(body: Node2D) -> void:
	if body.is_in_group("npc"):
		print("NPC melintasi Lapak ID: ", lapak_id)

# --- SENSOR UI PENGATURAN LAPAK ---
func _on_input_event(_viewport: Node, event: InputEvent, _shape_idx: int) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
		
		# KUNCI MUTLAK: Hanya bisa berinteraksi di Fase Pagi (Fase Merakit)
		if TimeManager.fase_saat_ini == TimeManager.Fase.PAGI:
			get_tree().call_group("ui_manager", "buka_opsi_lapak", self)
		else:
			print("Pasar sudah buka! Tidak bisa mengubah harga di tengah operasional.")

# --- LOGIKA ANTREAN DINAMIS ---

func ikut_antre(npc: Node2D) -> void:
	daftar_antrean.append(npc)
	_update_posisi_semua_antrean()

# Dipanggil oleh NPC saat selesai transaksi
func selesai_antre(npc: Node2D) -> void:
	if npc in daftar_antrean:
		daftar_antrean.erase(npc)
		_update_posisi_semua_antrean()

# Fungsi cerdas: Memberitahu SETIAP orang di antrean posisi baru mereka
func _update_posisi_semua_antrean() -> void:
	daftar_antrean = daftar_antrean.filter(func(n): return is_instance_valid(n))
	
	for i in range(daftar_antrean.size()):
		var npc = daftar_antrean[i]
		
		# Jarak antar pengunjung di antrean 
		var target_pos = titik_antre.global_position + Vector2(0, i * 15)
		var is_depan = (i == 0)
		
		if npc.has_method("update_posisi_antrean"):
			npc.update_posisi_antrean(target_pos, is_depan)

func ubah_nama_lapak(nama_baru: String) -> void:
	nama_lapak = nama_baru
	if is_instance_valid(name_tag):
		name_tag.text = nama_lapak

func _on_waktu_berubah(fase_baru: int) -> void:
	var tween_lampu = create_tween()
	
	match fase_baru:
		TimeManager.Fase.PAGI:
			# Matikan lampu di pagi hari secara perlahan
			tween_lampu.tween_property(lampu, "energy", 0.0, 1.0)
			
		TimeManager.Fase.SIANG:
			# Asumsi: Jika durasi siangmu adalah 30 detik (Sesuaikan angkanya!)
			var durasi_siang = 30.0 
			var waktu_tunggu = durasi_siang * 0.5 
			var waktu_menyala = durasi_siang * 0.5 

			tween_lampu.tween_interval(waktu_tunggu)
			tween_lampu.tween_property(lampu, "energy", 1.0, waktu_menyala).set_trans(Tween.TRANS_SINE)
			
		TimeManager.Fase.MALAM:
			lampu.energy = 1.0
