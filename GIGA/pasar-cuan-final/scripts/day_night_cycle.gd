extends CanvasModulate

# --- PALET WARNA ---
const WARNA_PAGI = Color("ffffff")
const WARNA_SORE = Color("ffaa55")
const WARNA_MALAM = Color("2c2c4b")

var tween_waktu: Tween

func _ready() -> void:
	TimeManager.fase_berubah.connect(_on_fase_berubah)
	self.color = WARNA_PAGI

func _on_fase_berubah(fase_baru: int) -> void:
	if tween_waktu and tween_waktu.is_running():
		tween_waktu.kill()
		
	tween_waktu = create_tween()
	
	match fase_baru:
		TimeManager.Fase.PAGI:
			tween_waktu.tween_property(self, "color", WARNA_PAGI, 2.0).set_trans(Tween.TRANS_SINE)
			
		TimeManager.Fase.SIANG:
			# --- TRANSISI REAL-TIME ---
			var durasi_total_siang = 30.0 
			
			var waktu_siang_terik = durasi_total_siang * 0.5
			var waktu_menuju_senja = durasi_total_siang * 0.3
			var waktu_menuju_malam = durasi_total_siang * 0.2
			
			tween_waktu.tween_property(self, "color", WARNA_PAGI, waktu_siang_terik)
			tween_waktu.tween_property(self, "color", WARNA_SORE, waktu_menuju_senja).set_trans(Tween.TRANS_SINE)
			tween_waktu.tween_property(self, "color", WARNA_MALAM, waktu_menuju_malam).set_trans(Tween.TRANS_SINE)
			
		TimeManager.Fase.MALAM:
			tween_waktu.tween_property(self, "color", WARNA_MALAM, 0.5)
