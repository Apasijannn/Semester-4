extends Node2D
# GameScene.gd

@onready var transition = $HUD/Transition
var status_akhir_permainan: String = ""

# --- 1. REFERENSI HUD UTAMA (KIRI ATAS) ---
@onready var label_uang: Label = $HUD/HUD_stats/Money/Label
@onready var label_level: Label = $HUD/HUD_stats/Level/HBoxContainer/Label
@onready var bar_exp: TextureProgressBar = $HUD/HUD_stats/Level/HBoxContainer/TextureProgressBar
@onready var label_hari: Label = $HUD/HUD_stats/Day/HBoxContainer/Label
@onready var ikon_waktu: TextureRect = $HUD/HUD_stats/Day/HBoxContainer/Label/TextureRect
@onready var label_pengunjung: Label = $HUD/HUD_stats/HBoxContainer2/TextureRect/Label
@onready var label_rating: Label = $HUD/HUD_stats/HBoxContainer2/TextureRect2/Label

# --- 2. REFERENSI DUNIA ---
@onready var tilemap_tanah: TileMapLayer = $World/Grass
@onready var dunia_lapak_kontainer: Node2D = $World/Node2D 
@onready var tilemap_jalan: TileMapLayer = $World/Road
@onready var spawner_timer: Timer = $World/Spawner/Timer

# --- 3. REFERENSI UI FASE & REKAP MALAM ---
@onready var tombol_buka_pasar: TextureButton = $HUD/OpenButton
@onready var panel_malam: PanelContainer = $HUD/NightRecap
@onready var tombol_hari_lanjut: TextureButton = $HUD/NightRecap/MarginContainer/VBoxContainer/NextDay

# Elemen dalam Panel Malam 
@onready var judul_hari: Label = $HUD/NightRecap/MarginContainer/VBoxContainer/Day
@onready var label_keuangan: Label = $HUD/NightRecap/MarginContainer/VBoxContainer/Money
@onready var label_opex: Label = $HUD/NightRecap/MarginContainer/VBoxContainer/Opex
@onready var label_saldo: Label = $HUD/NightRecap/MarginContainer/VBoxContainer/Balance
@onready var label_rating_today: Label = $HUD/NightRecap/MarginContainer/VBoxContainer/RatingToday
@onready var label_rating_global: Label = $HUD/NightRecap/MarginContainer/VBoxContainer/RatingGlobal
@onready var label_sukses: Label = $HUD/NightRecap/MarginContainer/VBoxContainer/Analytics
@onready var label_kecewa: Label = $HUD/NightRecap/MarginContainer/VBoxContainer/FailVisitors
@onready var label_total_all: Label = $HUD/NightRecap/MarginContainer/VBoxContainer/TotalVisitors
@onready var label_advisor_text: Label = $HUD/NightRecap/MarginContainer/VBoxContainer/AdvisorText

# --- 4. REFERENSI SHOP CONTAINER ---
@onready var shop_vbox: VBoxContainer = $HUD/ShopDrawer/ShopContainer/MarginContainer/VBoxContainer

# --- DATABASE LAPAK DINAMIS ---
var lapak_scene_master: PackedScene = preload("res://stall.tscn")
var lapak_db: Dictionary = {
	1: {
		"texture_dunia": preload("res://assets/Stalls/drink_stall.png"),
		"harga_beli": 200000,
		"syarat_level": 1
	},
	2: {
		"texture_dunia": preload("res://assets/Stalls/fish_stall.png"),
		"harga_beli": 500000,
		"syarat_level": 5
	},
	3: {
		"texture_dunia": preload("res://assets/Stalls/clothing_stall.png"),
		"harga_beli": 1000000,
		"syarat_level": 10
	}
}

# PABRIK UI
var panel_opsi_scene = preload("res://stall_options_panel.tscn")

# --- VARIABEL DRAG & DROP ---
var is_dragging: bool = false
var ghost_sprite: Sprite2D
var drag_id_sekarang: int = -1
var drag_harga_sekarang: int = 0

# VAR BARU: Memori grid dan validasi
var memori_grid_terisi: Dictionary = {} 
var bisa_dibangun: bool = false
var posisi_map_sekarang: Vector2i

# VAR BARU: Sistem Manajemen Jalan
var sistem_jalan: RefCounted
var npc_scene = preload("res://npc.tscn")

var rekor_aset_tertinggi: int = 0
var target_kemenangan: int = 0

# PENGGUNAAN UNIQUE NAME AGAR TIDAK ERROR SAAT UI DIPINDAH
@onready var label_target: Label = %TargetLabel
@onready var tombol_menu_utama: TextureButton = %MenuButton 
@onready var panel_pengaturan: TextureRect = %SettingsPanel
@onready var win_overlay: ColorRect = %WinOverlay
@onready var lose_overlay: ColorRect = %LoseOverlay
@onready var fade_overlay: ColorRect = %FadeOverlay

func _ready() -> void:
	BackgroundMusic.putar_musik_game()
	transition.play("fade_in")
	
	EconomyManager.reset_sesi_baru()
	TimeManager.reset_waktu() 
	
	label_uang.text = " Rp. " + format_angka_ribuan(EconomyManager.current_money)
	label_hari.text = " Hari : " + str(TimeManager.hari_saat_ini)
	label_pengunjung.text = "0"
	
	ikon_waktu.texture = preload("res://assets/HUD/waktu-pagi.png") 
	panel_malam.visible = false
	
	EconomyManager.money_changed.connect(_on_money_updated)
	EconomyManager.visitor_count_changed.connect(_on_visitor_updated)
	
	tombol_buka_pasar.pressed.connect(TimeManager.mulai_siang)
	# Kita cegat fungsi tombolnya dengan logika kita sendiri
	tombol_hari_lanjut.pressed.connect(_proses_tombol_hari_lanjut)
	
	# Sambungkan juga sinyal bangkrut instan dari EconomyManager
	EconomyManager.game_over_bangkrut.connect(_kalah_bangkrut_instan)
	tombol_hari_lanjut.mouse_entered.connect(_animasi_warna_hover_masuk.bind(tombol_hari_lanjut))
	tombol_hari_lanjut.mouse_exited.connect(_animasi_warna_hover_keluar.bind(tombol_hari_lanjut))
	tombol_hari_lanjut.modulate = Color(1.0, 1.0, 1.0)
	
	ghost_sprite = Sprite2D.new()
	ghost_sprite.modulate = Color(1, 1, 1, 0.5) 
	ghost_sprite.z_index = 100
	ghost_sprite.scale = Vector2(2, 2)
	ghost_sprite.offset = Vector2(8, 8) 
	ghost_sprite.visible = false
	add_child(ghost_sprite)
	
	for tombol in shop_vbox.get_children():
		if tombol.has_signal("lapak_dibeli"):
			tombol.lapak_dibeli.connect(_on_tombol_shop_ditekan)

	TimeManager.fase_berubah.connect(_on_spawner_fase_changed)
	TimeManager.siang_waktu_habis.connect(_on_siang_waktu_habis)
	spawner_timer.timeout.connect(_spawn_npc)
	spawner_timer.stop()
	
	EconomyManager.exp_changed.connect(_update_exp_ui)
	EconomyManager.level_changed.connect(_update_level_ui)
	EconomyManager.level_changed.connect(_update_gembok_toko) 
	
	_update_level_ui(EconomyManager.current_level)
	_update_exp_ui(EconomyManager.current_exp, EconomyManager.exp_to_next_level)
	_update_gembok_toko(EconomyManager.current_level) 
	
	EconomyManager.rating_diperbarui.connect(_update_rating_ui)
	_update_rating_ui(EconomyManager.rating_global)
	
	sistem_jalan = preload("res://scripts/sidewalk_manager.gd").new() 
	var tilemap_grass = $World/Grass
	var tilemap_road = $World/Road
	var boundary = $RoadBoundary
	var shop_container = $HUD/ShopDrawer/ShopContainer/MarginContainer/VBoxContainer
	
	sistem_jalan.setup(self, tilemap_grass, tilemap_road, boundary, shop_container)
	EconomyManager.level_changed.connect(sistem_jalan.on_level_changed)
	
	EconomyManager.money_changed.connect(_update_ui_target)
	
	# --- KONEKSI SENSOR HOVER WARNA MUTLAK ---
	tombol_menu_utama.mouse_entered.connect(_animasi_warna_hover_masuk.bind(tombol_menu_utama))
	tombol_menu_utama.mouse_exited.connect(_animasi_warna_hover_keluar.bind(tombol_menu_utama))
	tombol_menu_utama.modulate = Color(1.0, 1.0, 1.0)
	
	tombol_menu_utama.pressed.connect(_buka_panel_pengaturan)
	
	# --- SUNTIKAN SENSOR HOVER WARNA (TOMBOL BUKA PASAR) MUTLAK ---
	tombol_buka_pasar.mouse_entered.connect(_animasi_warna_hover_masuk.bind(tombol_buka_pasar))
	tombol_buka_pasar.mouse_exited.connect(_animasi_warna_hover_keluar.bind(tombol_buka_pasar))
	tombol_buka_pasar.modulate = Color(1.0, 1.0, 1.0)
	
	# --- PEMICU AWAL TARGET KEMENANGAN MUTLAK ---
	# Paksa mesin menghitung aset dan memunculkan teks di detik ke-0 permainan!
	_hitung_target_kemenangan()
	
func _on_money_updated(new_amount: int) -> void:
	label_uang.text = " Rp. " + format_angka_ribuan(new_amount)

func _on_visitor_updated(new_count: int) -> void:
	label_pengunjung.text = str(new_count)
	
func _update_gembok_toko(level_sekarang: int) -> void:
	for tombol in shop_vbox.get_children():
		if "lapak_id" in tombol:
			var id = int(tombol.lapak_id)
			if lapak_db.has(id):
				var syarat = lapak_db[id]["syarat_level"]
				if level_sekarang < syarat:
					tombol.disabled = true
					tombol.modulate = Color(0.3, 0.3, 0.3, 1.0) 
				else:
					tombol.disabled = false
					tombol.modulate = Color(1.0, 1.0, 1.0, 1.0) 

func _on_tombol_shop_ditekan(id_lapak: int, _harga_dari_tombol: int) -> void:
	if id_lapak == 99:
		sistem_jalan.try_start_placing()
		return 

	var syarat_level = lapak_db[id_lapak]["syarat_level"]
	if EconomyManager.current_level < syarat_level:
		print("Gagal: Lapak ini butuh Level ", syarat_level)
		return
		
	# --- VALIDASI RANTAI PASOKAN MUTLAK ---
	if id_lapak == 2: # Makanan
		if _hitung_lapak_aktif(1) < 2:
			print("DITOLAK: Bangun minimal 2 lapak Minuman dulu!")
			return
	elif id_lapak == 3: # Pakaian
		if _hitung_lapak_aktif(1) < 2 or _hitung_lapak_aktif(2) < 2:
			print("DITOLAK: Bangun minimal 2 Minuman & 2 Makanan dulu!")
			return

	var harga_mutlak = lapak_db[id_lapak]["harga_beli"]
	
	if TimeManager.fase_saat_ini == TimeManager.Fase.PAGI and EconomyManager.can_afford(harga_mutlak):
		is_dragging = true
		drag_id_sekarang = id_lapak
		drag_harga_sekarang = harga_mutlak 
		
		ghost_sprite.texture = lapak_db[id_lapak]["texture_dunia"]
		ghost_sprite.visible = true
	else:
		print("Dilarang membangun! Uang kurang atau bukan fase pagi.")

func _process(_delta: float) -> void:
	if is_dragging:
		var mouse_global_pos = get_global_mouse_position()
		posisi_map_sekarang = tilemap_tanah.local_to_map(tilemap_tanah.to_local(mouse_global_pos))
		var snap_pos = tilemap_tanah.to_global(tilemap_tanah.map_to_local(posisi_map_sekarang))
		ghost_sprite.global_position = snap_pos

		bisa_dibangun = true
		var lebar_lapak = 2
		var tinggi_lapak = 4 
		
		var area_lapak = []
		for x in range(lebar_lapak):
			for y in range(tinggi_lapak):
				area_lapak.append(posisi_map_sekarang + Vector2i(x, y))
		
		for cell in area_lapak:
			if memori_grid_terisi.has(cell):
				bisa_dibangun = false
				break 
				
		if bisa_dibangun:
			for cell in area_lapak:
				if is_instance_valid(sistem_jalan) and sistem_jalan.is_cell_paved(cell):
					bisa_dibangun = false
					break
				
		if bisa_dibangun:
			var bersentuhan_dengan_jalan = false
			var radar_bawah_1 = posisi_map_sekarang + Vector2i(0, tinggi_lapak)
			var radar_bawah_2 = posisi_map_sekarang + Vector2i(1, tinggi_lapak)
			
			if is_instance_valid(sistem_jalan):
				if sistem_jalan.is_cell_paved(radar_bawah_1) or sistem_jalan.is_cell_paved(radar_bawah_2):
					bersentuhan_dengan_jalan = true
				
			if not bersentuhan_dengan_jalan:
				bisa_dibangun = false
				
		if bisa_dibangun:
			ghost_sprite.modulate = Color(0, 1, 0, 0.6) 
		else:
			ghost_sprite.modulate = Color(1, 0, 0, 0.6) 
		pass
		
	if is_instance_valid(sistem_jalan):
		sistem_jalan.process_preview()

	# --- PENGECEKAN PULANG NPC MUTLAK ---
	if TimeManager.fase_saat_ini == TimeManager.Fase.SIANG and TimeManager.is_siang_timer_habis:
		var sisa_npc = get_tree().get_nodes_in_group("npc")
		if sisa_npc.size() == 0:
			TimeManager.pemicu_malam()

func _input(event: InputEvent) -> void:
	if is_instance_valid(sistem_jalan) and sistem_jalan.handle_input(event):
			return 
	if is_dragging:
		if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
			if bisa_dibangun:
				_tempatkan_lapak()
			else:
				print("Gagal: Area tertutup bangunan lain!")
			
		if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_RIGHT and event.pressed:
			_batalkan_drag()

func _tempatkan_lapak() -> void:
	if not bisa_dibangun:
		return
			
	if EconomyManager.beli_lapak(drag_harga_sekarang):
		var lapak_baru = lapak_scene_master.instantiate()
		var tekstur_terpilih = lapak_db[drag_id_sekarang]["texture_dunia"]
		lapak_baru.setup_data(drag_id_sekarang, tekstur_terpilih)
		
		lapak_baru.global_position = ghost_sprite.global_position
		
		var lebar_lapak = 2
		var tinggi_lapak = 4
		var area_lapak = []
		for x in range(lebar_lapak):
			for y in range(tinggi_lapak):
				area_lapak.append(posisi_map_sekarang + Vector2i(x, y))
				
		lapak_baru.sel_grid_terpakai = area_lapak 
		dunia_lapak_kontainer.add_child(lapak_baru)
		
			
		print("Lapak dibangun!")
		BackgroundMusic.play_sfx_placement()
		_batalkan_drag()
		# --- PEMBARUAN TARGET INSTAN MUTLAK ---
		# Paksa mesin menghitung ulang valuasi pasar detik ini juga!
		_hitung_target_kemenangan()
	else:
		print("Transaksi gagal, uang tiba-tiba tidak cukup.")

func _batalkan_drag() -> void:
	is_dragging = false
	ghost_sprite.visible = false
	drag_id_sekarang = -1
	drag_harga_sekarang = 0

func _on_spawner_fase_changed(fase_baru: int) -> void:
	match fase_baru:
		TimeManager.Fase.PAGI:
			label_hari.text = " Hari : " + str(TimeManager.hari_saat_ini)
			ikon_waktu.texture = preload("res://assets/HUD/waktu-pagi.png") 
			EconomyManager.reset_data_harian()
			
			panel_malam.visible = false
			tombol_buka_pasar.visible = true
			$HUD/ShopDrawer.visible = true
			spawner_timer.stop()
			
		TimeManager.Fase.SIANG:
			label_hari.text = " Hari : " + str(TimeManager.hari_saat_ini)
			ikon_waktu.texture = preload("res://assets/HUD/waktu-siang.png") 
			tombol_buka_pasar.visible = false
			_batalkan_drag() 
			_hitung_target_kemenangan() 
			spawner_timer.start()
			
		TimeManager.Fase.MALAM:
			label_hari.text = " Hari : " + str(TimeManager.hari_saat_ini)
			ikon_waktu.texture = preload("res://assets/HUD/waktu-malam.png") 
			$HUD/ShopDrawer.visible = false
			
			# --- SINKRONISASI DATA MUTLAK ---
			# Pengunjung sudah dipastikan habis karena kita menunggu di _process
				
			var jumlah_lapak = get_tree().get_nodes_in_group("stall_aoe").size()
			# --- MESIN PAJAK OPEX PROGRESIF ---
			var total_opex = 25000 # Retribusi dasar kebersihan pasar
			var semua_lapak = get_tree().get_nodes_in_group("stall_aoe")
			
			for lapak in semua_lapak:
				if "lapak_id" in lapak:
					match lapak.lapak_id:
						1: total_opex += 15000
						2: total_opex += 20000
						3: total_opex += 25000
						
			var laporan = EconomyManager.proses_tutup_buku(total_opex)
			
			judul_hari.text = "Rekapitulasi Hari Ke-" + str(TimeManager.hari_saat_ini)
			
			label_keuangan.text = "Pendapatan: Rp " + format_angka_ribuan(laporan.pendapatan)
			label_opex.text = "Biaya Operasional: -Rp " + format_angka_ribuan(laporan.opex)
			label_saldo.text = "Saldo Akhir: Rp " + format_angka_ribuan(EconomyManager.current_money)
			
			var tanda = "+" if laporan.selisih >= 0 else ""
			label_rating_today.text = "Perubahan Rating: " + tanda + str("%.2f" % laporan.selisih)
			label_rating_global.text = "Rating Saat Ini: " + str("%.1f" % laporan.rating_baru) + " ⭐"
			
			label_sukses.text = "Pengunjung Sukses: " + str(EconomyManager.npc_sukses_hari_ini)
			label_kecewa.text = "Pengunjung Kecewa: " + str(EconomyManager.npc_kecewa_hari_ini)
			label_total_all.text = "Total Pengunjung (All-Time): " + str(EconomyManager.total_akumulasi_pengunjung)
			
			# --- EKSEKUSI SIDAK PAGUYUBAN MUTLAK ---
			var evaluasi_paguyuban = _evaluasi_aturan_paguyuban()
			_hitung_target_kemenangan() 
			
			# --- VONIS MUTLAK HARI KE-30 ---
			if TimeManager.hari_saat_ini >= 30:
				if EconomyManager.current_money >= target_kemenangan:
					label_advisor_text.text = "🏆 KEMENANGAN ABSOLUT 🏆\nKamu berhasil melampaui target valuasi aset pasar (Rp " + str(target_kemenangan) + ") dengan saldo tunai Rp " + str(EconomyManager.current_money) + ". Bisnismu tak tertandingi!"
					label_advisor_text.add_theme_color_override("font_color", Color.GREEN)
					status_akhir_permainan = "win"
				else:
					label_advisor_text.text = "💥 BANGKRUT! 💥\nWaktu habis. Di Hari ke-30, uang tunaimu gagal mencapai target. Terlalu banyak investasi mati!"
					label_advisor_text.add_theme_color_override("font_color", Color.RED)
					status_akhir_permainan = "lose"
				
				# JANGAN SEMBUNYIKAN TOMBOLNYA! Biarkan pemain klik untuk pindah scene.
				tombol_hari_lanjut.visible = true 
				panel_malam.visible = true
				return 
				
			# --- SISA KODE PENGECEKAN NORMAL (JIKA BUKAN HARI 30) ---
			label_advisor_text.add_theme_color_override("font_color", Color(0.0, 0.0, 0.0))
			
			if evaluasi_paguyuban["status"] == "game_over":
				label_advisor_text.text = evaluasi_paguyuban["pesan"]
				label_advisor_text.add_theme_color_override("font_color", Color.RED)
				status_akhir_permainan = "lose"
				tombol_hari_lanjut.visible = true # Jangan disembunyikan!
				
			elif evaluasi_paguyuban["status"] == "warning":
				var ai_result = get_ai_advice(TimeManager.hari_saat_ini + 1, EconomyManager.current_level, EconomyManager.rating_global)
				label_advisor_text.text = evaluasi_paguyuban["pesan"] + "\n---Saran Harian---\n" + laporan.advisor + "\n\n" + ai_result["pesan"]
				label_advisor_text.add_theme_color_override("font_color", Color.YELLOW)
				tombol_hari_lanjut.visible = true
				
			else:
				var ai_result = get_ai_advice(TimeManager.hari_saat_ini + 1, EconomyManager.current_level, EconomyManager.rating_global)
				label_advisor_text.text = laporan.advisor + "\n\n" + ai_result["pesan"]
				tombol_hari_lanjut.visible = true
			
			panel_malam.visible = true

func _spawn_npc():
	var new_npc = npc_scene.instantiate()
	var spawn_pos = $World/Spawner.global_position 
	
	var random_tipe = randi_range(1, 6)
	$World/Node2D.add_child(new_npc) 
	new_npc.setup_npc(spawn_pos, random_tipe)
	
	EconomyManager.catat_pengunjung_masuk()
	
	var rating = EconomyManager.rating_global
	var persentase_rating = rating / 5.0
	
	var batas_bawah = lerp(3.0, 0.5, persentase_rating)
	var batas_atas = lerp(4.5, 1.2, persentase_rating)
	
	var waktu_acak = randf_range(batas_bawah, batas_atas)
	
	spawner_timer.wait_time = waktu_acak
	spawner_timer.start()

func _update_exp_ui(current: float, max_exp: float) -> void:
	bar_exp.max_value = max_exp
	var tween = create_tween()
	tween.tween_property(bar_exp, "value", current, 0.3).set_trans(Tween.TRANS_QUAD)

func _update_level_ui(level: int) -> void:
	if label_level.text != " Level " + str(level):
		label_level.text = " Level " + str(level)
		if level > 1: # Jangan bunyikan saat inisialisasi level 1
			BackgroundMusic.play_sfx_levelup()

func _update_rating_ui(rating: float) -> void:
	label_rating.text = str("%.1f" % rating)

func bebaskan_memori_tanah(array_sel: Array) -> void:
	for cell in array_sel:
		memori_grid_terisi.erase(cell)
	print("Tanah berhasil dikosongkan. Siap dibangun kembali.")

func buka_opsi_lapak(lapak_ref: Node2D) -> void:
	if is_instance_valid(lapak_ref.panel_opsi_aktif):
		return
		
	var panel_baru = panel_opsi_scene.instantiate()
	$HUD.add_child(panel_baru)
	lapak_ref.panel_opsi_aktif = panel_baru
	panel_baru.buka_opsi_lapak(lapak_ref)

func format_angka_ribuan(angka: int) -> String:
	var string_angka := str(angka)
	var hasil := ""
	var panjang := string_angka.length()
	
	for i in range(panjang):
		if i > 0 and i % 3 == 0:
			hasil = "." + hasil
		hasil = string_angka[panjang - 1 - i] + hasil
		
	return hasil

func _hitung_lapak_aktif(id_target: int) -> int:
	var jumlah = 0
	for lapak in dunia_lapak_kontainer.get_children():
		if "lapak_id" in lapak and lapak.lapak_id == id_target:
			jumlah += 1
	return jumlah

func _evaluasi_aturan_paguyuban() -> Dictionary:
	var level = EconomyManager.current_level
	
	if level < 5:
		return {"status": "aman", "pesan": ""}

	var base_level = (level / 5) * 5
	var batas_level_kalah = base_level + 3

	var butuh_minuman = (base_level / 5) + 1
	var butuh_makanan = (base_level / 5) 
	var butuh_pakaian = max(0, (base_level / 5) - 1)

	var punya_minuman = _hitung_lapak_aktif(1)
	var punya_makanan = _hitung_lapak_aktif(2)
	var punya_pakaian = _hitung_lapak_aktif(3)

	var aman = (punya_minuman >= butuh_minuman) and (punya_makanan >= butuh_makanan) and (punya_pakaian >= butuh_pakaian)

	if aman:
		return {"status": "aman", "pesan": ""}

	var teks_kurang = ""
	if punya_minuman < butuh_minuman: teks_kurang += "- Kurang " + str(butuh_minuman - punya_minuman) + " Lapak Minuman\n"
	if punya_makanan < butuh_makanan: teks_kurang += "- Kurang " + str(butuh_makanan - punya_makanan) + " Lapak Makanan\n"
	if punya_pakaian < butuh_pakaian: teks_kurang += "- Kurang " + str(butuh_pakaian - punya_pakaian) + " Lapak Pakaian\n"

	if level >= batas_level_kalah:
		return {
			"status": "game_over",
			"pesan": "🚨 GAME OVER! 🚨\nPaguyuban menyita lahanmu karena gagal memenuhi standar ekspansi pasar.\n" + teks_kurang
		}
	else:
		var sisa_waktu = batas_level_kalah - level
		return {
			"status": "warning",
			"pesan": "⚠️ PERINGATAN PAGUYUBAN ⚠️\nEkspansi wajib sebelum mencapai Level " + str(batas_level_kalah) + " (Sisa " + str(sisa_waktu) + " Level toleransi).\n" + teks_kurang
		}

func _hitung_target_kemenangan() -> void:
	var total_aset = 0
	var semua_lapak = get_tree().get_nodes_in_group("stall_aoe")
	
	for lapak in semua_lapak:
		if "harga_bangunan" in lapak:
			var nilai = lapak.harga_bangunan
			total_aset += nilai
			
	if total_aset > rekor_aset_tertinggi:
		rekor_aset_tertinggi = total_aset
		
	target_kemenangan = int(rekor_aset_tertinggi * 1.5)
	
	_update_ui_target(EconomyManager.current_money)

func _update_ui_target(uang_sekarang: int) -> void:
	if not is_instance_valid(label_target): return
	
	label_target.text = "Target (Hari 30): Rp " + str(target_kemenangan)
	
	if target_kemenangan > 0 and uang_sekarang >= target_kemenangan:
		label_target.add_theme_color_override("font_color", Color.GREEN)
	else:
		label_target.add_theme_color_override("font_color", Color.YELLOW)

func _buka_panel_pengaturan() -> void:
	panel_pengaturan.show()
	get_tree().paused = true

# --- MESIN ANIMASI HOVER WARNA MUTLAK ---
func _animasi_warna_hover_masuk(tombol: TextureButton) -> void:
	var tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	tween.tween_property(tombol, "modulate", Color(0.8, 0.8, 0.8), 0.1)
	
func _animasi_warna_hover_keluar(tombol: TextureButton) -> void:
	var tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	tween.tween_property(tombol, "modulate", Color(1.0, 1.0, 1.0), 0.1)

# --- MESIN TRANSISI SCENE MUTLAK ---
# --- MESIN TRANSISI SCENE MUTLAK ---
func _proses_tombol_hari_lanjut() -> void:
	if status_akhir_permainan == "win":
		panel_malam.hide() # Sembunyikan UI rekap malam
		win_overlay.show() # Tampilkan overlay kemenangan
		_eksekusi_ending() # Jalankan mesin waktu & transisi
		
	elif status_akhir_permainan == "lose":
		panel_malam.hide() # Sembunyikan UI rekap malam
		lose_overlay.show() # Tampilkan overlay kekalahan
		_eksekusi_ending()
		
	else:
		# Jika belum tamat, jalankan hari esok secara normal
		TimeManager.lanjut_hari_esok()

func _kalah_bangkrut_instan() -> void:
	# Terpicu otomatis jika EconomyManager mendeteksi uang minus 3 hari berturut-turut
	status_akhir_permainan = "lose"
	panel_malam.hide()
	lose_overlay.show()
	_eksekusi_ending()

# --- SUTRADARA ANIMASI FADE OUT ---
func _eksekusi_ending() -> void:
	# 1. Tunggu 3 detik untuk pemain meresapi kemenangan/kekalahannya
	await get_tree().create_timer(3.0).timeout
	
	# 2. Persiapkan tirai hitam (Pastikan awalnya transparan)
	fade_overlay.modulate.a = 0.0
	fade_overlay.show()
	
	# 3. Animasikan tirai hitam menjadi pekat dalam 1.5 detik
	var tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	tween.tween_property(fade_overlay, "modulate:a", 1.0, 1.5)
	
	# 4. Tunggu sampai animasi menggelapnya benar-benar selesai
	await tween.finished
	
	# 5. Setelah layar hitam sempurna, pindah ke Credit Scene
	get_tree().change_scene_to_file("res://credit_scene.tscn")

func _on_siang_waktu_habis() -> void:
	spawner_timer.stop()
	print("Spawner dihentikan. Menunggu sisa pengunjung.")

func get_ai_advice(hari_besok: int, level: int, rating: float) -> Dictionary:
	var script_path = ProjectSettings.globalize_path("res://scripts/predict.py")
	var args = [script_path, str(hari_besok), str(level), str(rating)]
	var output = []
	
	# Jalankan script Python (mencoba python3 lalu python)
	var exit_code = OS.execute("python3", args, output)
	
	# Jika python3 tidak ditemukan atau error, coba 'python' saja (umum di Windows)
	if exit_code != 0 or output.is_empty():
		output.clear()
		exit_code = OS.execute("python", args, output)
		
	if output.size() > 0:
		var raw_output = output[0].strip_edges()
		# Cari bagian JSON jika ada teks lain sebelumnya (misal warning)
		var json_start = raw_output.find("{")
		if json_start != -1:
			var json_str = raw_output.substr(json_start)
			var json = JSON.new()
			var error = json.parse(json_str)
			if error == OK:
				return json.get_data()
	
	return {"pesan": "AI Advisor: Gagal mengambil saran. Pastikan Python & library (pandas, scikit-learn) terinstal."}
