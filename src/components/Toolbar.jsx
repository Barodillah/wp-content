import React from 'react';
import { Search, FolderPlus, CheckSquare, Keyboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Toolbar({
  searchQuery,
  onSearchChange,
  onOpenCreateFolder,
  isSelectMode,
  onToggleSelectMode,
  searchInputRef,
  onOpenShortcutHelp
}) {
  const { canUpload, canDelete, canRename, canMove } = useAuth();
  const canBulkAction = canDelete || canRename || canMove;

  return (
    <div className="toolbar">
      {/* Search Input Full Width */}
      <div className="search-box" style={{ position: 'relative' }}>
        <Search size={16} />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Cari file atau folder..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ paddingRight: 36 }}
        />
        {!searchQuery && (
          <span className="search-kbd-hint" title="Tekan / untuk mencari">
            <kbd className="kbd-badge">/</kbd>
          </span>
        )}
      </div>

      <div className="toolbar-actions">
        {/* Shortcut Cheatsheet Button */}
        {onOpenShortcutHelp && (
          <button
            type="button"
            className="btn-expandable"
            onClick={onOpenShortcutHelp}
            title="Panduan Pintasan Keyboard (?)"
          >
            <Keyboard size={18} style={{ flexShrink: 0 }} />
            <span className="btn-text-expand">Shortcut</span>
          </button>
        )}

        {/* Buat Folder Button (Hanya jika canUpload) */}
        {canUpload && (
          <button
            type="button"
            className="btn-expandable"
            onClick={onOpenCreateFolder}
            title="Buat Folder Baru (Shift + N)"
          >
            <FolderPlus size={18} style={{ flexShrink: 0 }} />
            <span className="btn-text-expand">Buat Folder</span>
          </button>
        )}

        {/* Select Mode Toggle Button */}
        {canBulkAction && (
          <button
            type="button"
            className={`btn-expandable ${isSelectMode ? 'active' : ''}`}
            onClick={onToggleSelectMode}
            title={isSelectMode ? 'Batalkan Pemilihan (Esc)' : 'Pilih Beberapa File (S)'}
          >
            <CheckSquare size={18} style={{ flexShrink: 0 }} />
            <span className="btn-text-expand">
              {isSelectMode ? 'Batal Pilih' : 'Pilih File'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
