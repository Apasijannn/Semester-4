extends AudioStreamPlayer
# bgm_manager.gd (Berjalan sebagai Autoload: BackgroundMusic)

@export var musik_menu: AudioStream
@export var musik_game: AudioStream

var sfx_placement = preload("res://assets/Audio/placementPlop.mp3")
var sfx_levelup = preload("res://assets/Audio/levelUp.mp3")
var sfx_uiclick = preload("res://assets/Audio/uiClick.mp3")
var sfx_success = preload("res://assets/Audio/success.mp3")
var sfx_fail = preload("res://assets/Audio/fail.mp3")

var success_player: AudioStreamPlayer
var fail_player: AudioStreamPlayer

func _ready():
	process_mode = Node.PROCESS_MODE_ALWAYS 

	if not musik_game:
		musik_game = preload("res://assets/Audio/playOST.mp3")
		
	_set_loop(musik_game)
	_set_loop(musik_menu)

	success_player = AudioStreamPlayer.new()
	success_player.stream = sfx_success
	success_player.bus = "Master"
	add_child(success_player)
	
	fail_player = AudioStreamPlayer.new()
	fail_player.stream = sfx_fail
	fail_player.bus = "Master"
	add_child(fail_player)
	
	_connect_buttons(get_tree().root)
	get_tree().node_added.connect(_on_node_added)

func _set_loop(stream: AudioStream):
	if stream is AudioStreamMP3:
		stream.loop = true
	elif stream is AudioStreamWAV:
		stream.loop_mode = AudioStreamWAV.LOOP_FORWARD

func _connect_buttons(node: Node) -> void:
	if node is Button or node is TextureButton:
		if not node.pressed.is_connected(play_sfx_uiclick):
			node.pressed.connect(play_sfx_uiclick)
	for child in node.get_children():
		_connect_buttons(child)

func _on_node_added(node: Node) -> void:
	if node is Button or node is TextureButton:
		if not node.pressed.is_connected(play_sfx_uiclick):
			node.pressed.connect(play_sfx_uiclick)

func play_sfx(stream: AudioStream, volume_db: float = 0.0) -> void:
	var player = AudioStreamPlayer.new()
	player.stream = stream
	player.volume_db = volume_db
	add_child(player)
	player.play()
	player.finished.connect(player.queue_free)

func play_sfx_placement() -> void:
	play_sfx(sfx_placement, -4.0) 

func play_sfx_levelup() -> void:
	play_sfx(sfx_levelup)

func play_sfx_uiclick() -> void:
	play_sfx(sfx_uiclick, +8.0)

func play_sfx_success() -> void:
	if success_player and not success_player.playing:
		success_player.play()

func play_sfx_fail() -> void:
	if fail_player and not fail_player.playing:
		fail_player.play()

func putar_musik_menu() -> void:
	if stream == musik_menu and playing:
		return 
		
	stream = musik_menu
	play()

func putar_musik_game() -> void:
	if stream == musik_game and playing:
		return
		
	stream = musik_game
	play()

func hentikan_musik() -> void:
	stop()

func set_volume(value: float) -> void:
	var db = linear_to_db(value)
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Master"), db)
