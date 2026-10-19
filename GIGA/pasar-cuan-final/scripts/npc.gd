extends CharacterBody2D
# npc.gd

signal transaction_completed(success: bool, amount: int)

enum State {ENTERING, MOVING_TO_STALL, WAITING_IN_QUEUE, SHOPPING, MOVING_TO_ROAD, RETURNING, EXITING}
var current_state = State.ENTERING

@export var speed: float = 60.0 
var movement_direction = Vector2.RIGHT 
var target_exit_pos: Vector2 
var time_to_shop: float = 3.0 

var budget: int = 0
var patience: int = 0
var intention: float = 0.0

var npc_type_id: int = 1 
var idle_tex: Texture2D
var walk_tex: Texture2D
var walk_frame_timer: float = 0.0

var lapak_target = null
var target_tier_id: int = 1 	
var sudah_belanja: bool = false 
var original_y: float 
var target_queue_pos: Vector2 

var is_di_depan_kasir: bool = false

@onready var sprite: Sprite2D = $Sprite2D
@onready var stall_sensor: Area2D = $StallSensor

func _ready() -> void:
	target_exit_pos = global_position 
	stall_sensor.area_entered.connect(_on_stall_detected)

func setup_npc(entry_pos: Vector2, type_id: int):
	global_position = entry_pos
	target_exit_pos = entry_pos
	npc_type_id = type_id
	original_y = entry_pos.y 
	
	var level_pasar = EconomyManager.current_level
	
	# --- LOGIKA DEMOGRAFI & DOMPET ---
	if level_pasar < 5:
		budget = randi_range(10000, 25000)
		target_tier_id = 1
	elif level_pasar < 10:
		# Dompet diturunkan
		budget = randi_range(20000, 60000) 
		# 70% cari minum, 30% cari makan
		target_tier_id = 1 if randf() < 0.7 else 2 
	else:
		# LEVEL 10+: Hanya 20% yang jadi "Sultan", sisanya tetap pengunjung menengah
		if randf() < 0.8:
			budget = randi_range(15000, 75000) # Kelas Menengah
		else:
			budget = randi_range(100000, 500000) # Sultan
			
		# Probabilitas Kebutuhan: 50% Minum, 35% Makan, 15% Baju
		var r = randf()
		if r < 0.50: 
			target_tier_id = 1
		elif r < 0.85: 
			target_tier_id = 2
		else: 
			target_tier_id = 3
	
	patience = randi_range(6, 12) 
	intention = randf_range(0.4, 1.0)
	
	idle_tex = load("res://assets/NPC/NPC_" + str(npc_type_id) + ".png")
	walk_tex = load("res://assets/NPC/npc_walkcycle/NPC_" + str(npc_type_id) + "_walk.png")
	
	_set_animation_state(true)

func _physics_process(delta: float) -> void:
	
	z_index = int(global_position.y)

	match current_state:
		State.ENTERING, State.RETURNING:
			velocity = movement_direction * speed
			move_and_slide()
			_animate_walk(delta)
			
			if current_state == State.RETURNING and global_position.distance_to(target_exit_pos) < 5.0:
				current_state = State.EXITING
				if sudah_belanja:
					EconomyManager.catat_npc_sukses()
				else:
					EconomyManager.catat_npc_kecewa()
				queue_free() 
				
		State.MOVING_TO_STALL:
			global_position = global_position.move_toward(target_queue_pos, speed * delta)
			_animate_walk(delta)
			
			if global_position.distance_to(target_queue_pos) < 2.0:
				_set_animation_state(false) 
				
				if is_di_depan_kasir:
					_start_shopping()
				else:
					current_state = State.WAITING_IN_QUEUE
					
		State.WAITING_IN_QUEUE:
			velocity = Vector2.ZERO 
			
		State.SHOPPING:
			velocity = Vector2.ZERO 
			
		State.MOVING_TO_ROAD:
			var target_road = Vector2(global_position.x, original_y)
			global_position = global_position.move_toward(target_road, speed * delta)
			_animate_walk(delta)
			
			if global_position.distance_to(target_road) < 2.0:
				current_state = State.ENTERING
				movement_direction = Vector2.RIGHT 
				sprite.flip_h = false

func _animate_walk(delta: float):
	walk_frame_timer += delta
	if walk_frame_timer >= 0.15: 
		walk_frame_timer = 0.0
		sprite.frame = (sprite.frame + 1) % 4 

func _set_animation_state(is_walking: bool):
	if is_walking:
		sprite.texture = walk_tex
		sprite.hframes = 4 
		sprite.frame = 0
	else:
		sprite.texture = idle_tex
		sprite.hframes = 1 
		sprite.frame = 0

func _on_stall_detected(area: Area2D) -> void:
	if current_state != State.ENTERING:
		return
		
	if area.is_in_group("road_boundary"):
		if not sudah_belanja:
			var keluhan = "😞 Kecewa..."
			match target_tier_id:
				1: keluhan = "🥵 Haus..."
				2: keluhan = "🤤 Lapar..."
				3: keluhan = "👗 Gak ada baju..."
				
			_munculkan_emote(keluhan, Color.GRAY) 
			
		transaction_completed.emit(false, 0)
		_initiate_return()
		
	elif area.is_in_group("stall_aoe"):
		var lapak = area 
		if "harga_jual" in lapak:
			_evaluasi_agen(lapak)

func _evaluasi_agen(lapak) -> void:
	# PENCEGATAN VARIASI: Jika lapak ini bukan barang yang dia cari, lanjut jalan!
	if lapak.lapak_id != target_tier_id:
		return 
		
	if randf() > intention: return 
	
	# --- PERSIAPAN 8 DATA LOGGER MUTLAK ---
	var rating_saat_ini = EconomyManager.rating_global
	var hari_ini = TimeManager.hari_saat_ini
	var level_pmn = EconomyManager.current_level
	
	if lapak.harga_jual > budget: 
		_munculkan_emote("😠 Mahal!", Color.RED) 
		BackgroundMusic.play_sfx_fail()
		# LOGGING 8 PARAMETER: Terlalu Mahal
		DataLogger.log_keputusan(hari_ini, lapak.lapak_id, level_pmn, lapak.harga_jual, budget, lapak.daftar_antrean.size(), rating_saat_ini, "Terlalu_Mahal")
		return 
		
	if lapak.daftar_antrean.size() > patience: 
		_munculkan_emote("😠 Antre!", Color.ORANGE) 
		BackgroundMusic.play_sfx_fail()
		# LOGGING 8 PARAMETER: Antrean Panjang
		DataLogger.log_keputusan(hari_ini, lapak.lapak_id, level_pmn, lapak.harga_jual, budget, lapak.daftar_antrean.size(), rating_saat_ini, "Antrean_Panjang")
		return 
		
	# LOGGING 8 PARAMETER: Sukses Beli
	DataLogger.log_keputusan(hari_ini, lapak.lapak_id, level_pmn, lapak.harga_jual, budget, lapak.daftar_antrean.size(), rating_saat_ini, "Beli")
	
	lapak_target = lapak
	current_state = State.MOVING_TO_STALL
	lapak_target.ikut_antre(self)

# --- CALLBACK DARI LAPAK ---
func update_posisi_antrean(posisi_baru: Vector2, is_front: bool):
	target_queue_pos = posisi_baru
	is_di_depan_kasir = is_front
	
	# Jika dia sedang bengong nunggu antrean, bangunkan dia agar bergerak ke posisi baru
	if current_state == State.WAITING_IN_QUEUE:
		current_state = State.MOVING_TO_STALL
		_set_animation_state(true)

func _start_shopping():
	current_state = State.SHOPPING
	_set_animation_state(false) 
	
	var durasi = 2.0
	if is_instance_valid(lapak_target) and "waktu_layanan" in lapak_target:
		durasi = lapak_target.waktu_layanan
	
	var shop_timer = get_tree().create_timer(durasi)
	await shop_timer.timeout
	_complete_shopping()

func _complete_shopping():
	if lapak_target:
		EconomyManager.catat_transaksi(lapak_target.harga_jual) 
		budget -= lapak_target.harga_jual
		sudah_belanja = true 
		_munculkan_emote("😊 +Rp" + str(lapak_target.harga_jual), Color.GREEN) 
		BackgroundMusic.play_sfx_success()
		
		lapak_target.selesai_antre(self)
		intention -= 0.4 
		lapak_target = null
		
	current_state = State.MOVING_TO_ROAD
	_set_animation_state(true) 
	sprite.flip_h = true

func _initiate_return():
	current_state = State.RETURNING
	movement_direction = Vector2.LEFT 
	_set_animation_state(true) 
	sprite.flip_h = true
	
# --- SISTEM VISUAL FEEDBACK ---
func _munculkan_emote(teks: String, warna: Color) -> void:
	# 1. Buat teks baru dari ketiadaan
	var label = Label.new()
	label.text = teks
	
	# 2. Percantik teks agar terbaca di atas aspal
	label.add_theme_color_override("font_color", warna)
	label.add_theme_color_override("font_outline_color", Color.BLACK)
	label.add_theme_constant_override("outline_size", 4)
	
	# 3. PENGHINDARAN KEMATIAN: Jadikan anak dari dunia utama, bukan anak NPC
	get_tree().current_scene.add_child(label)
	
	label.global_position = global_position + Vector2(-15, -40)
	
	# 4. ANIMASI TWEEN 
	var tween = get_tree().create_tween().set_parallel(true)
	tween.tween_property(label, "global_position:y", label.global_position.y - 30, 1.0).set_ease(Tween.EASE_OUT)
	tween.tween_property(label, "modulate:a", 0.0, 1.0).set_ease(Tween.EASE_OUT)
	
	# 5. HAPUS KETIADAAN
	tween.chain().tween_callback(label.queue_free)
