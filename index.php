<?php
session_start();

$correct_pin = '2098';
$error = '';

// Proses input PIN
if (isset($_POST['pin'])) {
    if ($_POST['pin'] === $correct_pin) {
        $_SESSION['authenticated'] = true;
    } else {
        $error = 'PIN salah!';
    }
}

// Fitur Logout sederhana
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: index.php');
    exit;
}

// Cek apakah sudah terautentikasi
$is_authenticated = !empty($_SESSION['authenticated']);

// Cek koneksi DB server-side (hanya jika sudah login)
$db_connected = false;
$db_status_msg = '';
$assetsData = [];
if ($is_authenticated) {
    require_once 'config.php';
    if ($pdo !== null) {
        $db_connected = true;
        $db_status_msg = 'Terhubung ke Database';
        try {
            $stmtAssets = $pdo->query("SELECT * FROM assets ORDER BY id DESC");
            $assetsData = $stmtAssets->fetchAll();
        } catch (Exception $e) {
            $assetsData = [];
            $db_status_msg = 'Terhubung, tapi gagal query: ' . $e->getMessage();
        }
    } else {
        $db_status_msg = $db_error ?? 'Koneksi gagal (alasan tidak diketahui)';
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Asset Manager</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
    <style>
        :root {
            --bg-color: #f4f4f5;
            --text-main: #18181b;
            --text-muted: #71717a;
            --box-bg: #ffffff;
            --border-color: #e4e4e7;
            --btn-bg: #18181b;
            --btn-hover: #27272a;
            --danger: #ef4444;
            --danger-hover: #dc2626;
            --success: #22c55e;
        }

        * { box-sizing: border-box; }

        body { 
            font-family: 'Inter', sans-serif; 
            max-width: 1100px; 
            margin: 40px auto; 
            padding: 0 20px; 
            background: var(--bg-color); 
            color: var(--text-main); 
        }

        .box { 
            background: var(--box-bg); 
            border: 1px solid var(--border-color); 
            padding: 28px; 
            border-radius: 12px; 
            margin-bottom: 24px; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.04); 
        }

        input[type="text"], input[type="password"], input[type="file"] { 
            width: 100%; 
            padding: 12px; 
            margin: 8px 0 16px; 
            border: 1px solid var(--border-color); 
            border-radius: 8px; 
            box-sizing: border-box; 
            font-family: 'Inter', sans-serif;
            background: var(--bg-color);
            transition: border-color 0.2s;
            font-size: 14px;
        }

        input:focus {
            outline: none;
            border-color: var(--text-main);
        }

        button { 
            background: var(--btn-bg); 
            color: #fff; 
            border: none; 
            padding: 10px 18px; 
            border-radius: 8px; 
            cursor: pointer; 
            font-weight: 600; 
            font-family: 'Inter', sans-serif;
            font-size: 13px;
            transition: background 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        button:hover { background: var(--btn-hover); }

        .error { color: var(--danger); margin-bottom: 12px; font-size: 14px; }
        
        /* Header */
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .header h2 { margin: 0; display: flex; align-items: center; gap: 10px; }
        .logout-link { 
            color: var(--text-main); 
            text-decoration: none; 
            font-size: 13px; 
            font-weight: 600;
            border: 1px solid var(--border-color);
            padding: 8px 14px;
            border-radius: 8px;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .logout-link:hover { background: var(--text-main); color: #fff; }

        /* DB Indicator */
        .db-indicator {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            padding: 6px 12px;
            border-radius: 20px;
            background: var(--bg-color);
            border: 1px solid var(--border-color);
            cursor: help;
            margin-right: 12px;
            color: var(--text-muted);
            font-weight: 600;
        }
        .db-indicator.connected { color: var(--success); border-color: var(--success); }
        .db-indicator.error { color: var(--danger); border-color: var(--danger); }

        /* Hero Upload Banner */
        .hero-upload {
            background: var(--box-bg);
            border: 2px dashed var(--border-color);
            border-radius: 16px;
            padding: 40px 20px;
            text-align: center;
            margin-bottom: 30px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
        }
        .hero-upload:hover {
            border-color: #a1a1aa;
            background: #fafafa;
        }
        .hero-upload h3 { margin: 0; font-size: 18px; font-weight: 600; }
        .hero-upload p { margin: 0; color: var(--text-muted); font-size: 14px; }
        
        .btn-text {
            background: none;
            border: none;
            color: var(--text-main);
            font-weight: 600;
            padding: 4px 8px;
            border-radius: 6px;
            cursor: pointer;
            text-decoration: underline;
            text-decoration-color: var(--border-color);
            text-underline-offset: 4px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }
        .btn-text:hover {
            background: #e4e4e7;
            text-decoration-color: transparent;
        }

        /* Search */
        .search-wrap { position: relative; margin-bottom: 20px; }
        .search-wrap svg {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
            width: 18px; height: 18px;
            pointer-events: none;
        }
        .search-wrap input { padding-left: 40px; margin: 0; }

        /* Asset Grid */
        .asset-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 20px;
        }
        
        .asset-card {
            background: var(--box-bg);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .asset-card:hover { 
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(0,0,0,0.06); 
        }

        .asset-thumb {
            width: 100%;
            height: 160px;
            background: #e4e4e7;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            cursor: pointer;
            position: relative;
        }
        .asset-thumb::after {
            content: '';
            position: absolute;
            top:0; left:0; right:0; bottom:0;
            background: rgba(0,0,0,0.05);
            opacity: 0;
            transition: opacity 0.2s;
        }
        .asset-thumb:hover::after { opacity: 1; }
        
        .asset-thumb img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .asset-thumb .file-icon {
            color: var(--text-muted);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 500;
        }

        .asset-info { padding: 16px; flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .asset-info h4 { 
            margin: 0; 
            font-size: 14px; 
            word-break: break-all; 
            line-height: 1.5;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        .asset-info p { margin: 0; font-size: 12px; color: var(--text-muted); }
        
        .asset-actions { 
            display: flex; 
            gap: 6px; 
            padding: 0 16px 16px;
            margin-top: auto;
        }
        .asset-actions button, .asset-actions a {
            flex: 1;
            padding: 8px 4px;
            font-size: 12px;
            border-radius: 8px;
            text-align: center;
            text-decoration: none;
            cursor: pointer;
            border: 1px solid var(--border-color);
            background: var(--box-bg);
            color: var(--text-main);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }
        .asset-actions button:hover, .asset-actions a:hover { 
            background: var(--bg-color); 
            border-color: #d4d4d8;
        }
        .asset-actions .btn-danger { color: var(--danger); border-color: #fca5a5; }
        .asset-actions .btn-danger:hover { background: var(--danger); border-color: var(--danger); color: white; }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: var(--text-muted);
            grid-column: 1 / -1;
        }
        .empty-state i { margin-bottom: 12px; }

        /* Modals */
        .modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.6);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            backdrop-filter: blur(4px);
        }
        .modal-overlay.active { display: flex; }
        
        .modal-content {
            background: var(--box-bg);
            padding: 28px;
            border-radius: 14px;
            max-width: 420px;
            width: 90%;
            text-align: center;
        }
        .modal-content h3 { margin-top: 0; display: flex; align-items: center; justify-content: center; gap: 8px; }

        .modal-content.preview {
            max-width: 800px;
            padding: 12px;
        }
        .modal-content.preview img, .modal-content.preview video {
            max-width: 100%;
            max-height: 80vh;
            object-fit: contain;
            border-radius: 8px;
        }

        .modal-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
            margin-top: 20px;
        }
        .modal-actions button { flex: 1; justify-content: center; }
        .btn-cancel { background: var(--bg-color); color: var(--text-main); border: 1px solid var(--border-color); }
        .btn-cancel:hover { background: var(--border-color); }
        .btn-confirm-del { background: var(--danger); }
        .btn-confirm-del:hover { background: var(--danger-hover); }

        /* Rename Modal */
        #renameModal input[type="text"] { margin: 12px 0 0; text-align: center; }

        /* Toast */
        #toast-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            z-index: 1100;
        }

        .toast {
            background: var(--text-main);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideIn 0.3s ease forwards, fadeOut 0.3s ease 2.7s forwards;
            opacity: 0;
            transform: translateX(100%);
        }
        .toast.success { background: #166534; }
        .toast.error { background: var(--danger); }

        @keyframes slideIn {
            to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeOut {
            to { opacity: 0; transform: translateY(-10px); }
        }

        /* Drop Zone Overlay */
        #dropZone {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(24,24,27,0.85);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            backdrop-filter: blur(8px);
        }
        #dropZone.active { display: flex; }
        
        .drop-content {
            text-align: center;
            color: white;
            padding: 60px;
            border: 3px dashed rgba(255,255,255,0.4);
            border-radius: 20px;
            max-width: 500px;
            width: 90%;
        }
        .drop-content h3 { margin: 16px 0 8px; font-size: 20px; }
        .drop-content p { margin: 0; opacity: 0.7; font-size: 14px; }

        /* Drop Preview */
        .drop-preview {
            text-align: center;
            color: white;
            max-width: 500px;
            width: 90%;
        }
        .drop-file-list {
            max-height: 300px;
            overflow-y: auto;
            text-align: left;
            margin-bottom: 20px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .drop-file-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(255,255,255,0.1);
            padding: 10px 14px;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .drop-file-item button {
            background: rgba(239,68,68,0.2);
            color: #fca5a5;
            padding: 6px;
            border-radius: 6px;
            border: none;
            display: inline-flex;
        }
        .drop-file-item button:hover { background: rgba(239,68,68,0.6); color: white; }

        .drop-preview-actions { display: flex; gap: 12px; justify-content: center; }
        .drop-preview-actions button { 
            padding: 12px 28px; 
            font-size: 14px; 
            justify-content: center;
        }
        .btn-drop-cancel { background: rgba(255,255,255,0.15); }
        .btn-drop-cancel:hover { background: rgba(255,255,255,0.25); }
        .btn-drop-upload { background: white; color: var(--text-main); }
        .btn-drop-upload:hover { background: #e4e4e7; }

    </style>
</head>
<body>

<?php if (!$is_authenticated): ?>
    <div class="box" style="margin-top: 100px; max-width: 400px; margin-left: auto; margin-right: auto;">
        <h2 style="margin-top:0; text-align:center;">
            <i data-lucide="lock" style="width:20px;height:20px;"></i> Masuk
        </h2>
        <?php if ($error): ?>
            <div class="error" style="text-align:center;"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>
        <form method="POST">
            <input type="password" name="pin" placeholder="Masukkan 4 Digit PIN" autofocus required>
            <button type="submit" style="width:100%; justify-content:center;">
                <i data-lucide="log-in" style="width:16px;height:16px;"></i> Buka Akses
            </button>
        </form>
    </div>
<?php else: ?>
    
    <div class="header">
        <h2><i data-lucide="folder-open" style="width:24px;height:24px;"></i> Asset Manager</h2>
        <div style="display:flex; align-items:center;">
            <div class="db-indicator <?= $db_connected ? 'connected' : 'error' ?>" title="<?= htmlspecialchars($db_status_msg) ?>">
                <i data-lucide="database" style="width:12px;height:12px;"></i>
                <?= $db_connected ? 'Terhubung' : 'DB Error' ?>
            </div>
            <a href="?logout=1" class="logout-link">
                <i data-lucide="lock" style="width:14px;height:14px;"></i> Kunci
            </a>
        </div>
    </div>

    <!-- Hero Upload Section -->
    <input type="file" id="hiddenFileInput" multiple style="display:none;">
    <div class="hero-upload" onclick="document.getElementById('hiddenFileInput').click()">
        <i data-lucide="upload-cloud" style="width:48px;height:48px;color:var(--text-muted);"></i>
        <h3>Seret & Lepas file ke mana saja</h3>
        <p>Atau klik area ini untuk memilih file. Anda juga dapat <button type="button" class="btn-text" id="quickPasteBtn" onclick="event.stopPropagation();"><i data-lucide="clipboard-paste" style="width:14px;height:14px;"></i> Tempel Tautan (Paste URL)</button></p>
    </div>

    <!-- Search -->
    <div class="search-wrap">
        <i data-lucide="search"></i>
        <input type="text" id="searchInput" placeholder="Cari berdasarkan nama file...">
    </div>
    
    <!-- Assets Grid -->
    <div id="assetsGrid" class="asset-grid"></div>

<?php endif; ?>

<!-- Drop Zone Overlay -->
<div id="dropZone">
    <div class="drop-content" id="dropPrompt">
        <i data-lucide="upload-cloud" style="width:64px;height:64px;color:white;"></i>
        <h3>Lepas file di sini</h3>
        <p>File akan diunggah ke Asset Manager</p>
    </div>
    <div class="drop-preview" id="dropPreview" style="display:none;"></div>
</div>

<!-- Modals -->
<div class="modal-overlay" id="confirmModal">
    <div class="modal-content">
        <h3><i data-lucide="trash-2" style="width:20px;height:20px;color:var(--danger);"></i> Hapus Asset?</h3>
        <p style="color:var(--text-muted); font-size:14px;">Tindakan ini tidak dapat dibatalkan. File akan dihapus dari server.</p>
        <div class="modal-actions">
            <button class="btn-cancel" onclick="closeConfirmModal()">Batal</button>
            <button class="btn-confirm-del" id="confirmDeleteBtn">
                <i data-lucide="trash-2" style="width:14px;height:14px;"></i> Hapus
            </button>
        </div>
    </div>
</div>

<div class="modal-overlay" id="previewModal" onclick="closePreview(event)">
    <div class="modal-content preview" id="previewContainer" onclick="event.stopPropagation()"></div>
</div>

<div class="modal-overlay" id="renameModal">
    <div class="modal-content">
        <h3><i data-lucide="pencil" style="width:20px;height:20px;"></i> Rename Asset</h3>
        <input type="text" id="renameInput" placeholder="Nama file baru...">
        <div class="modal-actions">
            <button class="btn-cancel" onclick="closeRenameModal()">Batal</button>
            <button id="confirmRenameBtn">
                <i data-lucide="check" style="width:14px;height:14px;"></i> Simpan
            </button>
        </div>
    </div>
</div>

<!-- Toast Container -->
<div id="toast-container"></div>

<?php if ($is_authenticated): ?>
<script>
    // Data asset langsung dari PHP
    let allAssets = <?= json_encode($assetsData ?? [], JSON_INVALID_UTF8_SUBSTITUTE) ?>;
    let deleteTargetId = null;
    let renameTargetId = null;
    let droppedFiles = null;

    document.addEventListener('DOMContentLoaded', () => {
        lucide.createIcons();
        renderAssets(allAssets);
    });

    // --- Toast ---
    function showToast(message, type) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast' + (type ? ' ' + type : '');
        toast.innerHTML = '<i data-lucide="' + (type === 'error' ? 'alert-circle' : 'check-circle') + '" style="width:16px;height:16px;flex-shrink:0;"></i> ' + message;
        container.appendChild(toast);
        lucide.createIcons({nameAttr: 'data-lucide'});
        setTimeout(() => toast.remove(), 3000);
    }

    // --- Quick Paste URL ---
    document.getElementById('quickPasteBtn').addEventListener('click', async (e) => {
        try {
            const text = await navigator.clipboard.readText();
            if(!text || (!text.startsWith('http://') && !text.startsWith('https://'))) {
                showToast('Clipboard tidak berisi URL yang valid (harus http/https)', 'error');
                return;
            }
            
            showToast('Mengambil file dari tautan...', 'info');
            const formData = new FormData();
            formData.append('asset_url', text);

            fetch('upload.php', { method: 'POST', body: formData })
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    showToast('Asset berhasil ditarik!', 'success');
                    loadAssets();
                } else {
                    showToast('Gagal: ' + (data.errors ? data.errors.join(', ') : 'Kesalahan'), 'error');
                }
            })
            .catch(() => showToast('Terjadi kesalahan sistem.', 'error'));

        } catch(e) {
            showToast('Tidak dapat mengakses clipboard (izin ditolak)', 'error');
        }
    });

    // --- Hidden File Input Upload ---
    document.getElementById('hiddenFileInput').addEventListener('change', function() {
        if(this.files.length === 0) return;
        
        showToast('Mengunggah ' + this.files.length + ' file...', 'info');
        const formData = new FormData();
        for(let i=0; i<this.files.length; i++) {
            formData.append('files[]', this.files[i]);
        }
        
        fetch('upload.php', { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                showToast('File berhasil diunggah!', 'success');
                loadAssets();
                this.value = ''; // Reset input
            } else {
                showToast('Gagal: ' + (data.errors ? data.errors.join(', ') : 'Kesalahan'), 'error');
            }
        })
        .catch(() => showToast('Terjadi kesalahan sistem.', 'error'));
    });

    // --- Load Assets (refresh after actions) ---
    function loadAssets() {
        fetch('api.php?action=list')
            .then(res => res.json())
            .then(data => {
                if(data.success && data.data) {
                    allAssets = data.data;
                    renderAssets(allAssets);
                }
            })
            .catch(err => console.error('loadAssets error:', err));
    }

    // --- Render Assets ---
    function renderAssets(assets) {
        const grid = document.getElementById('assetsGrid');
        grid.innerHTML = '';

        if(!assets || assets.length === 0) {
            grid.innerHTML = '<div class="empty-state"><i data-lucide="inbox" style="width:48px;height:48px;"></i><p>Belum ada asset.</p></div>';
            lucide.createIcons();
            return;
        }

        assets.forEach(asset => {
            const card = document.createElement('div');
            card.className = 'asset-card';
            
            const sizeKB = (asset.file_size / 1024).toFixed(1);
            const isImage = asset.file_type && asset.file_type.startsWith('image/');
            const isVideo = asset.file_type && asset.file_type.startsWith('video/');

            let thumbHtml;
            if (isImage) {
                thumbHtml = '<div class="asset-thumb" onclick="previewAsset(\'' + asset.file_path + '\', \'' + asset.file_type + '\')">' +
                    '<img src="' + asset.file_path + '" alt="' + asset.file_name + '" loading="lazy">' +
                '</div>';
            } else if (isVideo) {
                thumbHtml = '<div class="asset-thumb" onclick="previewAsset(\'' + asset.file_path + '\', \'' + asset.file_type + '\')">' +
                    '<div class="file-icon"><i data-lucide="film" style="width:32px;height:32px;"></i><span>Video</span></div>' +
                '</div>';
            } else {
                thumbHtml = '<div class="asset-thumb">' +
                    '<div class="file-icon"><i data-lucide="file" style="width:32px;height:32px;"></i><span>' + (asset.file_type || 'File') + '</span></div>' +
                '</div>';
            }
            
            card.innerHTML = thumbHtml +
                '<div class="asset-info">' +
                    '<h4>' + asset.file_name + '</h4>' +
                    '<p>' + sizeKB + ' KB</p>' +
                '</div>' +
                '<div class="asset-actions">' +
                    '<button title="Preview Asset" onclick="previewAsset(\'' + asset.file_path + '\', \'' + asset.file_type + '\')"><i data-lucide="eye" style="width:14px;height:14px;"></i></button>' +
                    '<button title="Copy Link" onclick="copyToClipboard(this, \'' + asset.file_path + '\')"><i data-lucide="copy" style="width:14px;height:14px;"></i></button>' +
                    '<a title="Download" href="' + asset.file_path + '" download target="_blank"><i data-lucide="download" style="width:14px;height:14px;"></i></a>' +
                    '<button title="Ganti Nama" onclick="openRenameModal(' + asset.id + ', \'' + asset.file_name.replace(/'/g, "\\'") + '\')"><i data-lucide="pencil" style="width:14px;height:14px;"></i></button>' +
                    '<button title="Hapus" class="btn-danger" onclick="openConfirmModal(' + asset.id + ')"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>' +
                '</div>';
            grid.appendChild(card);
        });
        lucide.createIcons();
    }

    // --- Search ---
    document.getElementById('searchInput').addEventListener('input', function(e) {
        const term = e.target.value.toLowerCase();
        const filtered = allAssets.filter(a => a.file_name.toLowerCase().includes(term));
        renderAssets(filtered);
    });

    // --- Copy ---
    function copyToClipboard(btn, text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Tautan disalin ke clipboard!', 'success');
            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="check" style="width:14px;height:14px;color:var(--success);"></i>';
            lucide.createIcons();
            setTimeout(() => {
                btn.innerHTML = originalHtml;
                lucide.createIcons();
            }, 2000);
        }).catch(err => {
            showToast('Gagal menyalin tautan.', 'error');
        });
    }

    // --- Preview Modal ---
    function previewAsset(url, type) {
        const modal = document.getElementById('previewModal');
        const container = document.getElementById('previewContainer');
        container.innerHTML = '';
        if (type && type.startsWith('image/')) {
            container.innerHTML = '<img src="' + url + '" alt="Preview">';
        } else if (type && type.startsWith('video/')) {
            container.innerHTML = '<video src="' + url + '" controls autoplay></video>';
        } else {
            container.innerHTML = '<p style="padding:40px;">Format file (' + (type || 'unknown') + ') tidak dapat dipratinjau.</p>';
        }
        modal.classList.add('active');
    }

    function closePreview(e) {
        if(e) e.preventDefault();
        document.getElementById('previewModal').classList.remove('active');
        document.getElementById('previewContainer').innerHTML = '';
    }

    // --- Delete Modal ---
    function openConfirmModal(id) {
        deleteTargetId = id;
        document.getElementById('confirmModal').classList.add('active');
    }
    function closeConfirmModal() {
        deleteTargetId = null;
        document.getElementById('confirmModal').classList.remove('active');
    }

    document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
        if(!deleteTargetId) return;
        const btn = document.getElementById('confirmDeleteBtn');
        btn.innerHTML = '<i data-lucide="loader" style="width:14px;height:14px;" class="spin"></i> Menghapus...';
        btn.disabled = true;
        lucide.createIcons();

        fetch('api.php?action=delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: deleteTargetId })
        })
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                showToast('Asset berhasil dihapus!', 'success');
                loadAssets();
            } else {
                showToast('Gagal: ' + data.error, 'error');
            }
        })
        .catch(() => showToast('Terjadi kesalahan sistem.', 'error'))
        .finally(() => {
            btn.innerHTML = '<i data-lucide="trash-2" style="width:14px;height:14px;"></i> Hapus';
            btn.disabled = false;
            lucide.createIcons();
            closeConfirmModal();
        });
    });

    // --- Rename Modal ---
    function openRenameModal(id, currentName) {
        renameTargetId = id;
        document.getElementById('renameInput').value = currentName;
        document.getElementById('renameModal').classList.add('active');
        setTimeout(() => document.getElementById('renameInput').focus(), 100);
    }
    function closeRenameModal() {
        renameTargetId = null;
        document.getElementById('renameModal').classList.remove('active');
    }

    document.getElementById('confirmRenameBtn').addEventListener('click', () => {
        if(!renameTargetId) return;
        const newName = document.getElementById('renameInput').value.trim();
        if(!newName) { showToast('Nama tidak boleh kosong', 'error'); return; }

        const btn = document.getElementById('confirmRenameBtn');
        btn.innerHTML = '<i data-lucide="loader" style="width:14px;height:14px;" class="spin"></i> Menyimpan...';
        btn.disabled = true;
        lucide.createIcons();

        fetch('api.php?action=rename', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: renameTargetId, new_name: newName })
        })
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                showToast('Nama berhasil diubah!', 'success');
                loadAssets();
            } else {
                showToast('Gagal: ' + data.error, 'error');
            }
        })
        .catch(() => showToast('Terjadi kesalahan sistem.', 'error'))
        .finally(() => {
            btn.innerHTML = '<i data-lucide="check" style="width:14px;height:14px;"></i> Simpan';
            btn.disabled = false;
            lucide.createIcons();
            closeRenameModal();
        });
    });

    // --- Global Drag & Drop ---
    let dragCounter = 0;

    document.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dragCounter++;
        document.getElementById('dropZone').classList.add('active');
        document.getElementById('dropPrompt').style.display = '';
        document.getElementById('dropPreview').style.display = 'none';
    });

    document.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragCounter--;
        if(dragCounter <= 0) {
            dragCounter = 0;
            document.getElementById('dropZone').classList.remove('active');
        }
    });

    document.addEventListener('dragover', (e) => { e.preventDefault(); });

    document.addEventListener('drop', (e) => {
        e.preventDefault();
        dragCounter = 0;
        
        const files = e.dataTransfer.files;
        if(files.length === 0) {
            document.getElementById('dropZone').classList.remove('active');
            return;
        }

        // Convert FileList to Array to allow removing items
        droppedFiles = Array.from(files);
        showDropPreview(droppedFiles);
    });

    function showDropPreview(files) {
        const prompt = document.getElementById('dropPrompt');
        const preview = document.getElementById('dropPreview');
        prompt.style.display = 'none';
        preview.style.display = '';

        let previewHtml = '<div class="drop-file-list">';
        files.forEach((file, index) => {
            const sizeStr = (file.size / 1024).toFixed(1) + ' KB';
            previewHtml += '<div class="drop-file-item">' +
                '<div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' +
                    '<strong>' + file.name + '</strong><br><small>' + sizeStr + '</small>' +
                '</div>' +
                '<button type="button" onclick="removeDroppedFile(' + index + ')" title="Hapus"><i data-lucide="x" style="width:14px;height:14px;"></i></button>' +
            '</div>';
        });
        previewHtml += '</div>';

        previewHtml += '<div class="drop-preview-actions" style="margin-top:20px;">' +
            '<button class="btn-drop-cancel" onclick="cancelDrop()"><i data-lucide="x" style="width:14px;height:14px;"></i> Batal Semua</button>' +
            '<button class="btn-drop-upload" onclick="confirmDrop()"><i data-lucide="upload" style="width:14px;height:14px;"></i> Upload ' + files.length + ' File</button>' +
        '</div>';

        preview.innerHTML = previewHtml;
        lucide.createIcons();
    }

    function removeDroppedFile(index) {
        if(!droppedFiles) return;
        droppedFiles.splice(index, 1); // Remove 1 item at index
        if(droppedFiles.length === 0) {
            cancelDrop();
        } else {
            showDropPreview(droppedFiles); // Re-render list
        }
    }

    function cancelDrop() {
        droppedFiles = null;
        document.getElementById('dropZone').classList.remove('active');
    }

    function confirmDrop() {
        if(!droppedFiles) return;
        const formData = new FormData();
        for(let i = 0; i < droppedFiles.length; i++) {
            formData.append('files[]', droppedFiles[i]);
        }

        const preview = document.getElementById('dropPreview');
        preview.innerHTML = '<div style="color:white;"><i data-lucide="loader" style="width:48px;height:48px;" class="spin"></i><h3>Mengunggah...</h3></div>';
        lucide.createIcons();

        fetch('upload.php', { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                showToast('File berhasil diunggah via drag & drop!', 'success');
                loadAssets();
            } else {
                showToast('Gagal: ' + (data.errors ? data.errors.join(', ') : 'Kesalahan'), 'error');
            }
        })
        .catch(() => showToast('Terjadi kesalahan sistem.', 'error'))
        .finally(() => {
            droppedFiles = null;
            document.getElementById('dropZone').classList.remove('active');
        });
    }

</script>
<style>
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin 1s linear infinite; }
</style>
<?php endif; ?>

</body>
</html>