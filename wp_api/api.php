<?php
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
}
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    exit(0);
}

session_start();
header('Content-Type: application/json');
error_reporting(0);
ini_set('display_errors', 0);
require_once 'config.php';

$rawInput = file_get_contents('php://input');
$input = !empty($rawInput) ? json_decode($rawInput, true) : [];
if (!is_array($input)) $input = [];

$action = isset($_GET['action']) ? $_GET['action'] : (isset($input['action']) ? $input['action'] : '');
$response = ['success' => false, 'data' => null, 'error' => null];

// Cek apakah koneksi DB berhasil
if ($pdo === null) {
    http_response_code(500);
    $response['error'] = 'Koneksi database gagal: ' . ($db_error ?? 'Unknown error');
    echo json_encode($response);
    exit;
}

// Endpoint: Login
if ($action === 'login') {
    $username = isset($input['username']) ? trim($input['username']) : (isset($_POST['username']) ? trim($_POST['username']) : '');
    $password = isset($input['password']) ? (string)$input['password'] : (isset($_POST['password']) ? (string)$_POST['password'] : '');

    if (empty($username) || empty($password)) {
        http_response_code(400);
        $response['error'] = 'Username dan password wajib diisi.';
        echo json_encode($response);
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = :u LIMIT 1");
    $stmt->execute([':u' => $username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        $isDefaultUsername = ($user['username'] === 'admin');
        $isDefaultPassword = password_verify('admin123', $user['password']);
        $isDefaultName = ($user['name'] === 'Super Administrator');
        $user['is_default_admin'] = ($isDefaultUsername && $isDefaultName && $isDefaultPassword);
        unset($user['password']);
        $_SESSION['user'] = $user;
        $response['success'] = true;
        $response['data'] = $user;
    } else {
        http_response_code(401);
        $response['error'] = 'Username atau password salah.';
    }
    echo json_encode($response);
    exit;
}

// Endpoint: Logout
if ($action === 'logout') {
    $_SESSION = [];
    if (session_id() != "" || isset($_COOKIE[session_name()])) {
        setcookie(session_name(), '', time() - 3600, '/');
    }
    session_destroy();
    $response['success'] = true;
    $response['data'] = 'Logged out';
    echo json_encode($response);
    exit;
}

// Endpoint: Check Me
if ($action === 'me') {
    $currentUser = isset($_SESSION['user']) ? $_SESSION['user'] : null;
    if ($currentUser) {
        $stmt = $pdo->prepare("SELECT id, username, name, role, can_upload, can_delete, can_rename, can_move, password FROM users WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $currentUser['id']]);
        $fresh = $stmt->fetch();
        if ($fresh) {
            $isDefaultUsername = ($fresh['username'] === 'admin');
            $isDefaultPassword = password_verify('admin123', $fresh['password']);
            $isDefaultName = ($fresh['name'] === 'Super Administrator');
            $fresh['is_default_admin'] = ($isDefaultUsername && $isDefaultName && $isDefaultPassword);
            unset($fresh['password']);
            $_SESSION['user'] = $fresh;
            $currentUser = $fresh;
        }
        $response['success'] = true;
        $response['data'] = $currentUser;
    } else {
        http_response_code(401);
        $response['error'] = 'Unauthenticated';
    }
    echo json_encode($response);
    exit;
}

// Cek Autentikasi User untuk aksi lainnya
$currentUser = isset($_SESSION['user']) ? $_SESSION['user'] : null;
if (!$currentUser) {
    if ($action === 'download' || $action === 'bulk_download') {
        http_response_code(401);
        die("Akses ditolak: Anda belum masuk.");
    }
    http_response_code(401);
    $response['error'] = 'Sesi telah berakhir atau belum masuk. Silakan login kembali.';
    echo json_encode($response);
    exit;
}

function getExtensionForAsset($asset) {
    if (!empty($asset['file_name'])) {
        $ext = pathinfo($asset['file_name'], PATHINFO_EXTENSION);
        if (!empty($ext)) {
            return strtolower($ext);
        }
    }
    if (!empty($asset['file_path'])) {
        $parsedPath = parse_url($asset['file_path'], PHP_URL_PATH);
        $ext = pathinfo($parsedPath, PATHINFO_EXTENSION);
        if (!empty($ext)) {
            return strtolower($ext);
        }
    }
    $mime = !empty($asset['file_type']) ? strtolower(trim($asset['file_type'])) : '';
    $mimeMap = [
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
    if (isset($mimeMap[$mime])) {
        return $mimeMap[$mime];
    }
    return '';
}

function ensureFileNameExtension($name, $asset) {
    $existingExt = pathinfo($name, PATHINFO_EXTENSION);
    if (!empty($existingExt)) {
        return $name;
    }
    $ext = getExtensionForAsset($asset);
    if (!empty($ext)) {
        return rtrim($name, '.') . '.' . $ext;
    }
    return $name;
}

function getAssetUsageDetails($pdo, $assetId, $assetFileName, $assetFilePath) {
    $usage = [
        'is_in_use' => false,
        'wp_posts' => [],
        'external_referers' => [],
        'total_external_hits' => 0
    ];

    static $hasWpPosts = null;
    if ($hasWpPosts === null) {
        $stmtCheck = $pdo->query("SHOW TABLES LIKE 'wp_posts'");
        $hasWpPosts = ($stmtCheck->rowCount() > 0);
    }

    if ($hasWpPosts && !empty($assetFileName)) {
        $stmt = $pdo->prepare("SELECT ID, post_title, post_type, guid FROM wp_posts WHERE post_status IN ('publish', 'inherit') AND (post_content LIKE :p1 OR guid LIKE :p2) LIMIT 10");
        $stmt->execute([
            ':p1' => '%' . $assetFileName . '%',
            ':p2' => '%' . $assetFileName . '%'
        ]);
        $usage['wp_posts'] = $stmt->fetchAll();
        if (!empty($usage['wp_posts'])) {
            $usage['is_in_use'] = true;
        }
    }

    $stmtLogs = $pdo->prepare("SELECT referer_domain, hit_count, last_accessed_at FROM asset_access_logs WHERE asset_id = :id AND last_accessed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) ORDER BY hit_count DESC LIMIT 10");
    $stmtLogs->execute([':id' => $assetId]);
    $logs = $stmtLogs->fetchAll();
    if (!empty($logs)) {
        $usage['external_referers'] = $logs;
        foreach ($logs as $l) {
            $usage['total_external_hits'] += (int)$l['hit_count'];
        }
        $usage['is_in_use'] = true;
    }

    return $usage;
}

function attachUsageStatsToAssets($pdo, &$assets) {
    if (empty($assets)) return;
    $assetIds = array_map(function($a) { return (int)$a['id']; }, $assets);
    $inClause = implode(',', $assetIds);

    $stmtLogs = $pdo->query("SELECT asset_id, SUM(hit_count) as total_hits, COUNT(DISTINCT referer_domain) as domain_count 
                             FROM asset_access_logs 
                             WHERE asset_id IN ($inClause) AND last_accessed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
                             GROUP BY asset_id");
    $logsMap = [];
    while ($row = $stmtLogs->fetch()) {
        $logsMap[$row['asset_id']] = [
            'total_hits' => (int)$row['total_hits'],
            'domain_count' => (int)$row['domain_count']
        ];
    }

    static $hasWpPosts = null;
    if ($hasWpPosts === null) {
        $stmtCheck = $pdo->query("SHOW TABLES LIKE 'wp_posts'");
        $hasWpPosts = ($stmtCheck->rowCount() > 0);
    }

    $wpUsageMap = [];
    if ($hasWpPosts) {
        foreach ($assets as $asset) {
            $fName = $asset['file_name'];
            if (!empty($fName)) {
                $stmtWp = $pdo->prepare("SELECT COUNT(*) FROM wp_posts WHERE post_status IN ('publish', 'inherit') AND (post_content LIKE :p OR guid LIKE :p) LIMIT 1");
                $stmtWp->execute([':p' => '%' . $fName . '%']);
                $cnt = (int)$stmtWp->fetchColumn();
                if ($cnt > 0) {
                    $wpUsageMap[$asset['id']] = $cnt;
                }
            }
        }
    }

    foreach ($assets as &$asset) {
        $id = $asset['id'];
        $logInfo = $logsMap[$id] ?? ['total_hits' => 0, 'domain_count' => 0];
        $wpCount = $wpUsageMap[$id] ?? 0;

        $asset['usage_wp_count'] = $wpCount;
        $asset['usage_ext_hits'] = $logInfo['total_hits'];
        $asset['usage_ext_domains'] = $logInfo['domain_count'];
        $asset['is_in_use'] = ($wpCount > 0 || $logInfo['total_hits'] > 0);
    }
}

$isSuperuser = $currentUser['role'] === 'superuser';
$canUpload   = $isSuperuser || (!empty($currentUser['can_upload']));
$canDelete   = $isSuperuser || (!empty($currentUser['can_delete']));
$canRename   = $isSuperuser || (!empty($currentUser['can_rename']));
$canMove     = $isSuperuser || (!empty($currentUser['can_move']));

try {
    if ($action === 'list') {
        $folderId = isset($_GET['folder_id']) && $_GET['folder_id'] !== '' ? (int)$_GET['folder_id'] : null;
        
        if ($folderId !== null) {
            $stmtFolders = $pdo->prepare("SELECT f.*, COUNT(a.id) AS file_count, COALESCE(SUM(a.file_size), 0) AS total_size 
                                          FROM folders f 
                                          LEFT JOIN assets a ON a.folder_id = f.id 
                                          WHERE f.parent_id = :folder_id 
                                          GROUP BY f.id 
                                          ORDER BY f.name ASC");
            $stmtFolders->execute([':folder_id' => $folderId]);
            $folders = $stmtFolders->fetchAll();
            
            $stmtAssets = $pdo->prepare("SELECT a.*, f.name AS folder_name FROM assets a LEFT JOIN folders f ON a.folder_id = f.id WHERE a.folder_id = :folder_id ORDER BY a.id DESC");
            $stmtAssets->execute([':folder_id' => $folderId]);
            $assets = $stmtAssets->fetchAll();
        } else {
            $stmtFolders = $pdo->query("SELECT f.*, COUNT(a.id) AS file_count, COALESCE(SUM(a.file_size), 0) AS total_size 
                                        FROM folders f 
                                        LEFT JOIN assets a ON a.folder_id = f.id 
                                        WHERE f.parent_id IS NULL 
                                        GROUP BY f.id 
                                        ORDER BY f.name ASC");
            $folders = $stmtFolders->fetchAll();
            
            $stmtAssets = $pdo->query("SELECT a.*, f.name AS folder_name FROM assets a LEFT JOIN folders f ON a.folder_id = f.id WHERE a.folder_id IS NULL ORDER BY a.id DESC");
            $assets = $stmtAssets->fetchAll();
        }

        attachUsageStatsToAssets($pdo, $assets);
        
        // Build breadcrumbs if in a folder
        $currentFolder = null;
        $breadcrumbs = [];
        if ($folderId !== null) {
            $stmtFolder = $pdo->prepare("SELECT * FROM folders WHERE id = :id");
            $stmtFolder->execute([':id' => $folderId]);
            $currentFolder = $stmtFolder->fetch();
            
            $curr = $currentFolder;
            while ($curr) {
                array_unshift($breadcrumbs, $curr);
                if ($curr['parent_id']) {
                    $stmtParent = $pdo->prepare("SELECT * FROM folders WHERE id = :id");
                    $stmtParent->execute([':id' => $curr['parent_id']]);
                    $curr = $stmtParent->fetch();
                } else {
                    $curr = null;
                }
            }
        }
        
        $response['success'] = true;
        $response['data'] = [
            'folders' => $folders,
            'assets' => $assets,
            'currentFolder' => $currentFolder,
            'breadcrumbs' => $breadcrumbs
        ];
    } elseif ($action === 'create_folder') {
        if (!$canUpload) {
            $response['error'] = "Akses ditolak: Anda tidak memiliki izin membuat folder.";
        } else {
            $input = json_decode(file_get_contents('php://input'), true);
            $name = isset($input['name']) ? trim($input['name']) : '';
            $parentId = isset($input['parent_id']) && $input['parent_id'] !== '' ? (int)$input['parent_id'] : null;
            
            if ($name !== '') {
                $stmt = $pdo->prepare("INSERT INTO folders (name, parent_id) VALUES (:name, :parent_id)");
                $stmt->execute([':name' => $name, ':parent_id' => $parentId]);
                $response['success'] = true;
                $response['data'] = $pdo->lastInsertId();
            } else {
                $response['error'] = "Folder name cannot be empty.";
            }
        }
    } elseif ($action === 'rename_folder') {
        if (!$canRename) {
            $response['error'] = "Akses ditolak: Anda tidak memiliki izin mengubah nama folder.";
        } else {
            $input = json_decode(file_get_contents('php://input'), true);
            $id = isset($input['id']) ? (int)$input['id'] : 0;
            $newName = isset($input['new_name']) ? trim($input['new_name']) : '';
            
            if ($id > 0 && $newName !== '') {
                $stmt = $pdo->prepare("UPDATE folders SET name = :new_name WHERE id = :id");
                $stmt->execute([':new_name' => $newName, ':id' => $id]);
                $response['success'] = true;
                $response['data'] = "Folder renamed.";
            } else {
                $response['error'] = "Invalid ID or name.";
            }
        }
    } elseif ($action === 'delete_folder') {
        if (!$canDelete) {
            $response['error'] = "Akses ditolak: Anda tidak memiliki izin menghapus folder.";
        } else {
            $input = json_decode(file_get_contents('php://input'), true);
            $id = isset($input['id']) ? (int)$input['id'] : 0;
            
            if ($id > 0) {
                $stmt = $pdo->prepare("DELETE FROM folders WHERE id = :id");
                $stmt->execute([':id' => $id]);
                $response['success'] = true;
                $response['data'] = "Folder deleted.";
            } else {
                $response['error'] = "Invalid ID.";
            }
        }
    } elseif ($action === 'get_all_folders') {
        $stmtFolders = $pdo->query("SELECT id, name, parent_id FROM folders ORDER BY name ASC");
        $folders = $stmtFolders->fetchAll();
        $response['success'] = true;
        $response['data'] = $folders;
    } elseif ($action === 'move_asset') {
        if (!$canMove) {
            $response['error'] = "Akses ditolak: Anda tidak memiliki izin memindahkan file.";
        } else {
            $input = json_decode(file_get_contents('php://input'), true);
            $id = isset($input['id']) ? (int)$input['id'] : 0;
            $folderId = isset($input['folder_id']) && $input['folder_id'] !== '' ? (int)$input['folder_id'] : null;
            
            if ($id > 0) {
                $stmt = $pdo->prepare("UPDATE assets SET folder_id = :folder_id WHERE id = :id");
                $stmt->execute([':folder_id' => $folderId, ':id' => $id]);
                $response['success'] = true;
                $response['data'] = "Asset moved.";
            } else {
                $response['error'] = "Invalid asset ID.";
            }
        }
    } elseif ($action === 'search') {
        $q = isset($_GET['q']) ? $_GET['q'] : '';
        $stmtAssets = $pdo->prepare("SELECT a.*, f.name AS folder_name FROM assets a LEFT JOIN folders f ON a.folder_id = f.id WHERE a.file_name LIKE :q ORDER BY a.id DESC");
        $stmtAssets->execute([':q' => "%$q%"]);
        $assets = $stmtAssets->fetchAll();
        attachUsageStatsToAssets($pdo, $assets);
        
        $stmtFolders = $pdo->prepare("SELECT f.*, COUNT(a.id) AS file_count, COALESCE(SUM(a.file_size), 0) AS total_size 
                                      FROM folders f 
                                      LEFT JOIN assets a ON a.folder_id = f.id 
                                      WHERE f.name LIKE :q 
                                      GROUP BY f.id 
                                      ORDER BY f.name ASC");
        $stmtFolders->execute([':q' => "%$q%"]);
        $folders = $stmtFolders->fetchAll();
        
        $response['success'] = true;
        $response['data'] = [
            'folders' => $folders,
            'assets' => $assets
        ];
    } elseif ($action === 'get_all_folders') {
        $stmtFolders = $pdo->query("SELECT id, name FROM folders ORDER BY name ASC");
        $folders = $stmtFolders->fetchAll();
        $response['success'] = true;
        $response['data'] = $folders;
    } elseif ($action === 'check_asset_usage') {
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        $idsParam = isset($_GET['ids']) ? trim($_GET['ids']) : '';

        if ($id > 0) {
            $stmtAsset = $pdo->prepare("SELECT id, file_name, file_path FROM assets WHERE id = :id LIMIT 1");
            $stmtAsset->execute([':id' => $id]);
            $asset = $stmtAsset->fetch();
            if (!$asset) {
                $response['error'] = "Asset tidak ditemukan.";
            } else {
                $response['success'] = true;
                $response['data'] = array_merge(
                    ['asset' => $asset],
                    getAssetUsageDetails($pdo, $asset['id'], $asset['file_name'], $asset['file_path'])
                );
            }
        } elseif (!empty($idsParam)) {
            $idList = array_filter(array_map('intval', explode(',', $idsParam)), function($i) { return $i > 0; });
            $results = [];
            foreach ($idList as $aid) {
                $stmtAsset = $pdo->prepare("SELECT id, file_name, file_path FROM assets WHERE id = :id LIMIT 1");
                $stmtAsset->execute([':id' => $aid]);
                $asset = $stmtAsset->fetch();
                if ($asset) {
                    $details = getAssetUsageDetails($pdo, $asset['id'], $asset['file_name'], $asset['file_path']);
                    if ($details['is_in_use']) {
                        $results[] = array_merge(['asset' => $asset], $details);
                    }
                }
            }
            $response['success'] = true;
            $response['data'] = [
                'has_in_use' => !empty($results),
                'in_use_assets' => $results
            ];
        } else {
            $response['error'] = "Parameter id atau ids diperlukan.";
        }
    } elseif ($action === 'track_access') {
        $assetId = isset($_REQUEST['asset_id']) ? (int)$_REQUEST['asset_id'] : 0;
        $fileName = isset($_REQUEST['file_name']) ? trim($_REQUEST['file_name']) : '';
        $referer = isset($_SERVER['HTTP_REFERER']) ? trim($_SERVER['HTTP_REFERER']) : '';

        if (!empty($referer)) {
            $domain = parse_url($referer, PHP_URL_HOST);
            $serverHost = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : '';
            if ($domain && $domain !== $serverHost) {
                if ($assetId <= 0 && !empty($fileName)) {
                    $stmtFind = $pdo->prepare("SELECT id FROM assets WHERE file_name = :fn OR file_path LIKE :fp LIMIT 1");
                    $stmtFind->execute([':fn' => $fileName, ':fp' => '%' . $fileName . '%']);
                    $assetId = (int)$stmtFind->fetchColumn();
                }

                if ($assetId > 0) {
                    $stmtLog = $pdo->prepare("INSERT INTO asset_access_logs (asset_id, referer_domain, hit_count, last_accessed_at)
                        VALUES (:aid, :domain, 1, NOW())
                        ON DUPLICATE KEY UPDATE hit_count = hit_count + 1, last_accessed_at = NOW()");
                    $stmtLog->execute([':aid' => $assetId, ':domain' => $domain]);
                }
            }
        }
        $response['success'] = true;
        $response['data'] = 'Tracked';
    } elseif ($action === 'delete') {
        if (!$canDelete) {
            $response['error'] = "Akses ditolak: Anda tidak memiliki izin menghapus file.";
        } else {
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
        }
    } elseif ($action === 'rename') {
        if (!$canRename) {
            $response['error'] = "Akses ditolak: Anda tidak memiliki izin mengubah nama file.";
        } else {
            $input = json_decode(file_get_contents('php://input'), true);
            $id = isset($input['id']) ? (int)$input['id'] : 0;
            $newName = isset($input['new_name']) ? trim($input['new_name']) : '';
            
            if ($id > 0 && $newName !== '') {
                $stmtAsset = $pdo->prepare("SELECT id, file_name, file_path, file_type FROM assets WHERE id = :id");
                $stmtAsset->execute([':id' => $id]);
                $targetAsset = $stmtAsset->fetch();

                if ($targetAsset) {
                    $newName = ensureFileNameExtension($newName, $targetAsset);
                    $stmt = $pdo->prepare("UPDATE assets SET file_name = :new_name WHERE id = :id");
                    $stmt->execute([':new_name' => $newName, ':id' => $id]);

                    if ($targetAsset['file_name'] !== $newName) {
                        try {
                            $stmtRedir = $pdo->prepare("INSERT INTO asset_redirects (old_file_path, new_file_path) VALUES (:old, :new)");
                            $stmtRedir->execute([':old' => $targetAsset['file_name'], ':new' => $newName]);
                        } catch (Exception $e) {}
                    }
                    
                    $response['success'] = true;
                    $response['data'] = "Asset renamed successfully.";
                } else {
                    $response['error'] = "Asset not found.";
                }
            } else {
                $response['error'] = "Invalid ID or empty name.";
            }
        }
    } elseif ($action === 'bulk_move') {
        if (!$canMove) {
            $response['error'] = "Akses ditolak: Anda tidak memiliki izin memindahkan file.";
        } else {
            $input = json_decode(file_get_contents('php://input'), true);
            $ids = isset($input['ids']) && is_array($input['ids']) ? array_map('intval', $input['ids']) : [];
            $ids = array_filter($ids, function($id) { return $id > 0; });
            $folderId = isset($input['folder_id']) && $input['folder_id'] !== '' ? (int)$input['folder_id'] : null;

            if (!empty($ids)) {
                $placeholders = implode(',', array_fill(0, count($ids), '?'));
                $params = array_merge([$folderId], array_values($ids));
                $stmt = $pdo->prepare("UPDATE assets SET folder_id = ? WHERE id IN ($placeholders)");
                $stmt->execute($params);
                $response['success'] = true;
                $response['data'] = count($ids) . " file berhasil dipindahkan.";
            } else {
                $response['error'] = "Tidak ada file yang dipilih.";
            }
        }
    } elseif ($action === 'bulk_delete') {
        if (!$canDelete) {
            $response['error'] = "Akses ditolak: Anda tidak memiliki izin menghapus file.";
        } else {
            $input = json_decode(file_get_contents('php://input'), true);
            $ids = isset($input['ids']) && is_array($input['ids']) ? array_map('intval', $input['ids']) : [];
            $ids = array_filter($ids, function($id) { return $id > 0; });

            if (!empty($ids)) {
                $placeholders = implode(',', array_fill(0, count($ids), '?'));
                $stmt = $pdo->prepare("SELECT id, file_path FROM assets WHERE id IN ($placeholders)");
                $stmt->execute(array_values($ids));
                $assets = $stmt->fetchAll();
                foreach ($assets as $asset) {
                    $fileNameOnDisk = basename($asset['file_path']);
                    $filePathOnDisk = UPLOAD_DIR . $fileNameOnDisk;
                    if (file_exists($filePathOnDisk)) {
                        @unlink($filePathOnDisk);
                    }
                }
                $delStmt = $pdo->prepare("DELETE FROM assets WHERE id IN ($placeholders)");
                $delStmt->execute(array_values($ids));
                $response['success'] = true;
                $response['data'] = count($assets) . " file berhasil dihapus.";
            } else {
                $response['error'] = "Tidak ada file yang dipilih.";
            }
        }
    } elseif ($action === 'bulk_rename') {
        if (!$canRename) {
            $response['error'] = "Akses ditolak: Anda tidak memiliki izin mengubah nama file.";
        } else {
            $input = json_decode(file_get_contents('php://input'), true);
            $items = isset($input['items']) && is_array($input['items']) ? $input['items'] : [];
            $ids = isset($input['ids']) && is_array($input['ids']) ? array_map('intval', $input['ids']) : [];
            $ids = array_filter($ids, function($id) { return $id > 0; });
            $baseName = isset($input['base_name']) ? trim($input['base_name']) : '';

            if (!empty($items)) {
                $count = 0;
                $updateStmt = $pdo->prepare("UPDATE assets SET file_name = :new_name WHERE id = :id");
                foreach ($items as $item) {
                    $id = isset($item['id']) ? intval($item['id']) : 0;
                    $newName = isset($item['new_name']) ? trim($item['new_name']) : '';
                    if ($id > 0 && $newName !== '') {
                        $stmtOld = $pdo->prepare("SELECT file_name FROM assets WHERE id = :id LIMIT 1");
                        $stmtOld->execute([':id' => $id]);
                        $oldName = $stmtOld->fetchColumn();

                        $updateStmt->execute([':new_name' => $newName, ':id' => $id]);

                        if ($oldName && $oldName !== $newName) {
                            try {
                                $stmtRedir = $pdo->prepare("INSERT INTO asset_redirects (old_file_path, new_file_path) VALUES (:old, :new)");
                                $stmtRedir->execute([':old' => $oldName, ':new' => $newName]);
                            } catch (Exception $e) {}
                        }
                        $count++;
                    }
                }
                $response['success'] = true;
                $response['data'] = "$count file berhasil diganti nama.";
            } elseif (!empty($ids) && $baseName !== '') {
                $orderIndex = 1;
                $updateStmt = $pdo->prepare("UPDATE assets SET file_name = :new_name WHERE id = :id");
                foreach ($ids as $id) {
                    $stmt = $pdo->prepare("SELECT id, file_name, file_path, file_type FROM assets WHERE id = :id");
                    $stmt->execute([':id' => $id]);
                    $asset = $stmt->fetch();
                    if ($asset) {
                        $ext = getExtensionForAsset($asset);
                        $newName = $baseName . '-' . $orderIndex . ($ext ? '.' . $ext : '');
                        $updateStmt->execute([':new_name' => $newName, ':id' => $id]);

                        if ($asset['file_name'] !== $newName) {
                            try {
                                $stmtRedir = $pdo->prepare("INSERT INTO asset_redirects (old_file_path, new_file_path) VALUES (:old, :new)");
                                $stmtRedir->execute([':old' => $asset['file_name'], ':new' => $newName]);
                            } catch (Exception $e) {}
                        }
                        $orderIndex++;
                    }
                }
                $response['success'] = true;
                $response['data'] = ($orderIndex - 1) . " file berhasil diganti nama.";
            } else {
                $response['error'] = "Daftar file atau nama dasar tidak boleh kosong.";
            }
        }
    } elseif ($action === 'get_users') {
        if (!$isSuperuser) {
            http_response_code(403);
            $response['error'] = "Akses ditolak: Hanya Superuser yang dapat mengakses data pengguna.";
        } else {
            $stmtUsers = $pdo->query("SELECT id, username, name, role, can_upload, can_delete, can_rename, can_move, created_at FROM users ORDER BY id ASC");
            $response['success'] = true;
            $response['data'] = $stmtUsers->fetchAll();
        }
    } elseif ($action === 'create_user') {
        if (!$isSuperuser) {
            http_response_code(403);
            $response['error'] = "Akses ditolak: Hanya Superuser yang dapat membuat pengguna baru.";
        } else {
            $input = json_decode(file_get_contents('php://input'), true);
            $username = isset($input['username']) ? strtolower(trim($input['username'])) : '';
            $password = isset($input['password']) ? trim($input['password']) : '';
            $name = isset($input['name']) ? trim($input['name']) : '';
            $canUpload = !empty($input['can_upload']) ? 1 : 0;
            $canDelete = !empty($input['can_delete']) ? 1 : 0;
            $canRename = !empty($input['can_rename']) ? 1 : 0;
            $canMove = !empty($input['can_move']) ? 1 : 0;

            if (strlen($username) < 3) {
                $response['error'] = "Username minimal 3 karakter.";
            } elseif (strlen($password) < 4) {
                $response['error'] = "Password minimal 4 karakter.";
            } elseif ($name === '') {
                $response['error'] = "Nama lengkap wajib diisi.";
            } else {
                $stmtCheck = $pdo->prepare("SELECT id FROM users WHERE username = :username");
                $stmtCheck->execute([':username' => $username]);
                if ($stmtCheck->fetch()) {
                    $response['error'] = "Username '$username' sudah terdaftar.";
                } else {
                    $hash = password_hash($password, PASSWORD_BCRYPT);
                    $stmtIns = $pdo->prepare("INSERT INTO users (username, password, name, role, can_upload, can_delete, can_rename, can_move) VALUES (:u, :p, :n, 'user', :cu, :cd, :cr, :cm)");
                    $stmtIns->execute([
                        ':u' => $username,
                        ':p' => $hash,
                        ':n' => $name,
                        ':cu' => $canUpload,
                        ':cd' => $canDelete,
                        ':cr' => $canRename,
                        ':cm' => $canMove
                    ]);
                    $response['success'] = true;
                    $response['data'] = "Pengguna baru berhasil ditambahkan.";
                }
            }
        }
    } elseif ($action === 'update_user') {
        if (!$isSuperuser) {
            http_response_code(403);
            $response['error'] = "Akses ditolak: Hanya Superuser yang dapat mengubah pengguna.";
        } else {
            $input = json_decode(file_get_contents('php://input'), true);
            $id = isset($input['id']) ? (int)$input['id'] : 0;
            $name = isset($input['name']) ? trim($input['name']) : '';
            $password = isset($input['password']) ? trim($input['password']) : '';
            $canUpload = !empty($input['can_upload']) ? 1 : 0;
            $canDelete = !empty($input['can_delete']) ? 1 : 0;
            $canRename = !empty($input['can_rename']) ? 1 : 0;
            $canMove = !empty($input['can_move']) ? 1 : 0;

            $stmtCheck = $pdo->prepare("SELECT * FROM users WHERE id = :id");
            $stmtCheck->execute([':id' => $id]);
            $targetUser = $stmtCheck->fetch();

            if (!$targetUser) {
                $response['error'] = "Pengguna tidak ditemukan.";
            } else {
                // Jika superuser, pertahankan semua izin penuh
                if ($targetUser['role'] === 'superuser') {
                    $canUpload = 1;
                    $canDelete = 1;
                    $canRename = 1;
                    $canMove = 1;
                }

                if ($name === '') $name = $targetUser['name'];

                if (!empty($password)) {
                    if (strlen($password) < 4) {
                        $response['error'] = "Password minimal 4 karakter.";
                    } else {
                        $hash = password_hash($password, PASSWORD_BCRYPT);
                        $stmtUp = $pdo->prepare("UPDATE users SET name = :n, password = :p, can_upload = :cu, can_delete = :cd, can_rename = :cr, can_move = :cm WHERE id = :id");
                        $stmtUp->execute([
                            ':n' => $name,
                            ':p' => $hash,
                            ':cu' => $canUpload,
                            ':cd' => $canDelete,
                            ':cr' => $canRename,
                            ':cm' => $canMove,
                            ':id' => $id
                        ]);
                        $response['success'] = true;
                        $response['data'] = "Pengguna berhasil diperbarui.";
                    }
                } else {
                    $stmtUp = $pdo->prepare("UPDATE users SET name = :n, can_upload = :cu, can_delete = :cd, can_rename = :cr, can_move = :cm WHERE id = :id");
                    $stmtUp->execute([
                        ':n' => $name,
                        ':cu' => $canUpload,
                        ':cd' => $canDelete,
                        ':cr' => $canRename,
                        ':cm' => $canMove,
                        ':id' => $id
                    ]);
                    $response['success'] = true;
                    $response['data'] = "Pengguna berhasil diperbarui.";
                }
            }
        }
    } elseif ($action === 'delete_user') {
        if (!$isSuperuser) {
            http_response_code(403);
            $response['error'] = "Akses ditolak: Hanya Superuser yang dapat menghapus pengguna.";
        } else {
            $input = json_decode(file_get_contents('php://input'), true);
            $id = isset($input['id']) ? (int)$input['id'] : 0;

            $stmtCheck = $pdo->prepare("SELECT * FROM users WHERE id = :id");
            $stmtCheck->execute([':id' => $id]);
            $targetUser = $stmtCheck->fetch();

            if (!$targetUser) {
                $response['error'] = "Pengguna tidak ditemukan.";
            } elseif ($targetUser['role'] === 'superuser') {
                $response['error'] = "Akun Superuser tidak dapat dihapus.";
            } elseif ($targetUser['id'] == $currentUser['id']) {
                $response['error'] = "Anda tidak dapat menghapus akun Anda sendiri.";
            } else {
                $stmtDel = $pdo->prepare("DELETE FROM users WHERE id = :id");
                $stmtDel->execute([':id' => $id]);
                $response['success'] = true;
                $response['data'] = "Pengguna berhasil dihapus.";
            }
        }
    } elseif ($action === 'update_profile') {
        $input = json_decode(file_get_contents('php://input'), true);
        $name = isset($input['name']) ? trim($input['name']) : '';
        $username = isset($input['username']) ? strtolower(trim($input['username'])) : '';
        $password = isset($input['password']) ? trim($input['password']) : '';

        if ($name === '') {
            $response['error'] = "Nama lengkap wajib diisi.";
        } else {
            $id = (int)$currentUser['id'];

            // Khusus superuser: izinkan mengubah username
            $newUsername = $currentUser['username'];
            if ($isSuperuser && $username !== '') {
                if (strlen($username) < 3) {
                    $response['error'] = "Username minimal 3 karakter.";
                    echo json_encode($response);
                    exit;
                }
                // Pastikan username tidak digunakan user lain
                $stmtCheckU = $pdo->prepare("SELECT id FROM users WHERE username = :u AND id != :id LIMIT 1");
                $stmtCheckU->execute([':u' => $username, ':id' => $id]);
                if ($stmtCheckU->fetch()) {
                    $response['error'] = "Username '$username' sudah terdaftar untuk pengguna lain.";
                    echo json_encode($response);
                    exit;
                }
                $newUsername = $username;
            }

            if (!empty($password)) {
                if (strlen($password) < 4) {
                    $response['error'] = "Password minimal 4 karakter.";
                } else {
                    $hash = password_hash($password, PASSWORD_BCRYPT);
                    $stmt = $pdo->prepare("UPDATE users SET username = :u, name = :n, password = :p WHERE id = :id");
                    $stmt->execute([':u' => $newUsername, ':n' => $name, ':p' => $hash, ':id' => $id]);
                    $_SESSION['user']['username'] = $newUsername;
                    $_SESSION['user']['name'] = $name;
                    $isDefaultUsername = ($newUsername === 'admin');
                    $isDefaultPassword = password_verify('admin123', $hash);
                    $isDefaultName = ($name === 'Super Administrator');
                    $_SESSION['user']['is_default_admin'] = ($isDefaultUsername && $isDefaultName && $isDefaultPassword);
                    $response['success'] = true;
                    $response['data'] = $_SESSION['user'];
                }
            } else {
                $stmt = $pdo->prepare("UPDATE users SET username = :u, name = :n WHERE id = :id");
                $stmt->execute([':u' => $newUsername, ':n' => $name, ':id' => $id]);
                $_SESSION['user']['username'] = $newUsername;
                $_SESSION['user']['name'] = $name;
                $stmtPw = $pdo->prepare("SELECT password FROM users WHERE id = :id LIMIT 1");
                $stmtPw->execute([':id' => $id]);
                $existingPw = $stmtPw->fetchColumn();
                $isDefaultUsername = ($newUsername === 'admin');
                $isDefaultPassword = ($existingPw && password_verify('admin123', $existingPw));
                $isDefaultName = ($name === 'Super Administrator');
                $_SESSION['user']['is_default_admin'] = ($isDefaultUsername && $isDefaultName && $isDefaultPassword);
                $response['success'] = true;
                $response['data'] = $_SESSION['user'];
            }
        }
    } elseif ($action === 'get_settings') {
        if (!$isSuperuser) {
            http_response_code(403);
            $response['error'] = "Akses ditolak: Hanya Superuser yang dapat mengakses pengaturan sistem.";
        } else {
            $isEmpty = true;
            try {
                $countStmt = $pdo->query("SELECT COUNT(*) FROM system_settings");
                $isEmpty = ((int)$countStmt->fetchColumn() === 0);
            } catch (Exception $e) {}

            $stmt = $pdo->query("SELECT main_domain, sub_path, upload_folder, local_proxy_target, updated_at FROM system_settings WHERE id = 1 LIMIT 1");
            $settings = $stmt->fetch();
            if (!$settings) {
                $settings = [
                    'main_domain' => MAIN_DOMAIN,
                    'sub_path' => SUB_PATH,
                    'upload_folder' => UPLOAD_FOLDER_NAME,
                    'local_proxy_target' => LOCAL_PROXY_TARGET,
                    'updated_at' => null
                ];
            }
            $settings['is_empty'] = $isEmpty;
            $settings['base_url'] = BASE_URL;
            $settings['upload_dir'] = UPLOAD_DIR;
            $response['success'] = true;
            $response['data'] = $settings;
        }
    } elseif ($action === 'update_settings') {
        if (!$isSuperuser) {
            http_response_code(403);
            $response['error'] = "Akses ditolak: Hanya Superuser yang dapat mengubah pengaturan sistem.";
        } else {
            $input = json_decode(file_get_contents('php://input'), true);
            $mainDomain = isset($input['main_domain']) ? trim($input['main_domain']) : '';
            $subPath = isset($input['sub_path']) ? trim($input['sub_path']) : '';
            $uploadFolder = isset($input['upload_folder']) ? trim($input['upload_folder']) : '';
            $localProxyTarget = isset($input['local_proxy_target']) ? trim($input['local_proxy_target']) : 'http://localhost';

            if (empty($mainDomain)) {
                $response['error'] = "Domain utama tidak boleh kosong.";
            } elseif (empty($uploadFolder)) {
                $response['error'] = "Nama folder uploads tidak boleh kosong.";
            } elseif (in_array(strtolower($uploadFolder), ['assets', 'wp_api'])) {
                $response['error'] = "Nama folder uploads tidak boleh menggunakan 'assets' atau 'wp_api' karena merupakan folder sistem.";
            } elseif (!preg_match('/^[a-zA-Z0-9_-]+$/', $uploadFolder)) {
                $response['error'] = "Nama folder uploads hanya boleh berisi huruf, angka, strip (-), dan underscore (_).";
            } else {
                // Normalisasi URL domain
                if (!preg_match('~^https?://~i', $mainDomain)) {
                    $mainDomain = 'https://' . $mainDomain;
                }
                $mainDomain = rtrim($mainDomain, '/');

                $cleanSub = trim($subPath, '/\\');
                $subPrefix = !empty($cleanSub) ? '/' . $cleanSub : '';

                if (!empty($localProxyTarget) && !preg_match('~^https?://~i', $localProxyTarget)) {
                    $localProxyTarget = 'http://' . $localProxyTarget;
                }
                $localProxyTarget = rtrim($localProxyTarget, '/');

                // Update ke database
                $stmt = $pdo->prepare("INSERT INTO system_settings (id, main_domain, sub_path, upload_folder, local_proxy_target, updated_at)
                    VALUES (1, :md, :sp, :uf, :lp, NOW())
                    ON DUPLICATE KEY UPDATE main_domain = :md2, sub_path = :sp2, upload_folder = :uf2, local_proxy_target = :lp2, updated_at = NOW()");
                $stmt->execute([
                    ':md' => $mainDomain,
                    ':sp' => $subPrefix,
                    ':uf' => $uploadFolder,
                    ':lp' => $localProxyTarget,
                    ':md2' => $mainDomain,
                    ':sp2' => $subPrefix,
                    ':uf2' => $uploadFolder,
                    ':lp2' => $localProxyTarget
                ]);

                // Buat folder fisik baru jika belum ada
                $newUploadDir = dirname(__DIR__) . '/' . $uploadFolder . '/';
                if (!is_dir($newUploadDir)) {
                    @mkdir($newUploadDir, 0755, true);
                }

                // Buat atau salin .htaccess interceptor ke folder upload baru
                $newHtaccess = $newUploadDir . '.htaccess';
                if (!file_exists($newHtaccess)) {
                    $htaccessContent = "<IfModule mod_rewrite.c>\n    RewriteEngine On\n    RewriteCond %{REQUEST_FILENAME} -f [OR]\n    RewriteCond %{REQUEST_FILENAME} !-f\n    RewriteRule ^(.*)$ ../wp_api/serve.php?file=\$1 [QSA,L]\n</IfModule>\n";
                    @file_put_contents($newHtaccess, $htaccessContent);
                }

                // Hitung Base URL baru
                $newBaseUrl = $mainDomain . $subPrefix . '/' . $uploadFolder . '/';

                // Sinkronkan ke system_settings.json untuk vite.config.js
                $settingsFile = dirname(__DIR__) . '/system_settings.json';
                $configPayload = [
                    'main_domain' => $mainDomain,
                    'sub_path' => $subPrefix,
                    'upload_folder' => $uploadFolder,
                    'local_proxy_target' => $localProxyTarget,
                    'base_url' => $newBaseUrl,
                    'updated_at' => date('Y-m-d H:i:s')
                ];
                @file_put_contents($settingsFile, json_encode($configPayload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

                $response['success'] = true;
                $response['data'] = $configPayload;
            }
        }
    } elseif ($action === 'download') {
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        $stmt = $pdo->prepare("SELECT id, file_name, file_path, file_type, file_size FROM assets WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $asset = $stmt->fetch();

        if (!$asset) {
            http_response_code(404);
            die("File tidak ditemukan.");
        }

        $fileNameOnDisk = basename($asset['file_path']);
        $filePathOnDisk = UPLOAD_DIR . $fileNameOnDisk;

        if (!file_exists($filePathOnDisk)) {
            http_response_code(404);
            die("File fisik tidak ditemukan di disk.");
        }

        $downloadName = ensureFileNameExtension($asset['file_name'], $asset);
        $mimeType = !empty($asset['file_type']) ? $asset['file_type'] : 'application/octet-stream';

        if (ob_get_level()) {
            ob_end_clean();
        }

        header('Content-Description: File Transfer');
        header('Content-Type: ' . $mimeType);
        header('Content-Disposition: attachment; filename="' . addslashes($downloadName) . '"; filename*=UTF-8\'\'' . rawurlencode($downloadName));
        header('Content-Transfer-Encoding: binary');
        header('Content-Length: ' . filesize($filePathOnDisk));
        header('Pragma: public');
        header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
        header('Expires: 0');

        readfile($filePathOnDisk);
        exit;
    } elseif ($action === 'bulk_download') {
        $idsRaw = isset($_GET['ids']) ? $_GET['ids'] : '';
        $ids = array_filter(array_map('intval', explode(',', $idsRaw)), function($id) { return $id > 0; });

        if (empty($ids)) {
            http_response_code(400);
            die("Tidak ada file yang dipilih.");
        }

        if (!class_exists('ZipArchive')) {
            http_response_code(500);
            die("Ekstensi ZipArchive PHP belum diaktifkan di server.");
        }

        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $pdo->prepare("SELECT id, file_name, file_path, file_type FROM assets WHERE id IN ($placeholders)");
        $stmt->execute(array_values($ids));
        $assets = $stmt->fetchAll();

        if (empty($assets)) {
            http_response_code(404);
            die("File tidak ditemukan.");
        }

        $zip = new ZipArchive();
        $zipFileName = 'assets-bulk-' . date('Ymd_His') . '.zip';
        $tempZipPath = tempnam(sys_get_temp_dir(), 'zip_');

        if ($zip->open($tempZipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            http_response_code(500);
            die("Gagal membuat file ZIP.");
        }

        $addedNames = [];
        foreach ($assets as $asset) {
            $fileNameOnDisk = basename($asset['file_path']);
            $filePathOnDisk = UPLOAD_DIR . $fileNameOnDisk;

            if (file_exists($filePathOnDisk)) {
                $entryName = ensureFileNameExtension($asset['file_name'], $asset);
                if (isset($addedNames[$entryName])) {
                    $ext = pathinfo($entryName, PATHINFO_EXTENSION);
                    $nameWithoutExt = pathinfo($entryName, PATHINFO_FILENAME);
                    $addedNames[$entryName]++;
                    $entryName = $nameWithoutExt . ' (' . $addedNames[$entryName] . ')' . ($ext ? '.' . $ext : '');
                } else {
                    $addedNames[$entryName] = 0;
                }
                $zip->addFile($filePathOnDisk, $entryName);
            }
        }

        $zip->close();

        if (!file_exists($tempZipPath) || filesize($tempZipPath) === 0) {
            http_response_code(500);
            die("Gagal mengompres file atau file fisik tidak ada di disk.");
        }

        header('Content-Type: application/zip');
        header('Content-Disposition: attachment; filename="' . $zipFileName . '"');
        header('Content-Length: ' . filesize($tempZipPath));
        header('Pragma: no-cache');
        header('Expires: 0');

        readfile($tempZipPath);
        @unlink($tempZipPath);
        exit;
    } else {
        $response['error'] = "Invalid action.";
    }
} catch (Exception $e) {
    http_response_code(500);
    $response['error'] = $e->getMessage();
}

echo json_encode($response, JSON_INVALID_UTF8_SUBSTITUTE | JSON_PARTIAL_OUTPUT_ON_ERROR);
