extends Control

# Mencegah pemain spam klik tombol berulang kali saat animasi sedang berjalan
var sedang_transisi: bool = false

func _jalankan_transisi(tujuan: String):
	if sedang_transisi: return
	sedang_transisi = true

	match tujuan:
		"start":
			# Masuk ke start.tscn dulu (kota awal / hari pertama)
			# Setelah hari pertama selesai, start_manager.gd akan
			# otomatis pindahkan pemain ke game_manager.tscn
			get_tree().change_scene_to_file("res://start.tscn")
		"credits":
			# Ganti ini nanti jika kamu sudah membuat scene credits
			print("Scene credits belum ada!")
			# get_tree().change_scene_to_file("res://credits.tscn")
			sedang_transisi = false  # reset agar bisa diklik lagi
		"exit":
			get_tree().quit()


# Semua tombol cukup memanggil satu fungsi utama
func _on_start_pressed():
	_jalankan_transisi("start")

func _on_credits_pressed():
	_jalankan_transisi("credits")

func _on_exit_pressed():
	_jalankan_transisi("exit")
