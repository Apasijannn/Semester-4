extends Node2D

@onready var label = $Label

func setup(isi_teks: String, warna: Color):
	label.text = isi_teks
	label.add_theme_color_override("font_color", warna)

func _ready():
	var tween = create_tween()
	tween.tween_property(self, "position", position - Vector2(0, 50), 1.0)
	tween.parallel().tween_property(self, "modulate:a", 0.0, 1.0)
	tween.tween_callback(queue_free)