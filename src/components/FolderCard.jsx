import React from 'react';
import { Folder, FolderOpen, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function FolderCard({ folder, isSelectMode, onNavigate, onRename, onDelete }) {
  const { canRename, canDelete } = useAuth();

  const fileCount = parseInt(folder.file_count || 0);
  const totalBytes = parseInt(folder.total_size || 0);

  let sizeStr = '0 B';
  if (totalBytes > 0) {
    if (totalBytes < 1024) sizeStr = totalBytes + ' B';
    else if (totalBytes < 1024 * 1024) sizeStr = (totalBytes / 1024).toFixed(1) + ' KB';
    else if (totalBytes < 1024 * 1024 * 1024) sizeStr = (totalBytes / (1024 * 1024)).toFixed(1) + ' MB';
    else sizeStr = (totalBytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }

  return (
    <div className={`asset-card is-folder ${isSelectMode ? 'disabled-folder' : ''}`}>
      <div
        className="asset-thumb"
        style={{
          background: 'linear-gradient(180deg, #fafafa 0%, #f4f4f5 100%)',
          borderBottom: '1px solid var(--border-color)',
          cursor: isSelectMode ? 'not-allowed' : 'pointer'
        }}
        onClick={() => !isSelectMode && onNavigate(folder.id)}
      >
        <Folder
          size={64}
          strokeWidth={1.6}
          style={{
            color: '#eab308',
            fill: '#fef08a',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))'
          }}
        />
      </div>

      <div
        className="asset-info"
        style={{ cursor: isSelectMode ? 'not-allowed' : 'pointer' }}
        onClick={() => !isSelectMode && onNavigate(folder.id)}
      >
        <h4 title={folder.name} style={{ fontWeight: 600 }}>{folder.name}</h4>
        <p>
          {fileCount} file • {sizeStr}
        </p>
      </div>

      <div className="asset-actions">
        <button
          type="button"
          title={isSelectMode ? 'Nonaktif saat mode pilih file' : 'Buka'}
          disabled={isSelectMode}
          onClick={() => !isSelectMode && onNavigate(folder.id)}
        >
          <FolderOpen size={14} />
        </button>

        {canRename && (
          <button
            type="button"
            title={isSelectMode ? 'Nonaktif saat mode pilih file' : 'Ganti Nama'}
            disabled={isSelectMode}
            onClick={() => !isSelectMode && onRename(folder)}
          >
            <Pencil size={14} />
          </button>
        )}

        {canDelete && (
          <button
            type="button"
            className="btn-danger"
            title={isSelectMode ? 'Nonaktif saat mode pilih file' : 'Hapus Folder'}
            disabled={isSelectMode}
            onClick={() => !isSelectMode && onDelete(folder)}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
