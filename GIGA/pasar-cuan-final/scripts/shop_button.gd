extends TextureButton

# Sinyal kustom yang membawa data lapak apa yang barusan dibeli
signal lapak_dibeli(id_lapak: int, harga_lapak: int)

@export var lapak_id: int = 1
@export var harga: int = 200
@export var ikon_lapak: Texture2D

@onready var icon_rect: TextureRect = $MarginContainer/VBoxContainer/TextureRect
@onready var price_label: Label = $MarginContainer/VBoxContainer/HBoxContainer/Label

# VAR BARU: Pelacak animasi agar tidak tumpang tindih
var tween: Tween

func _ready() -> void:
	# --- [TIDAK DIOTAK-ATIK] ---
	if ikon_lapak:
		icon_rect.texture = ikon_lapak
	price_label.text = str(harga)
	
	EconomyManager.money_changed.connect(_cek_keterjangkauan)
	_cek_keterjangkauan(EconomyManager.current_money)
	pressed.connect(_on_tombol_ditekan)
	# ---------------------------

	# --- PENAMBAHAN UX ANIMASI ---
	# 1. Otomatisasi titik tumpu ke tengah agar membesar proporsional
	pivot_offset = size / 2
	
	# 2. Koneksi sinyal interaksi mouse
	mouse_entered.connect(_on_hover)
	mouse_exited.connect(_on_unhover)
	button_down.connect(_on_click_down)
	button_up.connect(_on_click_up)

func _cek_keterjangkauan(uang_sekarang: int) -> void:
	disabled = uang_sekarang < harga

func _on_tombol_ditekan() -> void:
	lapak_dibeli.emit(lapak_id, harga)

# --- LOGIKA ANIMASI UX (TWEEN) ---

func _animate_scale(target_scale: Vector2, duration: float) -> void:
	if tween and tween.is_valid():
		tween.kill()
	
	tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	tween.tween_property(self, "scale", target_scale, duration)

func _on_hover() -> void:
	# Hanya beranimasi jika tombol aktif (uang cukup)
	if not disabled:
		_animate_scale(Vector2(1.1, 1.1), 0.15)

func _on_unhover() -> void:
	# Selalu kembalikan ke ukuran normal saat mouse pergi
	_animate_scale(Vector2(1.0, 1.0), 0.15)

func _on_click_down() -> void:
	if not disabled:
		_animate_scale(Vector2(0.9, 0.9), 0.1) # Mengecil (efek squish/tertekan)

func _on_click_up() -> void:
	if not disabled:
		_animate_scale(Vector2(1.1, 1.1), 0.1) # Memegas kembali ke ukuran hover
