extends HBoxContainer
# shop_drawer.gd

@export var durasi_geser: float = 0.3

var ikon_tarik_buka = preload("res://assets/Shop/build_button_closed.png") 
var ikon_dorong_tutup = preload("res://assets/Shop/build_button_open.png") 

@onready var toggle_btn: TextureButton = $ToggleButton
@onready var shop_content: Control = $ShopContainer 

var is_open: bool = false
var open_x: float
var closed_x: float
var tween: Tween

func _ready() -> void:
	await get_tree().process_frame
	open_x = position.x
	closed_x = open_x + shop_content.size.x
	position.x = closed_x
	toggle_btn.pressed.connect(_on_toggle_ditekan)

func _on_toggle_ditekan() -> void:
	is_open = !is_open 
	
	if tween and tween.is_valid():
		tween.kill()
		
	tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	var target_x = open_x if is_open else closed_x
	tween.tween_property(self, "position:x", target_x, durasi_geser)
	
	if is_open:
		toggle_btn.texture_normal = ikon_dorong_tutup
	else:
		toggle_btn.texture_normal = ikon_tarik_buka
