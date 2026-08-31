<?php
$host = 'localhost';
$user = 'root';
$pass = '';
$db = 'asset_manager';

$pdo = null;
$db_error = null;

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 5,
    ]);
} catch (PDOException $e) {
    $db_error = $e->getMessage();
}

// Konfigurasi dasar
define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('BASE_URL', 'https://bewhy.id/wp-content/uploads/');