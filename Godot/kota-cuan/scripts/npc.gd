extends CharacterBody2D

@export var kecepatan_dasar: float = 50.0
@export var daftar_baju: Array[Texture2D] = []
@export var kecepatan_animasi: float = 0.15

var budget: int
var patience: int
var intention: float
var kecepatan: float

enum State { JALAN, ANTRI, SELESAI }
var state: State = State.JALAN
var lapak_target = null

var waktu_animasi: float = 0.0
@onready var sprite = $Sprite2D

func _ready():
	_roll_parameter_abm()
	_pilih_sprite_acak()

func _roll_parameter_abm():
	var roll = randf()
	if roll < 0.25:
		budget = randi_range(3000, 7000)
	elif roll < 0.75:
		budget = randi_range(7000, 18000)
	else:
		budget = randi_range(18000, 30000)

	patience = randi_range(1, 5)
	intention = randf_range(0.3, 0.9)
	kecepatan = kecepatan_dasar + randf_range(-10.0, 15.0)

func _pilih_sprite_acak():
	if daftar_baju.size() > 0:
		sprite.texture = daftar_baju[randi() % daftar_baju.size()]

func _physics_process(_delta):
	match state:
		State.JALAN, State.SELESAI:
			# Berjalan buta lurus ke kanan (Sumbu X positif)
			velocity = Vector2(kecepatan, 0)
			move_and_slide()
		State.ANTRI:
			velocity = Vector2.ZERO
			move_and_slide()

func _process(delta):
	if velocity.length() > 0:
		waktu_animasi += delta
		if waktu_animasi >= kecepatan_animasi:
			waktu_animasi = 0.0
			sprite.frame = (sprite.frame + 1) % 4

func selesai_transaksi():
	intention *= 0.65
	lapak_target = null
	state = State.SELESAI

func batalkan_antri():
	lapak_target = null
	state = State.JALAN

# Menghancurkan diri secara otomatis jika keluar dari layar kanan
func _on_visible_on_screen_notifier_2d_screen_exited():
	queue_free()
