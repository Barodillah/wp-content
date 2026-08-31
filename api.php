<?php
header('Content-Type: application/json');
error_reporting(0);
ini_set('display_errors', 0);
require_once 'config.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';
$response = ['success' => false, 'data' => null, 'error' => null];

// Cek apakah koneksi DB berhasil
if ($pdo === null) {
    http_response_code(500);
    $response['error'] = 'Koneksi database gagal: ' . ($db_error ?? 'Unknown error');
    echo json_encode($response);
    exit;
}

try {
    if ($action === 'list') {
        $stmt = $pdo->query("SELECT * FROM assets ORDER BY id DESC");
        $assets = $stmt->fetchAll();
        $response['success'] = true;
        $response['data'] = $assets;
    } elseif ($action === 'delete') {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = isset($input['id']) ? (int)$input['id'] : (isset($_POST['id']) ? (int)$_POST['id'] : 0);
        
        if ($id > 0) {
            $stmt = $pdo->prepare("SELECT * FROM assets WHERE id = :id");
            $stmt->execute([':id' => $id]);
            $asset = $stmt->fetch();
            
            if ($asset) {
                $fileNameOnDisk = basename($asset['file_path']);
                $filePathOnDisk = UPLOAD_DIR . $fileNameOnDisk;
                
                if (file_exists($filePathOnDisk)) {
                    unlink($filePathOnDisk);
                }
                
                $delStmt = $pdo->prepare("DELETE FROM assets WHERE id = :id");
                $delStmt->execute([':id' => $id]);
                
                $response['success'] = true;
                $response['data'] = "Asset deleted successfully.";
            } else {
                $response['error'] = "Asset not found in database.";
            }
        } else {
            $response['error'] = "Invalid ID.";
        }
    } elseif ($action === 'rename') {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = isset($input['id']) ? (int)$input['id'] : 0;
        $newName = isset($input['new_name']) ? trim($input['new_name']) : '';
        
        if ($id > 0 && $newName !== '') {
            $stmt = $pdo->prepare("UPDATE assets SET file_name = :new_name WHERE id = :id");
            $stmt->execute([':new_name' => $newName, ':id' => $id]);
            
            if ($stmt->rowCount() > 0) {
                $response['success'] = true;
                $response['data'] = "Asset renamed successfully.";
            } else {
                $response['error'] = "Asset not found or name unchanged.";
            }
        } else {
            $response['error'] = "Invalid ID or empty name.";
        }
    } else {
        $response['error'] = "Invalid action.";
    }
} catch (Exception $e) {
    http_response_code(500);
    $response['error'] = $e->getMessage();
}

echo json_encode($response, JSON_INVALID_UTF8_SUBSTITUTE | JSON_PARTIAL_OUTPUT_ON_ERROR);
