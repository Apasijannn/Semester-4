extends Camera2D

@export var kecepatan_geser: float = 500.0
@export var kecepatan_zoom: float = 0.1
@export var batas_zoom_minimal: float = 1.5 
@export var batas_zoom_maksimal: float = 4.0 
@export var margin_layar: float = 20.0 

var sedang_geser: bool = false

func _process(delta):
	var arah = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	var posisi_mouse = get_viewport().get_mouse_position()
	var ukuran_layar = get_viewport_rect().size
	
	if posisi_mouse.x < margin_layar:
		arah.x -= 1
	elif posisi_mouse.x > ukuran_layar.x - margin_layar:
		arah.x += 1
		
	if posisi_mouse.y < margin_layar:
		arah.y -= 1
	elif posisi_mouse.y > ukuran_layar.y - margin_layar:
		arah.y += 1
		
	position += arah.normalized() * kecepatan_geser * delta

func _unhandled_input(event):
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_RIGHT:
			sedang_geser = event.pressed
			
		if event.is_pressed() and (event.button_index == MOUSE_BUTTON_WHEEL_UP or event.button_index == MOUSE_BUTTON_WHEEL_DOWN):
			var posisi_mouse_awal = get_global_mouse_position()
			var zoom_baru = zoom
			
			if event.button_index == MOUSE_BUTTON_WHEEL_UP:
				zoom_baru += Vector2(kecepatan_zoom, kecepatan_zoom)
			elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
				zoom_baru -= Vector2(kecepatan_zoom, kecepatan_zoom)
				
			zoom_baru.x = clamp(zoom_baru.x, batas_zoom_minimal, batas_zoom_maksimal)
			zoom_baru.y = clamp(zoom_baru.y, batas_zoom_minimal, batas_zoom_maksimal)
			
			zoom = zoom_baru
			position += posisi_mouse_awal - get_global_mouse_position()

	elif event is InputEventMouseMotion and sedang_geser:
		position -= event.relative / zoom.x
