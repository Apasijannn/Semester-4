class_name DataLogger
extends RefCounted

const FILE_PATH = "user://data_harga.csv"

static func log_keputusan(hari_ke: int, jenis_lapak: int, level_pemain: int, harga_jual: int, budget_npc: int, panjang_antrean: int, rating_pasar: float, keputusan: String) -> void:
	var file: FileAccess
	
	if FileAccess.file_exists(FILE_PATH):
		file = FileAccess.open(FILE_PATH, FileAccess.READ_WRITE)
		file.seek_end()
	else:
		file = FileAccess.open(FILE_PATH, FileAccess.WRITE)
		# Header CSV di-update: level_lapak diganti level_pemain
		file.store_line("hari_ke,jenis_lapak,level_pemain,harga_jual,budget_npc,panjang_antrean,rating_pasar,keputusan")
		
	if file:
		# Format data disesuaikan dengan jumlah parameter baru
		var baris_data = "%d,%d,%d,%d,%d,%d,%.2f,%s" % [hari_ke, jenis_lapak, level_pemain, harga_jual, budget_npc, panjang_antrean, rating_pasar, keputusan]
		file.store_line(baris_data)
		file.close()
