import React from 'react';
import { Inbox } from 'lucide-react';
import FolderCard from './FolderCard';
import AssetCard from './AssetCard';

export default function AssetGrid({
  folders,
  assets,
  isSelectMode,
  selectedAssetIds,
  onToggleSelect,
  onNavigateFolder,
  onPreviewAsset,
  onRenameFolder,
  onDeleteFolder,
  onMoveAsset,
  onRenameAsset,
  onDeleteAsset
}) {
  const hasFolders = folders && folders.length > 0;
  const hasAssets = assets && assets.length > 0;

  if (!hasFolders && !hasAssets) {
    return (
      <div className="grid">
        <div className="empty-state">
          <Inbox size={48} style={{ marginBottom: 12 }} />
          <p>Direktori ini kosong.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid ${isSelectMode ? 'select-mode-active' : ''}`}>
      {/* Folders */}
      {hasFolders &&
        folders.map((folder) => (
          <FolderCard
            key={`folder-${folder.id}`}
            folder={folder}
            isSelectMode={isSelectMode}
            onNavigate={onNavigateFolder}
            onRename={onRenameFolder}
            onDelete={onDeleteFolder}
          />
        ))}

      {/* Assets */}
      {hasAssets &&
        assets.map((asset) => (
          <AssetCard
            key={`asset-${asset.id}`}
            asset={asset}
            isSelected={selectedAssetIds.has(asset.id)}
            isSelectMode={isSelectMode}
            onToggleSelect={onToggleSelect}
            onPreview={onPreviewAsset}
            onMove={onMoveAsset}
            onRename={onRenameAsset}
            onDelete={onDeleteAsset}
          />
        ))}
    </div>
  );
}
