import React, { useState } from 'react';
import { Eye, Copy, Download, FolderOutput, Pencil, Trash2, Check, Film, FileText, File } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { getDownloadUrl } from '../utils/basename';

export default function AssetCard({
  asset,
  isSelected,
  isSelectMode,
  onToggleSelect,
  onPreview,
  onMove,
  onRename,
  onDelete
}) {
  const { canMove, canRename, canDelete } = useAuth();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const isImage = asset.file_type && asset.file_type.startsWith('image/');
  const isVideo = asset.file_type && asset.file_type.startsWith('video/');
  const isPdf =
    (asset.file_type && (asset.file_type === 'application/pdf' || asset.file_type.includes('pdf'))) ||
    (asset.file_name && asset.file_name.toLowerCase().endsWith('.pdf'));

  const sizeKB = (asset.file_size / 1024).toFixed(1);

  const handleCopyLink = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(asset.file_path);
      setCopied(true);
      showToast('Tautan disalin ke clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Gagal menyalin tautan.', 'error');
    }
  };

  const handleCardClick = () => {
    if (isSelectMode) {
      onToggleSelect(asset.id);
    }
  };

  const handleThumbClick = (e) => {
    e.stopPropagation();
    if (isSelectMode) {
      onToggleSelect(asset.id);
      return;
    }
    onPreview(asset);
  };

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    if (isSelectMode) {
      onToggleSelect(asset.id);
    }
  };

  const getResolvedFileName = (item) => {
    let name = item.file_name || 'download';
    if (name.includes('.') && name.split('.').pop().trim().length > 0) {
      return name;
    }
    if (item.file_path && item.file_path.includes('.')) {
      const cleanUrl = item.file_path.split('?')[0].split('#')[0];
      const pExt = cleanUrl.split('.').pop().toLowerCase();
      if (pExt && pExt.length <= 5 && !pExt.includes('/')) {
        return `${name}.${pExt}`;
      }
    }
    const mimeMap = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'application/pdf': 'pdf',
      'text/plain': 'txt'
    };
    const mimeExt = mimeMap[item.file_type];
    if (mimeExt) {
      return `${name}.${mimeExt}`;
    }
    return name;
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    if (isSelectMode) {
      onToggleSelect(asset.id);
      return;
    }
    const resolvedName = getResolvedFileName(asset);
    const downloadUrl = getDownloadUrl(asset.id);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', resolvedName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasSecondRow = canMove || canRename || canDelete;

  return (
    <div
      className={`asset-card ${isSelected ? 'selected' : ''}`}
      onClick={handleCardClick}
    >
      {/* Checkbox */}
      <div className="asset-checkbox" onClick={handleCheckboxClick}>
        {isSelected && <Check size={14} />}
      </div>

      {/* Thumbnail */}
      <div className="asset-thumb" onClick={handleThumbClick}>
        <div
          className={`asset-usage-chip ${asset.is_in_use ? 'in-use' : 'safe'}`}
          title={
            asset.is_in_use
              ? asset.usage_wp_count > 0 && asset.usage_ext_hits > 0
                ? `Digunakan di ${asset.usage_wp_count} postingan WordPress & ${asset.usage_ext_domains} domain luar`
                : asset.usage_wp_count > 0
                ? `Digunakan di ${asset.usage_wp_count} postingan / halaman WordPress`
                : `Diakses dari ${asset.usage_ext_domains} domain luar (${asset.usage_ext_hits} hit)`
              : 'Belum terdeteksi penggunaan pada website lain (Aman)'
          }
        >
          <span className={asset.is_in_use ? 'usage-pulse-dot' : 'usage-safe-dot'} />
          <span>{asset.is_in_use ? 'Digunakan' : 'Aman'}</span>
        </div>
        {isImage ? (
          <img src={asset.file_path} alt={asset.file_name} loading="lazy" draggable={false} />
        ) : isVideo ? (
          <div className="file-icon">
            <Film size={32} />
            <span>Video</span>
          </div>
        ) : isPdf ? (
          <div className="file-icon">
            <FileText size={38} style={{ color: '#ef4444' }} />
            <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 12 }}>PDF</span>
          </div>
        ) : (
          <div className="file-icon">
            <File size={32} />
            <span>{asset.file_type || 'File'}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="asset-info">
        <h4 title={asset.file_name}>{asset.file_name}</h4>
        <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
          <span>
            {sizeKB} KB {asset.folder_name ? `(Folder: ${asset.folder_name})` : ''}
          </span>
          <span
            className={`usage-sub-badge ${asset.is_in_use ? 'in-use' : 'safe'}`}
            title={
              asset.is_in_use
                ? asset.usage_wp_count > 0 && asset.usage_ext_hits > 0
                  ? `Digunakan di ${asset.usage_wp_count} postingan WordPress & ${asset.usage_ext_domains} domain luar`
                  : asset.usage_wp_count > 0
                  ? `Digunakan di ${asset.usage_wp_count} postingan WordPress`
                  : `Diakses dari ${asset.usage_ext_domains} domain eksternal (${asset.usage_ext_hits} hits)`
                : 'Belum ada trafik eksternal / penggunaan terdeteksi (Aman)'
            }
          >
            {asset.is_in_use
              ? asset.usage_wp_count > 0
                ? `${asset.usage_wp_count} WP Post`
                : `${asset.usage_ext_domains} Web Luar`
              : 'Aman'}
          </span>
        </p>
      </div>

      {/* First row actions: Preview, Copy, Download */}
      <div
        className="asset-actions"
        style={{
          paddingBottom: hasSecondRow ? 4 : 10,
          pointerEvents: isSelectMode ? 'none' : 'auto',
          opacity: isSelectMode ? 0.45 : 1
        }}
      >
        <button
          type="button"
          title={isSelectMode ? 'Pilih file' : 'Preview'}
          disabled={isSelectMode}
          onClick={(e) => {
            e.stopPropagation();
            onPreview(asset);
          }}
        >
          <Eye size={14} />
        </button>

        <button
          type="button"
          title={isSelectMode ? 'Pilih file' : (copied ? 'Tautan Tersalin!' : 'Salin Tautan')}
          disabled={isSelectMode}
          onClick={handleCopyLink}
          style={copied ? { borderColor: '#22c55e', background: '#f0fdf4' } : {}}
        >
          {copied ? (
            <Check size={14} style={{ color: '#16a34a' }} />
          ) : (
            <Copy size={14} />
          )}
        </button>

        <button
          type="button"
          title={isSelectMode ? 'Pilih file' : 'Download'}
          disabled={isSelectMode}
          onClick={handleDownload}
        >
          <Download size={14} />
        </button>
      </div>

      {/* Second row actions: Move, Rename, Delete */}
      {hasSecondRow && (
        <div
          className="asset-actions"
          style={{
            paddingTop: 0,
            pointerEvents: isSelectMode ? 'none' : 'auto',
            opacity: isSelectMode ? 0.45 : 1
          }}
        >
          {canMove && (
            <button
              type="button"
              title={isSelectMode ? 'Pilih file' : 'Pindahkan'}
              disabled={isSelectMode}
              onClick={(e) => {
                e.stopPropagation();
                onMove(asset);
              }}
            >
              <FolderOutput size={14} />
            </button>
          )}

          {canRename && (
            <button
              type="button"
              title={isSelectMode ? 'Pilih file' : 'Ganti Nama'}
              disabled={isSelectMode}
              onClick={(e) => {
                e.stopPropagation();
                onRename(asset);
              }}
            >
              <Pencil size={14} />
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              className="btn-danger"
              title={isSelectMode ? 'Pilih file' : 'Hapus File'}
              disabled={isSelectMode}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(asset);
              }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
