extends TextureRect 
# settings_panel.gd

@onready var resume_btn: TextureButton = %ResumeButton
@onready var menu_btn: TextureButton = %MainMenuButton
@onready var music_slider: HSlider = %HSlider

# Node tombol putar kecepatan baru
@onready var btn_speed_cycle: TextureButton = %SpeedCycle

# Muat ketiga gambar ke dalam memori
var tex_1x = preload("res://assets/Settings/speed-1x.png") 
var tex_2x = preload("res://assets/Settings/speed-2x.png")
var tex_3x = preload("res://assets/Settings/speed-3x.png")

func _ready() -> void:
	resume_btn.pressed.connect(_on_resume_pressed)
	menu_btn.pressed.connect(_on_menu_pressed)
	
	resume_btn.mouse_entered.connect(_on_tombol_hover.bind(resume_btn))
	resume_btn.mouse_exited.connect(_on_tombol_keluar.bind(resume_btn))
	
	menu_btn.mouse_entered.connect(_on_tombol_hover.bind(menu_btn))
	menu_btn.mouse_exited.connect(_on_tombol_keluar.bind(menu_btn))
	# resume_btn.pivot_offset = resume_btn.size / 2.0
	# menu_btn.pivot_offset = menu_btn.size / 2.0
	
	# --- KONEKSI MUSIK ---
	music_slider.value_changed.connect(BackgroundMusic.set_volume)
	
	# --- KONEKSI TOMBOL PUTAR KECEPATAN ---
	btn_speed_cycle.pressed.connect(_on_speed_cycle_pressed)
	
	_sinkronisasi_ui_kecepatan(Engine.time_scale)

# --- MESIN SIKLUS KECEPATAN MUTLAK ---
func _on_speed_cycle_pressed() -> void:
	var skala_sekarang = Engine.time_scale
	var skala_baru: float = 1.0
	
	# Logika Putaran: 1 -> 2 -> 3 -> kembali ke 1
	if skala_sekarang == 1.0:
		skala_baru = 2.0
	elif skala_sekarang == 2.0:
		skala_baru = 3.0
	elif skala_sekarang >= 3.0:
		skala_baru = 1.0
		
	# Terapkan kecepatan ke sistem Godot
	Engine.time_scale = skala_baru
	
	# Perbarui gambar tombolnya
	_sinkronisasi_ui_kecepatan(skala_baru)

func _sinkronisasi_ui_kecepatan(skala_aktif: float) -> void:
	if skala_aktif == 1.0:
		btn_speed_cycle.texture_normal = tex_1x
	elif skala_aktif == 2.0:
		btn_speed_cycle.texture_normal = tex_2x
	elif skala_aktif >= 3.0:
		btn_speed_cycle.texture_normal = tex_3x

func _on_resume_pressed() -> void:
	get_tree().paused = false
	hide()

func _on_menu_pressed() -> void:
	Engine.time_scale = 1.0 
	get_tree().paused = false
	get_tree().change_scene_to_file("res://main_menu.tscn")

# --- EFEK VISUAL PROCEDURAL ---
func _on_tombol_hover(tombol: TextureButton) -> void:
	var tween = create_tween()
	tween.tween_property(tombol, "modulate", Color(0.458, 0.458, 0.458, 1.0), 0.1)

func _on_tombol_keluar(tombol: TextureButton) -> void:
	var tween = create_tween()
	tween.tween_property(tombol, "modulate", Color(1.0, 1.0, 1.0, 1.0), 0.1)
