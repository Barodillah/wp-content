import React from 'react';
import { CheckSquare, Square, FolderOutput, Pencil, Download, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BulkActionBar({
  isSelectMode,
  selectedCount,
  totalCount,
  isAllSelected,
  onToggleSelectAll,
  onOpenBulkMove,
  onOpenBulkRename,
  onBulkDownload,
  onOpenBulkDelete,
  onExitSelectMode
}) {
  const { canMove, canRename, canDelete } = useAuth();

  if (!isSelectMode) return null;

  return (
    <div className="bulk-action-bar" style={{ whiteSpace: 'nowrap', width: 'auto', maxWidth: '95vw' }}>
      <div className="bulk-count" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
        <CheckSquare size={16} />
        <span>{selectedCount} Terpilih</span>
      </div>

      {/* Select All Toggle */}
      <button
        type="button"
        className="btn-bulk-tool"
        style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
        onClick={onToggleSelectAll}
      >
        {isAllSelected ? <Square size={14} /> : <CheckSquare size={14} />}
        <span>{isAllSelected ? 'Batal Semua' : 'Pilih Semua'}</span>
      </button>

      {/* Bulk Move (Hanya jika canMove) */}
      {canMove && (
        <button
          type="button"
          className="btn-bulk-tool"
          style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          disabled={selectedCount === 0}
          onClick={onOpenBulkMove}
        >
          <FolderOutput size={14} />
          <span>Pindahkan</span>
        </button>
      )}

      {/* Bulk Rename (Hanya jika canRename) */}
      {canRename && (
        <button
          type="button"
          className="btn-bulk-tool"
          style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          disabled={selectedCount === 0}
          onClick={onOpenBulkRename}
        >
          <Pencil size={14} />
          <span>Ganti Nama</span>
        </button>
      )}

      {/* Bulk Download */}
      <button
        type="button"
        className="btn-bulk-tool"
        style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
        disabled={selectedCount === 0}
        onClick={onBulkDownload}
      >
        <Download size={14} />
        <span>Unduh</span>
      </button>

      {/* Bulk Delete (Hanya jika canDelete) */}
      {canDelete && (
        <button
          type="button"
          className="btn-bulk-tool btn-bulk-danger"
          style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          disabled={selectedCount === 0}
          onClick={onOpenBulkDelete}
        >
          <Trash2 size={14} />
          <span>Hapus</span>
        </button>
      )}

      {/* Exit Button */}
      <button
        type="button"
        className="btn-bulk-close"
        onClick={onExitSelectMode}
        title="Tutup Mode Pemilihan"
      >
        <X size={16} />
      </button>
    </div>
  );
}
