extends TextureRect

@onready var name_input: LineEdit = $NameInput
@onready var price_label: Label = $VBoxContainer/PriceLabel
@onready var price_slider: HSlider = $VBoxContainer/PriceSlider
@onready var delete_btn: TextureButton = $VBoxContainer/DeleteButton
@onready var close_btn: TextureButton = $VBoxContainer/CloseButton
@onready var delete_label: Label = $VBoxContainer/DeleteButton/DeleteLabel

var lapak_aktif: Node2D = null

func _ready() -> void:
	price_slider.value_changed.connect(_on_slider_geser)
	name_input.text_changed.connect(_on_nama_berubah)
	close_btn.pressed.connect(_tutup_panel)
	delete_btn.pressed.connect(_bongkar_lapak)

	delete_btn.mouse_entered.connect(_animasi_warna_hover_masuk.bind(delete_btn))
	delete_btn.mouse_exited.connect(_animasi_warna_hover_keluar.bind(delete_btn))
	delete_btn.modulate = Color(1.0, 1.0, 1.0)
	
	close_btn.mouse_entered.connect(_animasi_warna_hover_masuk.bind(close_btn))
	close_btn.mouse_exited.connect(_animasi_warna_hover_keluar.bind(close_btn))
	close_btn.modulate = Color(1.0, 1.0, 1.0)
	
	hide()

func buka_opsi_lapak(lapak_ref: Node2D) -> void:
	lapak_aktif = lapak_ref
	
	price_slider.set_block_signals(true)
	
	price_slider.min_value = lapak_aktif.harga_dasar * 0.5
	price_slider.max_value = lapak_aktif.harga_dasar * 2.0
	price_slider.step = 1000 
	price_slider.value = lapak_aktif.harga_jual
	
	name_input.text = lapak_aktif.nama_lapak
	
	price_label.text = "Harga: Rp " + str(int(price_slider.value))
	
	var nilai_jual = int(lapak_aktif.harga_bangunan * 0.8)
	delete_label.text = "Jual (+" + str(nilai_jual) + ")"
	
	price_slider.set_block_signals(false)
	show()

func _on_slider_geser(nilai_baru: float) -> void:
	if is_instance_valid(lapak_aktif):
		lapak_aktif.harga_jual = int(nilai_baru)
		price_label.text = "Harga: Rp " + str(int(lapak_aktif.harga_jual))

func _on_nama_berubah(teks_baru: String) -> void:
	if teks_baru.strip_edges() == "":
		return
		
	if is_instance_valid(lapak_aktif):
		lapak_aktif.ubah_nama_lapak(teks_baru)

func _bongkar_lapak() -> void:
	if is_instance_valid(lapak_aktif):
		var nilai_jual = int(lapak_aktif.harga_bangunan * 0.8)
		
		EconomyManager.current_money += nilai_jual
		EconomyManager.money_changed.emit(EconomyManager.current_money)
		
		get_tree().current_scene.bebaskan_memori_tanah(lapak_aktif.sel_grid_terpakai)
		
		lapak_aktif.queue_free()
		lapak_aktif = null
		_tutup_panel()

func _process(_delta: float) -> void:
	if not is_instance_valid(lapak_aktif):
		queue_free()
		return
		
	if TimeManager.fase_saat_ini != TimeManager.Fase.PAGI:
		_tutup_panel()
		return
		
	if visible:
		# 1. Dapatkan titik dasar posisi lapak
		var titik_layar = lapak_aktif.get_global_transform_with_canvas().origin
		var geser_x = size.x / 2.0
		var geser_y = size.y + 20 
		
		# 2. Hitung target posisi normalnya
		var target_pos = titik_layar - Vector2(geser_x, geser_y)
		var batas_layar = get_viewport_rect().size
		var ruang_aman = 10 
		target_pos.x = clamp(target_pos.x, ruang_aman, batas_layar.x - size.x - ruang_aman)
		target_pos.y = clamp(target_pos.y, ruang_aman, batas_layar.y - size.y - ruang_aman)
		
		# 3. Terapkan posisi yang sudah dikunci ke panel
		global_position = target_pos

func _tutup_panel() -> void:
	if is_instance_valid(lapak_aktif):
		lapak_aktif.panel_opsi_aktif = null
		
	queue_free()

func _animasi_warna_hover_masuk(tombol: TextureButton) -> void:
	var tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	tween.tween_property(tombol, "modulate", Color(0.8, 0.8, 0.8), 0.1)

func _animasi_warna_hover_keluar(tombol: TextureButton) -> void:
	var tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	tween.tween_property(tombol, "modulate", Color(1.0, 1.0, 1.0), 0.1)
