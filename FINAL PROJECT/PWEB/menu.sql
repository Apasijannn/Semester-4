-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 17, 2026 at 04:12 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `patpat_cafe`
--

-- --------------------------------------------------------

--
-- Table structure for table `menu`
--

CREATE TABLE `menu` (
  `id_menu` int(11) NOT NULL,
  `nama_menu` varchar(100) NOT NULL,
  `kategori` varchar(50) NOT NULL,
  `harga` decimal(10,2) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `status` enum('tersedia','habis') NOT NULL DEFAULT 'tersedia',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `menu`
--

INSERT INTO `menu` (`id_menu`, `nama_menu`, `kategori`, `harga`, `deskripsi`, `foto`, `status`, `created_at`) VALUES
(3, 'Kopi Susu Patpat', 'Minuman', 15000.00, 'Kopi susu khas Pat-Pat Cafe dengan racikan gula aren yang pas.', '1781074603_897.png', 'tersedia', '2026-05-20 07:12:38'),
(4, 'Americano', 'Minuman', 18000.00, 'Kopi hitam yang diseduh dingin selama 12 jam, terasa ringan dan segar.', '1780408373_905.png', 'tersedia', '2026-05-20 07:12:38'),
(5, 'Coklat', 'Minuman', 16000.00, 'Minuman coklat premium yang pekat dan manisnya pas.', '1779359181_926.png', 'tersedia', '2026-05-20 07:12:38'),
(6, 'Matcha', 'Minuman', 17000.00, 'Green tea latte otentik khas Jepang dengan susu segar.', '1779359116_845.png', 'tersedia', '2026-05-20 07:12:38'),
(7, 'Kopi Susu Oat', 'Minuman', 22000.00, 'Pilihan lebih sehat dengan perpaduan espresso dan oat milk.', '1781074628_793.png', 'tersedia', '2026-05-20 07:12:38'),
(8, 'Ote Ote', 'Snack', 10000.00, 'Gorengan ote-ote hangat yang garing di luar dan lembut di dalam.', '1781074681_929.png', 'tersedia', '2026-05-20 07:12:38'),
(11, 'Mendoan', 'Snack', 10000.00, 'Tempe mendoan khas dengan balutan tepung bumbu dan cocolan kecap pedas.', '1781074705_211.png', 'tersedia', '2026-05-20 07:12:38');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `menu`
--
ALTER TABLE `menu`
  ADD PRIMARY KEY (`id_menu`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `menu`
--
ALTER TABLE `menu`
  MODIFY `id_menu` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
