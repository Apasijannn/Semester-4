extends Control

@onready var credits_text: VBoxContainer = $CreditsText
@onready var prompt_label: Label = $PromptLabel 
@onready var transition = $Transition

const SCROLL_SPEED: float = 80.0 
var can_exit: bool = false 

func _ready() -> void:
	BackgroundMusic.putar_musik_menu()
	prompt_label.modulate.a = 0.0
	prompt_label.visible = false 
	
	await get_tree().process_frame
	
	credits_text.position.y = get_viewport_rect().size.y
	
	if is_instance_valid(transition):
		transition.play("fade_in")
	
	await get_tree().create_timer(1.5).timeout
	_mulai_gulir()

func _mulai_gulir() -> void:
	var layar_tengah = get_viewport_rect().size.y / 2.0
	
	var target_y = layar_tengah - credits_text.size.y - 120.0 
	
	var jarak_tempuh = credits_text.position.y - target_y
	var durasi = jarak_tempuh / SCROLL_SPEED
	
	var tween = get_tree().create_tween()
	tween.tween_property(credits_text, "position:y", target_y, durasi).set_trans(Tween.TRANS_LINEAR)
	
	tween.finished.connect(_munculkan_prompt)

func _munculkan_prompt() -> void:
	prompt_label.visible = true
	can_exit = true 
	
	var tween = get_tree().create_tween().set_loops()
	tween.tween_property(prompt_label, "modulate:a", 1.0, 0.8)
	tween.tween_property(prompt_label, "modulate:a", 0.2, 0.8)

func _input(event: InputEvent) -> void:
	if not can_exit:
		return
		
	if (event is InputEventKey and event.pressed) or (event is InputEventMouseButton and event.pressed):
		# Jika kamu punya animasi fade_out, mainkan di sini sebelum pindah scene
		get_tree().change_scene_to_file("res://main_menu.tscn")
