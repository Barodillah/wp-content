CREATE TABLE IF NOT EXISTS `folders` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `parent_id` INT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`parent_id`) REFERENCES `folders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `assets` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `folder_id` INT UNSIGNED DEFAULT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_path` TEXT NOT NULL,
  `file_type` VARCHAR(50) DEFAULT NULL,
  `file_size` BIGINT UNSIGNED DEFAULT 0,
  `source_type` ENUM('upload', 'url') NOT NULL DEFAULT 'upload',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `role` ENUM('superuser', 'user') NOT NULL DEFAULT 'user',
  `can_upload` TINYINT(1) NOT NULL DEFAULT 0,
  `can_delete` TINYINT(1) NOT NULL DEFAULT 0,
  `can_rename` TINYINT(1) NOT NULL DEFAULT 0,
  `can_move` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Akun Default Superuser (Username: admin | Password: admin123)
-- Role superuser dibatasi hanya boleh 1 akun di dalam sistem
INSERT INTO `users` (`username`, `password`, `name`, `role`, `can_upload`, `can_delete`, `can_rename`, `can_move`)
VALUES ('admin', '$2y$12$UPf0ufJnkGjwRmRxBAKC.ugl1.tJNqxAICCv4IFAt80A3p9G7LT7G', 'Super Administrator', 'superuser', 1, 1, 1, 1)
ON DUPLICATE KEY UPDATE `id`=`id`;

-- Tabel Riwayat Akses Domain Eksternal (Usage Tracking)
CREATE TABLE IF NOT EXISTS `asset_access_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `asset_id` INT UNSIGNED NOT NULL,
  `referer_domain` VARCHAR(255) NOT NULL,
  `hit_count` INT UNSIGNED DEFAULT 1,
  `last_accessed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (`asset_id`),
  INDEX (`referer_domain`),
  FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel Redirect Otomatis (Saat File Dipindahkan / Di-rename)
CREATE TABLE IF NOT EXISTS `asset_redirects` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `old_file_path` VARCHAR(500) NOT NULL,
  `new_file_path` VARCHAR(500) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (`old_file_path`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel Pengaturan Sistem (Domain Utama, Sub-path, Folder Uploads)
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` INT UNSIGNED PRIMARY KEY DEFAULT 1,
  `main_domain` VARCHAR(255) NOT NULL DEFAULT 'https://bewhy.id',
  `sub_path` VARCHAR(255) NOT NULL DEFAULT '/wp-content',
  `upload_folder` VARCHAR(100) NOT NULL DEFAULT 'uploads',
  `local_proxy_target` VARCHAR(255) NOT NULL DEFAULT 'http://localhost',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `system_settings` (`id`, `main_domain`, `sub_path`, `upload_folder`, `local_proxy_target`) 
VALUES (1, 'https://bewhy.id', '/wp-content', 'uploads', 'http://localhost')
ON DUPLICATE KEY UPDATE `id` = 1;