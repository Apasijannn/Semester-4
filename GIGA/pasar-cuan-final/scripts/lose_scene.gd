extends Control
# lose_scene.gd

func _ready() -> void:
	await get_tree().create_timer(3.0).timeout
	get_tree().change_scene_to_file("res://credit_scene.tscn") 
