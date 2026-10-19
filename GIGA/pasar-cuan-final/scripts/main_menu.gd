extends Control

@onready var start_btn: Button = $VBoxContainer/Start
@onready var credits_btn: Button = $VBoxContainer/Credits
@onready var exit_btn: Button = $VBoxContainer/Exit
@onready var transition = $Transition

var tweens: Dictionary = {}

var next_scene_path: String = ""
var is_exiting: bool = false

func _ready() -> void:
	BackgroundMusic.putar_musik_menu()
	var buttons: Array = [start_btn, credits_btn, exit_btn]
	
	for btn in buttons:
		btn.pivot_offset_ratio = Vector2(0.5, 0.5)
		btn.mouse_entered.connect(_on_button_hovered.bind(btn))
		btn.mouse_exited.connect(_on_button_unhovered.bind(btn))
		
	# start_btn.pressed.connect(_on_start_pressed)
	# credits_btn.pressed.connect(_on_credits_pressed)
	# exit_btn.pressed.connect(_on_exit_pressed)

# --- LOGIKA ANIMASI UI ---

func _on_button_hovered(btn: Button) -> void:
	if tweens.has(btn) and tweens[btn]:
		tweens[btn].kill()
	tweens[btn] = create_tween()
	tweens[btn].set_trans(Tween.TRANS_SINE)
	tweens[btn].tween_property(btn, "scale", Vector2(1.1, 1.1), 0.15)

func _on_button_unhovered(btn: Button) -> void:
	if tweens.has(btn) and tweens[btn]:
		tweens[btn].kill()
	tweens[btn] = create_tween()
	tweens[btn].set_trans(Tween.TRANS_SINE)
	tweens[btn].tween_property(btn, "scale", Vector2.ONE, 0.15)

# --- LOGIKA FLOW GAME ---

func _on_start_pressed() -> void:
	next_scene_path = "res://game.tscn"
	transition.play("fade_out")

func _on_credits_pressed() -> void:
	next_scene_path = "res://credit_scene.tscn"
	transition.play("fade_out")

func _on_exit_pressed() -> void:
	is_exiting = true
	transition.play("fade_out")

func _on_transition_animation_finished(anim_name: StringName) -> void:
	if anim_name == "fade_out":
		if is_exiting:
			get_tree().quit()
		elif next_scene_path != "":
			get_tree().change_scene_to_file(next_scene_path)
