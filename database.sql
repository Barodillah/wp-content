CREATE TABLE `assets` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `file_name` VARCHAR(255) NOT NULL,
  `file_path` TEXT NOT NULL,
  `file_type` VARCHAR(50) DEFAULT NULL,
  `file_size` BIGINT UNSIGNED DEFAULT 0,
  `source_type` ENUM('upload', 'url') NOT NULL DEFAULT 'upload',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;