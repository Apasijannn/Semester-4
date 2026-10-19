-- 1. Buat Database dan Gunakan
CREATE DATABASE IF NOT EXISTS patpat_cafe;
USE patpat_cafe;

-- 2. Buat Tabel Master: menu
-- Sesuai spesifikasi Bagian 8.1
CREATE TABLE `menu` (
  `id_menu` INT(11) NOT NULL AUTO_INCREMENT,
  `nama_menu` VARCHAR(100) NOT NULL,
  `kategori` VARCHAR(50) NOT NULL,
  `harga` DECIMAL(10,2) NOT NULL,
  `deskripsi` TEXT,
  `foto` VARCHAR(255),
  `status` ENUM('tersedia', 'habis') NOT NULL DEFAULT 'tersedia',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_menu`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Buat Tabel Master: meja
-- Sesuai spesifikasi Bagian 8.2
-- CREATE TABLE `meja` (
--   `id_meja` INT(11) NOT NULL AUTO_INCREMENT,
--   `nomor_meja` VARCHAR(10) NOT NULL,
--   `status` ENUM('tersedia', 'terisi') NOT NULL DEFAULT 'tersedia',
--   PRIMARY KEY (`id_meja`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Buat Tabel Transaksi Utama: pesanan
-- Sesuai spesifikasi Bagian 8.3
CREATE TABLE `pesanan` (
  `id_pesanan` INT(11) NOT NULL AUTO_INCREMENT,
  `meja_id` INT(11) DEFAULT NULL, -- Nullable untuk pesanan Takeaway
  `nama_pelanggan` VARCHAR(100) NOT NULL,
  `metode` ENUM('table_service', 'takeaway') NOT NULL,
  `estimasi_pickup` DATETIME DEFAULT NULL,
  `status` ENUM('menunggu', 'diproses', 'siap', 'selesai', 'dibatalkan') NOT NULL DEFAULT 'menunggu',
  `metode_bayar` ENUM('tunai', 'transfer') NOT NULL,
  `bukti_transfer` VARCHAR(255) DEFAULT NULL,
  `status_bayar` ENUM('belum', 'dikonfirmasi') NOT NULL DEFAULT 'belum',
  `total` DECIMAL(12,2) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_pesanan`),
  FOREIGN KEY (`meja_id`) REFERENCES `meja`(`id_meja`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Buat Tabel Jembatan/Line Items: detail_pesanan
-- Sesuai spesifikasi Bagian 8.4
CREATE TABLE `detail_pesanan` (
  `id_detail` INT(11) NOT NULL AUTO_INCREMENT,
  `pesanan_id` INT(11) NOT NULL,
  `menu_id` INT(11) NOT NULL,
  `jumlah` INT(11) NOT NULL,
  `catatan` TEXT DEFAULT NULL,
  `harga_satuan` DECIMAL(10,2) NOT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (`id_detail`),
  FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan`(`id_pesanan`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`menu_id`) REFERENCES `menu`(`id_menu`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- DATA DUMMY (OPSIONAL) - Untuk Testing Awal
-- ==========================================

-- Insert Data Meja
INSERT INTO `meja` (`nomor_meja`, `status`) VALUES
('M-01', 'tersedia'),
('M-02', 'tersedia'),
('M-03', 'tersedia');

-- Insert Data Menu
INSERT INTO `menu` (`nama_menu`, `kategori`, `harga`, `deskripsi`, `status`) VALUES
('Kopi Susu Gula Aren', 'Minuman', 18000.00, 'Kopi susu dengan gula aren asli', 'tersedia'),
('Kentang Goreng', 'Snack', 15000.00, 'Kentang goreng renyah dengan saus sambal', 'tersedia');