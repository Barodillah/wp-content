<?php
header('Content-Type: application/json');
error_reporting(0);
ini_set('display_errors', 0);
require_once 'config.php';

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

$stmt = $pdo->prepare(
    "INSERT INTO assets (file_name, file_path, file_type, file_size, source_type) 
     VALUES (:file_name, :file_path, :file_type, :file_size, :source_type)"
);

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

            // Buat nama unik agar tidak menimpa file lama
            $uniqueName = uniqid('asset_', true) . '.' . $ext;
            $destination = UPLOAD_DIR . $uniqueName;

            if (move_uploaded_file($files['tmp_name'][$i], $destination)) {
                $publicUrl = BASE_URL . $uniqueName;

                $stmt->execute([
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
            $ext = !empty($pathInfo['extension']) ? $pathInfo['extension'] : 'bin';

            $uniqueName = uniqid('url_', true) . '.' . $ext;
            $destination = UPLOAD_DIR . $uniqueName;

            if (file_put_contents($destination, $fileData) !== false) {
                $fileSize = filesize($destination);
                $publicUrl = BASE_URL . $uniqueName;

                $stmt->execute([
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