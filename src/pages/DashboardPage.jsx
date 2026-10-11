import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Breadcrumbs from '../components/Breadcrumbs';
import Toolbar from '../components/Toolbar';
import HeroUpload from '../components/HeroUpload';
import AssetGrid from '../components/AssetGrid';
import BulkActionBar from '../components/BulkActionBar';
import { useToast } from '../components/Toast';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

// Modals
import PreviewModal from '../modals/PreviewModal';
import CreateFolderModal from '../modals/CreateFolderModal';
import RenameModal from '../modals/RenameModal';
import BulkRenameModal from '../modals/BulkRenameModal';
import MoveModal from '../modals/MoveModal';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';
import UsersManagementModal from '../modals/UsersManagementModal';
import UserFormModal from '../modals/UserFormModal';
import ProfileModal from '../modals/ProfileModal';
import KeyboardShortcutsModal from '../modals/KeyboardShortcutsModal';
import SystemSettingsModal from '../modals/SystemSettingsModal';

export default function DashboardPage() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, isSuperuser, canUpload, canDelete, canRename, canMove, refreshUser } = useAuth();
  const canBulkAction = canDelete || canRename || canMove;

  const currentFolderId = folderId ? parseInt(folderId) : null;

  // Data State
  const [folders, setFolders] = useState([]);
  const [assets, setAssets] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Selection & Bulk State
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedAssetIds, setSelectedAssetIds] = useState(new Set());

  // Modal States
  const [previewAsset, setPreviewAsset] = useState(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [isBulkRenameOpen, setIsBulkRenameOpen] = useState(false);
  const [moveModalState, setMoveModalState] = useState({ isOpen: false, isBulk: false, targetAsset: null });
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, isBulk: false, target: null });
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [userFormState, setUserFormState] = useState({ isOpen: false, user: null, onSaved: null });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isProfileNoticeMode, setIsProfileNoticeMode] = useState(false);
  const hasPromptedNoticeRef = useRef(false);
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSettingsNoticeMode, setIsSettingsNoticeMode] = useState(false);
  const hasPromptedSettingsRef = useRef(false);

  const searchInputRef = useRef(null);

  // Trigger modal himbauan jika tabel system_settings masih kosong (Superuser wajib simpan)
  // atau jika user masih menggunakan default credentials (Super Administrator & admin123)
  useEffect(() => {
    if (!user) return;

    if (isSuperuser && !hasPromptedSettingsRef.current) {
      api.getSettings().then((res) => {
        if (res && res.data && res.data.is_empty) {
          hasPromptedSettingsRef.current = true;
          setIsSettingsNoticeMode(true);
          setIsSettingsModalOpen(true);
          return;
        }
        if (user.is_default_admin && !hasPromptedNoticeRef.current) {
          hasPromptedNoticeRef.current = true;
          setIsProfileNoticeMode(true);
          setIsProfileModalOpen(true);
        }
      }).catch(() => {
        if (user.is_default_admin && !hasPromptedNoticeRef.current) {
          hasPromptedNoticeRef.current = true;
          setIsProfileNoticeMode(true);
          setIsProfileModalOpen(true);
        }
      });
    } else if (user.is_default_admin && !hasPromptedNoticeRef.current && !isSettingsModalOpen) {
      hasPromptedNoticeRef.current = true;
      setIsProfileNoticeMode(true);
      setIsProfileModalOpen(true);
    }
  }, [user, isSuperuser, isSettingsModalOpen]);

  // Load Assets & Folders
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (searchQuery.trim()) {
        const res = await api.search(searchQuery.trim());
        if (res && res.data) {
          setFolders(res.data.folders || []);
          setAssets(res.data.assets || []);
          setBreadcrumbs([]);
        }
      } else {
        const res = await api.list(currentFolderId);
        if (res && res.data) {
          setFolders(res.data.folders || []);
          setAssets(res.data.assets || []);
          setBreadcrumbs(res.data.breadcrumbs || []);
        }
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, searchQuery, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Debounced Search handler
  const searchTimeoutRef = useRef(null);
  const handleSearchChange = (val) => {
    setSearchQuery(val);
    clearTimeout(searchTimeoutRef.current);
    if (!val.trim()) {
      // Return to regular folder view immediately
      return;
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Navigation
  const handleNavigate = (id) => {
    setSearchQuery('');
    if (isSelectMode) {
      setIsSelectMode(false);
      setSelectedAssetIds(new Set());
    }
    if (id) {
      navigate(`/folder/${id}`);
    } else {
      navigate('/');
    }
  };

  // Select Mode & Selection
  const handleToggleSelectMode = () => {
    if (isSelectMode) {
      setIsSelectMode(false);
      setSelectedAssetIds(new Set());
    } else {
      setIsSelectMode(true);
    }
  };

  const handleToggleSelectAsset = (id) => {
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedAssetIds.size === assets.length) {
      setSelectedAssetIds(new Set());
    } else {
      setSelectedAssetIds(new Set(assets.map((a) => a.id)));
    }
  };

  // Folder Operations
  const handleCreateFolder = async (name) => {
    try {
      await api.createFolder(name, currentFolderId);
      showToast('Folder berhasil dibuat!', 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRename = async (target, newName) => {
    try {
      if (target.file_name !== undefined) {
        // Asset rename
        await api.renameAsset(target.id, newName);
        showToast('Nama file berhasil diubah!', 'success');
      } else {
        // Folder rename
        await api.renameFolder(target.id, newName);
        showToast('Nama folder berhasil diubah!', 'success');
      }
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Move Operations
  const handleMoveSubmit = async (targetFolderIdVal) => {
    try {
      if (moveModalState.isBulk) {
        const ids = Array.from(selectedAssetIds);
        await api.bulkMove(ids, targetFolderIdVal);
        showToast(`${ids.length} file berhasil dipindahkan!`, 'success');
        setIsSelectMode(false);
        setSelectedAssetIds(new Set());
      } else if (moveModalState.targetAsset) {
        await api.moveAsset(moveModalState.targetAsset.id, targetFolderIdVal);
        showToast('File berhasil dipindahkan!', 'success');
      }
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Bulk Rename Operations
  const handleBulkRenameSubmit = async (baseName) => {
    const selectedAssetsList = assets.filter((a) => selectedAssetIds.has(a.id));
    if (selectedAssetsList.length === 0) return;

    const items = selectedAssetsList.map((asset, index) => {
      let ext = '';
      if (asset.file_name && asset.file_name.includes('.')) {
        ext = '.' + asset.file_name.split('.').pop();
      } else if (asset.file_path && asset.file_path.includes('.')) {
        const clean = asset.file_path.split('?')[0].split('#')[0];
        const pExt = clean.split('.').pop().toLowerCase();
        if (pExt && pExt.length <= 5 && !pExt.includes('/')) {
          ext = '.' + pExt;
        }
      }
      if (!ext && asset.file_type) {
        const mimeMap = {
          'image/jpeg': '.jpg',
          'image/jpg': '.jpg',
          'image/png': '.png',
          'image/gif': '.gif',
          'image/webp': '.webp',
          'image/svg+xml': '.svg',
          'video/mp4': '.mp4',
          'video/webm': '.webm',
          'application/pdf': '.pdf',
          'text/plain': '.txt'
        };
        ext = mimeMap[asset.file_type] || '';
      }
      const newName = `${baseName}-${index + 1}${ext}`;
      return { id: asset.id, new_name: newName };
    });

    try {
      const ids = selectedAssetsList.map((a) => a.id);
      await api.bulkRename({ ids, base_name: baseName, items });
      showToast(`${items.length} file berhasil diubah namanya secara berurutan!`, 'success');
      setIsSelectMode(false);
      setSelectedAssetIds(new Set());
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Bulk Download Operations
  const handleBulkDownload = () => {
    const ids = Array.from(selectedAssetIds);
    if (ids.length === 0) return;
    const downloadUrl = api.getBulkDownloadUrl(ids);
    window.open(downloadUrl, '_blank');
  };

  // Delete Operations
  const handleDeleteConfirm = async () => {
    try {
      if (deleteModalState.isBulk) {
        const ids = Array.from(selectedAssetIds);
        await api.bulkDelete(ids);
        showToast(`${ids.length} file berhasil dihapus!`, 'success');
        setIsSelectMode(false);
        setSelectedAssetIds(new Set());
      } else if (deleteModalState.target) {
        const target = deleteModalState.target;
        if (target.file_name !== undefined) {
          await api.deleteAsset(target.id);
          showToast('File berhasil dihapus!', 'success');
        } else {
          await api.deleteFolder(target.id);
          showToast('Folder berhasil dihapus!', 'success');
        }
      }
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Any active modal helper
  const isAnyModalOpen =
    !!previewAsset ||
    isShortcutHelpOpen ||
    userFormState.isOpen ||
    isUsersModalOpen ||
    isProfileModalOpen ||
    deleteModalState.isOpen ||
    moveModalState.isOpen ||
    isBulkRenameOpen ||
    !!renameTarget ||
    isCreateFolderOpen;

  // Keyboard Shortcuts Registration
  useKeyboardShortcuts([
    // Escape: Cascading modal & state dismissal
    {
      key: 'Escape',
      allowInInput: true,
      action: () => {
        if (previewAsset) {
          setPreviewAsset(null);
        } else if (isShortcutHelpOpen) {
          setIsShortcutHelpOpen(false);
        } else if (userFormState.isOpen) {
          setUserFormState({ isOpen: false, user: null, onSaved: null });
        } else if (isUsersModalOpen) {
          setIsUsersModalOpen(false);
        } else if (isProfileModalOpen) {
          setIsProfileModalOpen(false);
          setIsProfileNoticeMode(false);
        } else if (deleteModalState.isOpen) {
          setDeleteModalState({ isOpen: false, isBulk: false, target: null });
        } else if (moveModalState.isOpen) {
          setMoveModalState({ isOpen: false, isBulk: false, targetAsset: null });
        } else if (isBulkRenameOpen) {
          setIsBulkRenameOpen(false);
        } else if (renameTarget) {
          setRenameTarget(null);
        } else if (isCreateFolderOpen) {
          setIsCreateFolderOpen(false);
        } else if (isSelectMode) {
          setIsSelectMode(false);
          setSelectedAssetIds(new Set());
        } else if (searchQuery) {
          setSearchQuery('');
          if (searchInputRef.current) searchInputRef.current.blur();
        } else if (document.activeElement === searchInputRef.current) {
          searchInputRef.current.blur();
        }
      }
    },

    // Search focus: / and Ctrl+K
    {
      key: '/',
      action: (e) => {
        if (isAnyModalOpen) return;
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      }
    },
    {
      key: 'k',
      ctrl: true,
      action: (e) => {
        if (isAnyModalOpen) return;
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      }
    },

    // Shortcut Cheatsheet: ?
    {
      key: '?',
      action: (e) => {
        e.preventDefault();
        setIsShortcutHelpOpen((prev) => !prev);
      }
    },

    // Select Mode toggle: S
    {
      key: 's',
      action: (e) => {
        if (isAnyModalOpen) return;
        if (canBulkAction) {
          e.preventDefault();
          handleToggleSelectMode();
        }
      }
    },

    // Select All / Deselect All: Ctrl+A
    {
      key: 'a',
      ctrl: true,
      action: (e) => {
        if (isAnyModalOpen) return;
        if (isSelectMode && assets.length > 0) {
          e.preventDefault();
          handleToggleSelectAll();
        }
      }
    },

    // Create Folder: Shift + N
    {
      key: 'n',
      shift: true,
      action: (e) => {
        if (isAnyModalOpen) return;
        if (canUpload) {
          e.preventDefault();
          setIsCreateFolderOpen(true);
        }
      }
    },

    // Quick Look Preview: Space
    {
      key: ' ',
      action: (e) => {
        if (previewAsset) {
          e.preventDefault();
          setPreviewAsset(null);
        } else if (!isAnyModalOpen && isSelectMode && selectedAssetIds.size === 1) {
          e.preventDefault();
          const selectedId = Array.from(selectedAssetIds)[0];
          const target = assets.find((a) => a.id === selectedId);
          if (target) {
            setPreviewAsset(target);
          }
        }
      }
    },

    // Move Selected: M
    {
      key: 'm',
      action: (e) => {
        if (isAnyModalOpen) return;
        if (canMove && isSelectMode && selectedAssetIds.size > 0) {
          e.preventDefault();
          setMoveModalState({ isOpen: true, isBulk: true, targetAsset: null });
        }
      }
    },

    // Rename Selected: R or F2
    {
      key: 'r',
      action: (e) => {
        if (isAnyModalOpen) return;
        if (canRename && isSelectMode && selectedAssetIds.size > 0) {
          e.preventDefault();
          if (selectedAssetIds.size === 1) {
            const selectedId = Array.from(selectedAssetIds)[0];
            const target = assets.find((a) => a.id === selectedId);
            if (target) setRenameTarget(target);
          } else {
            setIsBulkRenameOpen(true);
          }
        }
      }
    },
    {
      key: 'F2',
      action: (e) => {
        if (isAnyModalOpen) return;
        if (canRename && isSelectMode && selectedAssetIds.size > 0) {
          e.preventDefault();
          if (selectedAssetIds.size === 1) {
            const selectedId = Array.from(selectedAssetIds)[0];
            const target = assets.find((a) => a.id === selectedId);
            if (target) setRenameTarget(target);
          } else {
            setIsBulkRenameOpen(true);
          }
        }
      }
    },

    // Download Selected: D
    {
      key: 'd',
      action: (e) => {
        if (isAnyModalOpen) return;
        if (isSelectMode && selectedAssetIds.size > 0) {
          e.preventDefault();
          handleBulkDownload();
        }
      }
    },

    // Delete Selected: Delete
    {
      key: 'Delete',
      action: (e) => {
        if (isAnyModalOpen) return;
        if (canDelete && isSelectMode && selectedAssetIds.size > 0) {
          e.preventDefault();
          setDeleteModalState({ isOpen: true, isBulk: true, target: null });
        }
      }
    },

    // Navigate to Parent: Backspace or Alt+Up
    {
      key: 'Backspace',
      action: (e) => {
        if (isAnyModalOpen) return;
        if (breadcrumbs && breadcrumbs.length > 0) {
          e.preventDefault();
          const parentId = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2].id : null;
          handleNavigate(parentId);
        }
      }
    },
    {
      key: 'ArrowUp',
      alt: true,
      action: (e) => {
        if (isAnyModalOpen) return;
        if (breadcrumbs && breadcrumbs.length > 0) {
          e.preventDefault();
          const parentId = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2].id : null;
          handleNavigate(parentId);
        }
      }
    },

    // Navigate to Home: Alt+H
    {
      key: 'h',
      alt: true,
      action: (e) => {
        if (isAnyModalOpen) return;
        e.preventDefault();
        handleNavigate(null);
      }
    }
  ]);

  return (
    <div className="app-container">
      {/* Header */}
      <Header
        onOpenUsersModal={() => setIsUsersModalOpen(true)}
        onOpenProfileModal={() => {
          setIsProfileNoticeMode(false);
          setIsProfileModalOpen(true);
        }}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
      />

      {/* Hero Upload Area */}
      <HeroUpload currentFolderId={currentFolderId} onUploadSuccess={loadData} />

      {/* Breadcrumbs & Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <Breadcrumbs
          breadcrumbs={breadcrumbs}
          onNavigate={handleNavigate}
          searchQuery={searchQuery}
          onClearSearch={handleClearSearch}
        />
      </div>

      <Toolbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onOpenCreateFolder={() => setIsCreateFolderOpen(true)}
        isSelectMode={isSelectMode}
        onToggleSelectMode={handleToggleSelectMode}
        searchInputRef={searchInputRef}
        onOpenShortcutHelp={() => setIsShortcutHelpOpen(true)}
      />

      {/* Grid of Folders & Assets */}
      <AssetGrid
        folders={folders}
        assets={assets}
        isSelectMode={isSelectMode}
        selectedAssetIds={selectedAssetIds}
        onToggleSelect={handleToggleSelectAsset}
        onNavigateFolder={handleNavigate}
        onPreviewAsset={(asset) => setPreviewAsset(asset)}
        onRenameFolder={(folder) => setRenameTarget(folder)}
        onDeleteFolder={(folder) => setDeleteModalState({ isOpen: true, isBulk: false, target: folder })}
        onMoveAsset={(asset) => setMoveModalState({ isOpen: true, isBulk: false, targetAsset: asset })}
        onRenameAsset={(asset) => setRenameTarget(asset)}
        onDeleteAsset={(asset) => setDeleteModalState({ isOpen: true, isBulk: false, target: asset })}
      />

      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        isSelectMode={isSelectMode}
        selectedCount={selectedAssetIds.size}
        totalCount={assets.length}
        isAllSelected={assets.length > 0 && selectedAssetIds.size === assets.length}
        onToggleSelectAll={handleToggleSelectAll}
        onOpenBulkMove={() => setMoveModalState({ isOpen: true, isBulk: true, targetAsset: null })}
        onOpenBulkRename={() => setIsBulkRenameOpen(true)}
        onBulkDownload={handleBulkDownload}
        onOpenBulkDelete={() => setDeleteModalState({ isOpen: true, isBulk: true, target: null })}
        onExitSelectMode={() => {
          setIsSelectMode(false);
          setSelectedAssetIds(new Set());
        }}
      />

      {/* Modals */}
      <PreviewModal
        asset={previewAsset}
        onClose={() => setPreviewAsset(null)}
      />

      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        onSubmit={handleCreateFolder}
      />

      <RenameModal
        isOpen={!!renameTarget}
        target={renameTarget}
        onClose={() => setRenameTarget(null)}
        onSubmit={handleRename}
      />

      <BulkRenameModal
        isOpen={isBulkRenameOpen}
        selectedCount={selectedAssetIds.size}
        onClose={() => setIsBulkRenameOpen(false)}
        onSubmit={handleBulkRenameSubmit}
      />

      <MoveModal
        isOpen={moveModalState.isOpen}
        isBulk={moveModalState.isBulk}
        count={selectedAssetIds.size}
        folders={folders}
        currentFolderId={currentFolderId}
        onClose={() => setMoveModalState({ isOpen: false, isBulk: false, targetAsset: null })}
        onSubmit={handleMoveSubmit}
      />

      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        isBulk={deleteModalState.isBulk}
        count={selectedAssetIds.size}
        selectedIds={Array.from(selectedAssetIds)}
        target={deleteModalState.target}
        onClose={() => setDeleteModalState({ isOpen: false, isBulk: false, target: null })}
        onConfirm={handleDeleteConfirm}
      />

      <UsersManagementModal
        isOpen={isUsersModalOpen}
        onClose={() => setIsUsersModalOpen(false)}
        onOpenUserForm={(user, onSavedCallback) => {
          setUserFormState({ isOpen: true, user, onSaved: onSavedCallback });
        }}
      />

      <UserFormModal
        isOpen={userFormState.isOpen}
        user={userFormState.user}
        onClose={() => setUserFormState({ isOpen: false, user: null, onSaved: null })}
        onSaved={() => {
          if (userFormState.onSaved) userFormState.onSaved();
        }}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        isNoticeMode={isProfileNoticeMode}
        onClose={() => {
          setIsProfileModalOpen(false);
          setIsProfileNoticeMode(false);
        }}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutHelpOpen}
        onClose={() => setIsShortcutHelpOpen(false)}
      />

      <SystemSettingsModal
        isOpen={isSettingsModalOpen}
        isNoticeMode={isSettingsNoticeMode}
        onClose={() => {
          setIsSettingsModalOpen(false);
          setIsSettingsNoticeMode(false);
          loadData();
        }}
        onSaved={async () => {
          setIsSettingsNoticeMode(false);
          setIsSettingsModalOpen(false);
          loadData();
          if (refreshUser) {
            await refreshUser();
          }
          if (user && user.is_default_admin && !hasPromptedNoticeRef.current) {
            hasPromptedNoticeRef.current = true;
            setIsProfileNoticeMode(true);
            setIsProfileModalOpen(true);
          }
        }}
      />
    </div>
  );
}
