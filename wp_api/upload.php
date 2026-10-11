<?php
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
}
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    exit(0);
}

session_start();
header('Content-Type: application/json');
error_reporting(0);
ini_set('display_errors', 0);
require_once 'config.php';

// Cek autentikasi dan izin upload
$currentUser = isset($_SESSION['user']) ? $_SESSION['user'] : null;
$isSuperuser = $currentUser && $currentUser['role'] === 'superuser';
$canUpload   = $isSuperuser || (!empty($currentUser['can_upload']));

if (!$canUpload) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'saved'   => [],
        'errors'  => ['Akses ditolak: Anda tidak memiliki izin untuk mengunggah file.']
    ]);
    exit;
}

// Cek apakah koneksi DB berhasil
if ($pdo === null) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'saved'   => [],
        'errors'  => ['Koneksi database gagal: ' . ($db_error ?? 'Unknown error')]
    ]);
    exit;
}

// Pastikan direktori upload tersedia
if (!is_dir(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}

$response = [
    'success' => false,
    'saved'   => [],
    'errors'  => []
];

$folderId = isset($_POST['folder_id']) && $_POST['folder_id'] !== '' ? (int)$_POST['folder_id'] : null;

$stmt = $pdo->prepare(
    "INSERT INTO assets (folder_id, file_name, file_path, file_type, file_size, source_type) 
     VALUES (:folder_id, :file_name, :file_path, :file_type, :file_size, :source_type)"
);

function mimeToExtension($mime) {
    $mime = strtolower(trim(explode(';', $mime)[0]));
    $map = [
        'image/jpeg' => 'jpg',
        'image/jpg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp',
        'image/svg+xml' => 'svg',
        'image/bmp' => 'bmp',
        'image/x-icon' => 'ico',
        'video/mp4' => 'mp4',
        'video/webm' => 'webm',
        'video/ogg' => 'ogv',
        'video/quicktime' => 'mov',
        'video/x-msvideo' => 'avi',
        'application/pdf' => 'pdf',
        'application/zip' => 'zip',
        'application/x-zip-compressed' => 'zip',
        'application/x-rar-compressed' => 'rar',
        'application/msword' => 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
        'application/vnd.ms-excel' => 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'xlsx',
        'application/vnd.ms-powerpoint' => 'ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation' => 'pptx',
        'text/plain' => 'txt',
        'text/csv' => 'csv',
        'text/html' => 'html',
        'application/json' => 'json',
        'audio/mpeg' => 'mp3',
        'audio/wav' => 'wav',
        'audio/ogg' => 'ogg'
    ];
    return isset($map[$mime]) ? $map[$mime] : '';
}

// ==========================================
// 1. HANDLER: MULTIPLE UPLOAD FILE
// ==========================================
if (!empty($_FILES['files']['name'][0])) {
    $files = $_FILES['files'];
    $totalFiles = count($files['name']);

    for ($i = 0; $i < $totalFiles; $i++) {
        if ($files['error'][$i] === UPLOAD_ERR_OK) {
            $origName = basename($files['name'][$i]);
            $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
            $fileSize = $files['size'][$i];
            $mimeType = mime_content_type($files['tmp_name'][$i]);

            if (empty($ext)) {
                $ext = mimeToExtension($mimeType);
                if (!empty($ext)) {
                    $origName = rtrim($origName, '.') . '.' . $ext;
                }
            }

            // Buat nama unik agar tidak menimpa file lama
            $uniqueName = uniqid('asset_', true) . ($ext ? '.' . $ext : '');
            $destination = UPLOAD_DIR . $uniqueName;

            if (move_uploaded_file($files['tmp_name'][$i], $destination)) {
                $publicUrl = BASE_URL . $uniqueName;

                $stmt->execute([
                    ':folder_id'   => $folderId,
                    ':file_name'   => $origName,
                    ':file_path'   => $publicUrl,
                    ':file_type'   => $mimeType,
                    ':file_size'   => $fileSize,
                    ':source_type' => 'upload'
                ]);

                $response['saved'][] = [
                    'name' => $origName,
                    'url'  => $publicUrl
                ];
            } else {
                $response['errors'][] = "Gagal memindahkan file: $origName";
            }
        } else {
            $response['errors'][] = "Error pada upload file indeks ke-$i";
        }
    }
}

// ==========================================
// 2. HANDLER: FETCH DARI URL / LINK
// ==========================================
if (!empty($_POST['asset_url'])) {
    $rawUrl = trim($_POST['asset_url']);

    if (filter_var($rawUrl, FILTER_VALIDATE_URL)) {
        // Ambil konten file via cURL
        $ch = curl_init($rawUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        $fileData = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        curl_close($ch);

        if ($httpCode === 200 && $fileData !== false) {
            $pathInfo = pathinfo(parse_url($rawUrl, PHP_URL_PATH));
            $origName = !empty($pathInfo['basename']) ? $pathInfo['basename'] : 'fetched_asset';
            $ext = !empty($pathInfo['extension']) ? strtolower($pathInfo['extension']) : '';

            if (empty($ext) || $ext === 'bin') {
                $inferredExt = mimeToExtension($contentType);
                if (!empty($inferredExt)) {
                    $ext = $inferredExt;
                }
            }

            if (!empty($ext) && empty(pathinfo($origName, PATHINFO_EXTENSION))) {
                $origName = rtrim($origName, '.') . '.' . $ext;
            }

            $uniqueName = uniqid('url_', true) . ($ext ? '.' . $ext : '');
            $destination = UPLOAD_DIR . $uniqueName;

            if (file_put_contents($destination, $fileData) !== false) {
                $fileSize = filesize($destination);
                $publicUrl = BASE_URL . $uniqueName;

                $stmt->execute([
                    ':folder_id'   => $folderId,
                    ':file_name'   => $origName,
                    ':file_path'   => $publicUrl,
                    ':file_type'   => $contentType,
                    ':file_size'   => $fileSize,
                    ':source_type' => 'url'
                ]);

                $response['saved'][] = [
                    'name' => $origName,
                    'url'  => $publicUrl
                ];
            } else {
                $response['errors'][] = "Gagal menyimpan konten dari URL.";
            }
        } else {
            $response['errors'][] = "Gagal mengambil file dari link (HTTP: $httpCode).";
        }
    } else {
        $response['errors'][] = "Format URL tidak valid.";
    }
}

if (!empty($response['saved'])) {
    $response['success'] = true;
}

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);