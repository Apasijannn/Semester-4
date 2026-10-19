extends Camera2D

@export var kecepatan_zoom: float = 0.1
@export var batas_zoom_minimal: float = 0.1
@export var batas_zoom_maksimal: float = 5.0
@export var kehalusan_geser: float = 0.6
@export var kehalusan_zoom: float = 0.6

var posisi_tujuan: Vector2
var zoom_tujuan: Vector2
var is_panning: bool = false

const fps_dasar: float = 120.0

func _ready():
	var ukuran_layar = get_viewport().get_visible_rect().size
	position = ukuran_layar * 0.5 
	posisi_tujuan = position
	zoom_tujuan = zoom

func _process(delta):
	if not DisplayServer.window_is_focused():
		return

	var interpolasi_geser = pow(kehalusan_geser, fps_dasar * delta)
	var interpolasi_zoom = pow(kehalusan_zoom, fps_dasar * delta)
	
	# --- KALKULASI ZOOM DINAMIS ---
	var ukuran_layar = get_viewport().get_visible_rect().size
	var lebar_map = limit_right - limit_left
	var tinggi_map = limit_bottom - limit_top
	
	var min_zoom_x = ukuran_layar.x / float(lebar_map)
	var min_zoom_y = ukuran_layar.y / float(tinggi_map)
	
	var batas_zoom_mutlak = max(min_zoom_x, min_zoom_y) 
	var min_zoom_final = max(batas_zoom_minimal, batas_zoom_mutlak)
	
	zoom_tujuan.x = clamp(zoom_tujuan.x, min_zoom_final, batas_zoom_maksimal)
	zoom_tujuan.y = clamp(zoom_tujuan.y, min_zoom_final, batas_zoom_maksimal)
	
	zoom = zoom * interpolasi_zoom + zoom_tujuan * (1.0 - interpolasi_zoom)

	# --- BOUNDARY KOORDINAT ---
	var setengah_layar = (ukuran_layar * 0.5) / zoom
	posisi_tujuan.x = clamp(posisi_tujuan.x, limit_left + setengah_layar.x, limit_right - setengah_layar.x)
	posisi_tujuan.y = clamp(posisi_tujuan.y, limit_top + setengah_layar.y, limit_bottom - setengah_layar.y)
	
	position = position * interpolasi_geser + posisi_tujuan * (1.0 - interpolasi_geser)

# --- INPUT KENDALI ---
func _unhandled_input(event):
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_MIDDLE:
			is_panning = event.is_pressed()
		
		elif event.is_pressed():
			if event.button_index == MOUSE_BUTTON_WHEEL_UP:
				tambah_zoom(kecepatan_zoom)
			elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
				tambah_zoom(-kecepatan_zoom)

	elif event is InputEventMouseMotion and is_panning:
		posisi_tujuan -= event.relative / zoom

func tambah_zoom(nilai: float):
	var faktor = (1.0 + nilai) if nilai > 0 else (1.0 / (1.0 - nilai))
	zoom_tujuan *= faktor
