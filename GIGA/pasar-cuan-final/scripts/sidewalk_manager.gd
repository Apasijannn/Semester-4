extends RefCounted

# ============================================================
# KONFIGURASI
# ============================================================
const SIDEWALK_ITEM_ID        : int = 99
const SIDEWALK_GRANT_EVERY_LEVEL: int = 5
const SIDEWALK_GRANT_AMOUNT   : int = 3
const BLOCK_W                 : int = 4
const BLOCK_H                 : int = 4

# ============================================================
# STATE & REFERENSI
# ============================================================
var sidewalk_stock       : int  = 0
var is_placing_sidewalk  : bool = false
var sidewalk_anchor_map  : Vector2i = Vector2i.ZERO

var host_node          : Node2D
var tilemap_tanah      : TileMapLayer
var tilemap_jalan      : TileMapLayer
var road_boundary      : Area2D
var shop_vbox          : VBoxContainer
var ghost_tile         : Sprite2D
var sidewalk_button_node: Node
var sidewalk_container : Node2D

var placed_blocks      : Dictionary = {}  
# --- MEMORI PERLINDUNGAN MUTLAK ---
var protected_blocks   : Dictionary = {} 

# Tekstur
var tex_horizontal  : Texture2D
var tex_vertical    : Texture2D
var tex_corner      : Texture2D
var tex_tjunction   : Texture2D
var tex_intersection: Texture2D

# ============================================================
# SETUP
# ============================================================
func setup(host: Node2D, ground_tilemap: TileMapLayer, road_tilemap: TileMapLayer, boundary: Area2D, shop_container: VBoxContainer) -> void:
	host_node     = host
	tilemap_tanah = ground_tilemap
	tilemap_jalan = road_tilemap
	road_boundary = boundary
	shop_vbox     = shop_container

	tex_horizontal   = load("res://assets/Tiles/sidewalkHorizontal.png")
	tex_vertical     = load("res://assets/Tiles/sidewalkVertical.png")
	tex_corner       = load("res://assets/Tiles/sidewalkCorner.png")
	tex_tjunction    = load("res://assets/Tiles/sidewalkTjunction.png")
	tex_intersection = load("res://assets/Tiles/sidewalkIntersection.png")

	sidewalk_container = Node2D.new()
	sidewalk_container.name = "SidewalkContainer"
	
	if is_instance_valid(tilemap_jalan):
		tilemap_jalan.add_child(sidewalk_container)
	else:
		host_node.add_child(sidewalk_container)

	_create_ghost_tile()
	_find_sidewalk_button()
	_update_sidewalk_button_ui()
	
	_bangun_jalan_awal()
	_update_road_boundary()

# ============================================================
# API PUBLIK & INPUT MANAJEMEN
# ============================================================
func is_sidewalk_item(item_id: int) -> bool:
	return item_id == SIDEWALK_ITEM_ID

func on_level_changed(level: int) -> void:
	if level > 0 and level % SIDEWALK_GRANT_EVERY_LEVEL == 0:
		sidewalk_stock += SIDEWALK_GRANT_AMOUNT
		_update_sidewalk_button_ui()

func try_start_placing() -> void:
	if TimeManager.fase_saat_ini != TimeManager.Fase.PAGI:
		print("Sidewalk hanya bisa dipasang saat PAGI.")
		return
	if sidewalk_stock <= 0:
		return
	is_placing_sidewalk = true
	if is_instance_valid(ghost_tile):
		ghost_tile.visible = true

func cancel_placing() -> void:
	is_placing_sidewalk = false
	if is_instance_valid(ghost_tile):
		ghost_tile.visible = false

# --- SENSOR MOUSE & KLIK KANAN MUTLAK ---
func handle_input(event: InputEvent) -> bool:
	if event is InputEventMouseButton and event.pressed:
		var mouse_pos := host_node.get_global_mouse_position()
		var map_pos = tilemap_tanah.local_to_map(tilemap_tanah.to_local(mouse_pos))
		
		# KLIK KANAN: Batal Bangun ATAU Hancurkan Jalan
		if event.button_index == MOUSE_BUTTON_RIGHT:
			if is_placing_sidewalk:
				cancel_placing()
				return true
			else:
				return _try_destroy_sidewalk(map_pos)

		# KLIK KIRI: Konfirmasi Bangun
		if event.button_index == MOUSE_BUTTON_LEFT and is_placing_sidewalk:
			_try_place_sidewalk()
			return true

	return is_placing_sidewalk

# ============================================================
# LOGIKA PENGHANCURAN (BULLDOZER)
# ============================================================
func _try_destroy_sidewalk(target_cell: Vector2i) -> bool:
	if TimeManager.fase_saat_ini != TimeManager.Fase.PAGI:
		return false
		
	# Cari tahu jalan mana yang sedang ditunjuk mouse
	var target_anchor = null
	for anchor in placed_blocks.keys():
		if target_cell.x >= anchor.x and target_cell.x < anchor.x + BLOCK_W:
			if target_cell.y >= anchor.y and target_cell.y < anchor.y + BLOCK_H:
				target_anchor = anchor
				break
				
	# Jika menemukan jalan
	if target_anchor != null:
		# PENGAMANAN: Tolak jika ini jalan utama bawaan game
		if protected_blocks.has(target_anchor):
			print("DITOLAK: Jalan utama awal tidak boleh dihancurkan!")
			return true 
			
		# EKSEKUSI PENGHANCURAN
		var container = placed_blocks[target_anchor]
		container.queue_free()
		placed_blocks.erase(target_anchor)
		
		sidewalk_stock += 1
		_update_sidewalk_button_ui()
		
		# Beritahu jalan tetangganya agar memperbarui rotasi (memutus sambungan)
		for nb in _get_neighbor_anchors(target_anchor):
			if placed_blocks.has(nb):
				_refresh_block(nb)
				
		_update_road_boundary()
		print("Jalan berhasil dihancurkan! +1 Stok Aspal.")
		return true
		
	return false

# ============================================================
# PENEMPATAN, PREVIEW & MESIN ROTASI MANUAL
# ============================================================
func _is_area_overlap(anchor: Vector2i) -> bool:
	# CEK OVERLAP PRESISI TINGGI: Memindai seluruh 16 ubin (4x4)
	for x in range(BLOCK_W):
		for y in range(BLOCK_H):
			var cell = anchor + Vector2i(x, y)
			if is_cell_paved(cell):
				return true
	return false

func process_preview() -> void:
	if not is_placing_sidewalk:
		return
	var mouse_pos := host_node.get_global_mouse_position()
	sidewalk_anchor_map = tilemap_tanah.local_to_map(tilemap_tanah.to_local(mouse_pos))
	
	# Validasi Area
	var boleh := true
	if sidewalk_stock <= 0 or TimeManager.fase_saat_ini != TimeManager.Fase.PAGI:
		boleh = false
	elif _is_area_overlap(sidewalk_anchor_map):
		boleh = false
	elif not _is_adjacent_to_road(sidewalk_anchor_map):
		boleh = false

	var tile_px  := _get_tile_px()
	var center   := tilemap_tanah.map_to_local(sidewalk_anchor_map) + Vector2(tile_px * (BLOCK_W - 1) * 0.5, tile_px * (BLOCK_H - 1) * 0.5)
	ghost_tile.global_position = tilemap_tanah.to_global(center)
	ghost_tile.modulate = Color(0, 1, 0, 0.45) if boleh else Color(1, 0, 0, 0.45)

func _try_place_sidewalk() -> void:
	if TimeManager.fase_saat_ini != TimeManager.Fase.PAGI or sidewalk_stock <= 0:
		return
		
	if _is_area_overlap(sidewalk_anchor_map) or not _is_adjacent_to_road(sidewalk_anchor_map):
		print("Gagal: Area tidak valid atau tidak bersentuhan dengan jalan lain.")
		return
		
	_place_block(sidewalk_anchor_map)
	BackgroundMusic.play_sfx_placement()
	sidewalk_stock -= 1
	_update_sidewalk_button_ui()
	if sidewalk_stock <= 0:
		cancel_placing()

func _place_block(anchor: Vector2i) -> void:
	var container := Node2D.new()
	container.z_index = 5
	sidewalk_container.add_child(container)
	placed_blocks[anchor] = container
	_refresh_block(anchor)
	
	for nb in _get_neighbor_anchors(anchor):
		if placed_blocks.has(nb):
			_refresh_block(nb)
	_update_road_boundary()

func _refresh_block(anchor: Vector2i) -> void:
	if not placed_blocks.has(anchor):
		return
	var container: Node2D = placed_blocks[anchor]
	for child in container.get_children():
		child.queue_free()

	var nb    := _get_neighbor_anchors(anchor)
	var has_n := placed_blocks.has(nb[0])
	var has_e := placed_blocks.has(nb[1])
	var has_s := placed_blocks.has(nb[2])
	var has_w := placed_blocks.has(nb[3])
	var count := int(has_n) + int(has_e) + int(has_s) + int(has_w)

	var tex    : Texture2D
	var rot_deg: float = 0.0
	var is_h   := false
	var is_v   := false

	match count:
		4: tex = tex_intersection
		3:
			tex = tex_tjunction
			if   not has_n: rot_deg = 0.0
			elif not has_e: rot_deg = 90.0
			elif not has_s: rot_deg = 180.0
			else:           rot_deg = 270.0
		2:
			if   has_n and has_s: is_v = true
			elif has_e and has_w: is_h = true
			else:
				tex = tex_corner
				if   has_n and has_w: rot_deg = 0.0
				elif has_n and has_e: rot_deg = 90.0
				elif has_s and has_e: rot_deg = 180.0
				else:                 rot_deg = 270.0
		_:
			if has_n or has_s: is_v = true
			else:              is_h = true

	var tile_px := _get_tile_px()
	var center  := tilemap_tanah.map_to_local(anchor) + Vector2(tile_px * (BLOCK_W - 1) * 0.5, tile_px * (BLOCK_H - 1) * 0.5)
	container.global_position  = tilemap_tanah.to_global(center)
	container.rotation_degrees = rot_deg

	var half: float = tile_px * BLOCK_W * 0.25
	if is_h:
		_add_sprite(container, tex_horizontal, Vector2(-half, 0.0))
		_add_sprite(container, tex_horizontal, Vector2( half, 0.0))
	elif is_v:
		_add_sprite(container, tex_vertical, Vector2(0.0, -half))
		_add_sprite(container, tex_vertical, Vector2(0.0,  half))
	else:
		_add_sprite(container, tex, Vector2.ZERO)

func _add_sprite(parent: Node2D, tex: Texture2D, pos: Vector2) -> void:
	var s := Sprite2D.new()
	s.texture        = tex
	s.centered       = true
	s.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	s.position       = pos
	parent.add_child(s)

func _get_neighbor_anchors(anchor: Vector2i) -> Array:
	return [
		anchor + Vector2i(0, -BLOCK_H),
		anchor + Vector2i(BLOCK_W,  0),
		anchor + Vector2i(0,  BLOCK_H),
		anchor + Vector2i(-BLOCK_W, 0),
	]

func _is_adjacent_to_road(anchor: Vector2i) -> bool:
	# Cek apakah ada bagian dari blok 4x4 ini yang bersentuhan dengan jalan lain
	# Periksa sisi Utara
	for x in range(BLOCK_W):
		if is_cell_paved(anchor + Vector2i(x, -1)): return true
	# Periksa sisi Selatan
	for x in range(BLOCK_W):
		if is_cell_paved(anchor + Vector2i(x, BLOCK_H)): return true
	# Periksa sisi Barat
	for y in range(BLOCK_H):
		if is_cell_paved(anchor + Vector2i(-1, y)): return true
	# Periksa sisi Timur
	for y in range(BLOCK_H):
		if is_cell_paved(anchor + Vector2i(BLOCK_W, y)): return true
	return false

# ============================================================
# ROAD BOUNDARY & UI
# ============================================================
func _update_road_boundary() -> void:
	if not is_instance_valid(road_boundary):
		return
	var max_x: int = 0
	for anchor_raw in placed_blocks.keys():
		var right: int = (anchor_raw as Vector2i).x + BLOCK_W
		if right > max_x:
			max_x = right
	
	if max_x > 0:
		var local_x      := tilemap_tanah.map_to_local(Vector2i(max_x, 0)).x
		var new_global_x := tilemap_tanah.to_global(Vector2(local_x, 0.0)).x
		road_boundary.global_position.x = new_global_x

func _create_ghost_tile() -> void:
	ghost_tile = Sprite2D.new()
	ghost_tile.z_index       = 100
	ghost_tile.visible       = false
	ghost_tile.centered      = true
	ghost_tile.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	var img := Image.create(1, 1, false, Image.FORMAT_RGBA8)
	img.fill(Color.WHITE)
	ghost_tile.texture = ImageTexture.create_from_image(img)
	ghost_tile.scale   = Vector2(_get_tile_px() * BLOCK_W, _get_tile_px() * BLOCK_H)
	host_node.add_child(ghost_tile)

func _find_sidewalk_button() -> void:
	sidewalk_button_node = null
	for tombol in shop_vbox.get_children():
		if "lapak_id" in tombol and int(tombol.lapak_id) == SIDEWALK_ITEM_ID:
			sidewalk_button_node = tombol
			return

func _update_sidewalk_button_ui() -> void:
	if sidewalk_button_node == null:
		return
	var path := "MarginContainer/VBoxContainer/HBoxContainer/Label"
	if sidewalk_button_node.has_node(path):
		(sidewalk_button_node.get_node(path) as Label).text = "x" + str(sidewalk_stock)

	if sidewalk_stock <= 0:
		sidewalk_button_node.disabled = true
		sidewalk_button_node.modulate = Color(0.3, 0.3, 0.3, 1.0)
	else:
		sidewalk_button_node.disabled = false
		sidewalk_button_node.modulate = Color(1.0, 1.0, 1.0, 1.0)

func _get_tile_px() -> float:
	return float(tilemap_tanah.tile_set.tile_size.x) if tilemap_tanah and tilemap_tanah.tile_set else 16.0

func is_cell_paved(target_cell: Vector2i) -> bool:
	for anchor in placed_blocks.keys():
		if target_cell.x >= anchor.x and target_cell.x < anchor.x + BLOCK_W:
			if target_cell.y >= anchor.y and target_cell.y < anchor.y + BLOCK_H:
				return true
	return false

func _bangun_jalan_awal() -> void:
	var y_awal = 21 
	var x_awal = 0
	
	for i in range(5): 
		var anchor = Vector2i(x_awal + (i * BLOCK_W), y_awal)
		_place_block(anchor)
		# --- SUNTIKAN PERLINDUNGAN MUTLAK ---
		protected_blocks[anchor] = true
