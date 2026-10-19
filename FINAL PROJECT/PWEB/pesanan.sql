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
-- Table structure for table `pesanan`
--

CREATE TABLE `pesanan` (
  `id_pesanan` int(11) NOT NULL,
  `nomor_meja` int(11) DEFAULT NULL,
  `nama_pelanggan` varchar(100) NOT NULL,
  `metode` enum('table_service','takeaway') NOT NULL,
  `estimasi_pickup` datetime DEFAULT NULL,
  `status` enum('menunggu','diproses','siap','selesai','dibatalkan') NOT NULL DEFAULT 'menunggu',
  `metode_bayar` enum('tunai','transfer') NOT NULL,
  `bukti_transfer` varchar(255) DEFAULT NULL,
  `status_bayar` enum('belum','dikonfirmasi') NOT NULL DEFAULT 'belum',
  `total` decimal(12,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pesanan`
--

INSERT INTO `pesanan` (`id_pesanan`, `nomor_meja`, `nama_pelanggan`, `metode`, `estimasi_pickup`, `status`, `metode_bayar`, `bukti_transfer`, `status_bayar`, `total`, `created_at`) VALUES
(1, 5, 'sitti', 'table_service', NULL, 'selesai', 'tunai', NULL, 'dikonfirmasi', 20600.00, '2026-06-10 05:54:03'),
(2, 1, 'zidan', 'table_service', NULL, 'selesai', 'transfer', '1781071339_transfer_743.png', 'dikonfirmasi', 22800.00, '2026-06-10 06:02:19'),
(3, 1, 'z', 'table_service', NULL, 'selesai', 'tunai', NULL, 'dikonfirmasi', 22800.00, '2026-06-10 06:17:14'),
(4, 41, 'ina', 'table_service', NULL, 'dibatalkan', 'transfer', '1781072603_transfer_161.png', 'dikonfirmasi', 30500.00, '2026-06-10 06:23:23'),
(5, 1, '1', 'table_service', NULL, 'selesai', 'tunai', NULL, 'belum', 20600.00, '2026-06-10 06:33:07'),
(6, 1, '2', 'table_service', NULL, 'selesai', 'tunai', NULL, 'belum', 27200.00, '2026-06-10 06:35:26'),
(7, 1, '1', 'table_service', NULL, 'selesai', 'tunai', NULL, 'dikonfirmasi', 27200.00, '2026-06-10 06:35:57'),
(8, 6, 'Penelope', 'table_service', NULL, 'selesai', 'tunai', NULL, 'dikonfirmasi', 50300.00, '2026-06-10 07:32:05'),
(9, 1, '1', 'table_service', NULL, 'selesai', 'tunai', NULL, 'dikonfirmasi', 27200.00, '2026-06-11 07:58:15'),
(10, 41, 'Sitti', 'table_service', NULL, '', 'tunai', NULL, 'belum', 20600.00, '2026-06-11 09:58:31'),
(11, 41, 'Aminah', 'table_service', NULL, '', 'tunai', NULL, 'belum', 20600.00, '2026-06-11 15:13:05'),
(12, 2, 'km', 'table_service', NULL, '', 'tunai', NULL, 'belum', 31600.00, '2026-06-17 07:30:23');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `pesanan`
--
ALTER TABLE `pesanan`
  ADD PRIMARY KEY (`id_pesanan`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `pesanan`
--
ALTER TABLE `pesanan`
  MODIFY `id_pesanan` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
