<?php
// Asset Delivery, Referer Usage Tracker & 301 Redirect Engine
error_reporting(0);
ini_set('display_errors', 0);

require_once __DIR__ . '/config.php';

$requestedFile = isset($_GET['file']) ? trim($_GET['file']) : '';
$requestedFile = ltrim($requestedFile, '/\\');
$baseFile = basename($requestedFile);

if (empty($baseFile)) {
    http_response_code(400);
    die("Bad Request");
}

// 1. Lacak Akses jika ada Referer (Website yang menyematkan aset)
if ($pdo) {
    try {
        $referer = isset($_SERVER['HTTP_REFERER']) ? trim($_SERVER['HTTP_REFERER']) : '';
        if (!empty($referer)) {
            $domain = parse_url($referer, PHP_URL_HOST);
            if (!empty($domain)) {
                // Cari ID aset di database berdasarkan nama file atau path
                $stmt = $pdo->prepare("SELECT id FROM assets WHERE file_name = :fn OR file_path LIKE :fp LIMIT 1");
                $stmt->execute([
                    ':fn' => $baseFile,
                    ':fp' => '%' . $baseFile . '%'
                ]);
                $assetId = $stmt->fetchColumn();

                if ($assetId) {
                    $stmtLog = $pdo->prepare("INSERT INTO asset_access_logs (asset_id, referer_domain, hit_count, last_accessed_at)
                        VALUES (:aid, :domain, 1, NOW())
                        ON DUPLICATE KEY UPDATE hit_count = hit_count + 1, last_accessed_at = NOW()");
                    $stmtLog->execute([
                        ':aid' => (int)$assetId,
                        ':domain' => strtolower($domain)
                    ]);
                }
            }
        }
    } catch (Exception $e) {
        // Logging tidak boleh menghambat pengiriman file
    }
}

// 2. Cek apakah file fisik ada di disk
$filePathOnDisk = UPLOAD_DIR . $baseFile;

if (file_exists($filePathOnDisk) && is_file($filePathOnDisk)) {
    // Tentukan mime type
    $ext = strtolower(pathinfo($baseFile, PATHINFO_EXTENSION));
    $mimeTypes = [
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png'  => 'image/png',
        'gif'  => 'image/gif',
        'webp' => 'image/webp',
        'svg'  => 'image/svg+xml',
        'pdf'  => 'application/pdf',
        'mp4'  => 'video/mp4',
        'webm' => 'video/webm',
        'txt'  => 'text/plain'
    ];
    $contentType = $mimeTypes[$ext] ?? mime_content_type($filePathOnDisk) ?? 'application/octet-stream';

    // Header CORS agar bisa diakses oleh website lain
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, HEAD, OPTIONS');
    header('Content-Type: ' . $contentType);
    header('Content-Length: ' . filesize($filePathOnDisk));
    header('Cache-Control: public, max-age=86400');
    header('Pragma: public');

    readfile($filePathOnDisk);
    exit;
}

// 3. Jika file tidak ada, cek apakah ada riwayat Rename / Redirect
if ($pdo) {
    try {
        $stmtRedir = $pdo->prepare("SELECT new_file_path FROM asset_redirects WHERE old_file_path = :old ORDER BY id DESC LIMIT 1");
        $stmtRedir->execute([':old' => $baseFile]);
        $newTarget = $stmtRedir->fetchColumn();

        if ($newTarget) {
            $redirectUrl = BASE_URL . $newTarget;
            header("Location: " . $redirectUrl, true, 301);
            exit;
        }
    } catch (Exception $e) {}
}

// 4. Jika tetap tidak ditemukan
http_response_code(404);
header('Content-Type: text/plain');
echo "404 Not Found: File tidak ditemukan.";
exit;
