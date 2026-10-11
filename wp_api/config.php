<?php
$host = 'localhost';
$user = 'root';
$pass = '';
$db = 'wp_content';

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

// Konfigurasi dinamis dari database & file sinkronisasi
$mainDomain = 'https://domain.com';
$subPath = '/wp-content';
$uploadFolder = 'uploads';
$localProxyTarget = 'http://localhost';

$settingsFile = dirname(__DIR__) . '/system_settings.json';

// Coba muat dari database
if ($pdo) {
    try {
        $stmt = $pdo->query("SELECT main_domain, sub_path, upload_folder, local_proxy_target FROM system_settings WHERE id = 1 LIMIT 1");
        $cfg = $stmt->fetch();
        if ($cfg) {
            $mainDomain = trim($cfg['main_domain']);
            $subPath = trim($cfg['sub_path']);
            $uploadFolder = trim($cfg['upload_folder']);
            if (!empty($cfg['local_proxy_target'])) {
                $localProxyTarget = trim($cfg['local_proxy_target']);
            }
        }
    } catch (Exception $e) {
    }
} elseif (file_exists($settingsFile)) {
    // Fallback muat dari system_settings.json jika DB tidak aktif
    $jsonCfg = json_decode(@file_get_contents($settingsFile), true);
    if (is_array($jsonCfg)) {
        if (!empty($jsonCfg['main_domain']))
            $mainDomain = trim($jsonCfg['main_domain']);
        if (isset($jsonCfg['sub_path']))
            $subPath = trim($jsonCfg['sub_path']);
        if (!empty($jsonCfg['upload_folder']))
            $uploadFolder = trim($jsonCfg['upload_folder']);
        if (!empty($jsonCfg['local_proxy_target']))
            $localProxyTarget = trim($jsonCfg['local_proxy_target']);
    }
}

// Normalisasi variabel
$cleanSub = trim($subPath, '/\\');
$subPrefix = !empty($cleanSub) ? '/' . $cleanSub : '';
$uploadFolderClean = trim($uploadFolder, '/\\');
if (empty($uploadFolderClean))
    $uploadFolderClean = 'uploads';

define('MAIN_DOMAIN', rtrim($mainDomain, '/'));
define('SUB_PATH', $subPrefix);
define('UPLOAD_FOLDER_NAME', $uploadFolderClean);
define('LOCAL_PROXY_TARGET', rtrim($localProxyTarget, '/'));
define('UPLOAD_DIR', dirname(__DIR__) . '/' . $uploadFolderClean . '/');
define('BASE_URL', MAIN_DOMAIN . $subPrefix . '/' . $uploadFolderClean . '/');

// Pastikan folder fisik dan .htaccess interceptor ada
if (!is_dir(UPLOAD_DIR)) {
    @mkdir(UPLOAD_DIR, 0755, true);
}
$htaccessFile = UPLOAD_DIR . '.htaccess';
if (!file_exists($htaccessFile)) {
    $htaccessContent = "<IfModule mod_rewrite.c>\n    RewriteEngine On\n    RewriteCond %{REQUEST_FILENAME} -f [OR]\n    RewriteCond %{REQUEST_FILENAME} !-f\n    RewriteRule ^(.*)$ ../wp_api/serve.php?file=\$1 [QSA,L]\n</IfModule>\n";
    @file_put_contents($htaccessFile, $htaccessContent);
}

// Sinkronkan ke system_settings.json untuk vite.config.js jika belum ada
if (!file_exists($settingsFile)) {
    @file_put_contents($settingsFile, json_encode([
        'main_domain' => MAIN_DOMAIN,
        'sub_path' => SUB_PATH,
        'upload_folder' => UPLOAD_FOLDER_NAME,
        'local_proxy_target' => LOCAL_PROXY_TARGET,
        'base_url' => BASE_URL
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}