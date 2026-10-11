import React, { useState, useEffect } from 'react';
import { Folder, Home, CornerDownRight, Check, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function MoveModal({
  isOpen,
  isBulk,
  count,
  folders = [],
  currentFolderId,
  onClose,
  onSubmit
}) {
  const [targetFolderId, setTargetFolderId] = useState('');
  const [allFolders, setAllFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load complete folder hierarchy when modal opens
  useEffect(() => {
    if (isOpen) {
      let isMounted = true;
      setLoading(true);
      // Default to root ('') if currentFolderId exists, or keep ''
      setTargetFolderId(currentFolderId ? '' : '');

      api
        .getAllFolders()
        .then((res) => {
          if (isMounted) {
            setAllFolders(res.data || []);
          }
        })
        .catch(() => {
          if (isMounted) {
            // Fallback to folders passed from props
            setAllFolders(folders || []);
          }
        })
        .finally(() => {
          if (isMounted) {
            setLoading(false);
          }
        });

      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, folders, currentFolderId]);

  if (!isOpen) return null;

  // Build tree hierarchy
  const buildFolderTree = (list) => {
    const childrenMap = new Map();
    list.forEach((f) => {
      const parent = f.parent_id !== null && f.parent_id !== undefined ? String(f.parent_id) : 'root';
      if (!childrenMap.has(parent)) {
        childrenMap.set(parent, []);
      }
      childrenMap.get(parent).push(f);
    });

    childrenMap.forEach((arr) => arr.sort((a, b) => a.name.localeCompare(b.name)));

    const result = [];
    const traverse = (parentId, level) => {
      const children = childrenMap.get(parentId) || [];
      children.forEach((child) => {
        result.push({ ...child, level });
        traverse(String(child.id), level + 1);
      });
    };

    traverse('root', 0);
    return result;
  };

  const hierarchicalFolders = buildFolderTree(allFolders);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const folderVal = targetFolderId === '' ? null : parseInt(targetFolderId, 10);
      await onSubmit(folderVal);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const normalizedCurrentId =
    currentFolderId !== null && currentFolderId !== undefined && currentFolderId !== ''
      ? String(currentFolderId)
      : '';

  const isAlreadyInTarget = String(targetFolderId) === normalizedCurrentId;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 460, width: '92%' }}
      >
        <h3 style={{ marginBottom: 6 }}>
          <span>{isBulk ? `Pindahkan ${count} File Terpilih` : 'Pindahkan File'}</span>
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          Pilih folder tujuan dari daftar hirarki di bawah ini:
        </p>

        <form onSubmit={handleSubmit}>
          {loading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 0',
                gap: 10,
                color: 'var(--text-muted)'
              }}
            >
              <Loader2 size={20} className="spin" />
              <span style={{ fontSize: 13 }}>Memuat daftar folder...</span>
            </div>
          ) : (
            <div className="folder-select-list">
              {/* Option: Home / Root */}
              <button
                type="button"
                className={`folder-select-item ${targetFolderId === '' ? 'selected' : ''} ${
                  normalizedCurrentId === '' ? 'current-location' : ''
                }`}
                onClick={() => setTargetFolderId('')}
                style={{ paddingLeft: 12 }}
              >
                <div className="folder-item-left">
                  <Home
                    size={18}
                    style={{
                      color: targetFolderId === '' ? '#2563eb' : '#64748b',
                      flexShrink: 0
                    }}
                  />
                  <span className="folder-item-name" style={{ fontWeight: 600 }}>
                    Home (Direktori Utama)
                  </span>
                  {normalizedCurrentId === '' && (
                    <span className="folder-item-badge">Lokasi Saat Ini</span>
                  )}
                </div>
                <div className="folder-select-radio">
                  {targetFolderId === '' && <Check size={14} />}
                </div>
              </button>

              {/* Hierarchical folder items */}
              {hierarchicalFolders.map((f) => {
                const isSelected = String(targetFolderId) === String(f.id);
                const isCurrent = normalizedCurrentId === String(f.id);

                return (
                  <button
                    key={f.id}
                    type="button"
                    className={`folder-select-item ${isSelected ? 'selected' : ''} ${
                      isCurrent ? 'current-location' : ''
                    }`}
                    onClick={() => setTargetFolderId(String(f.id))}
                    style={{
                      paddingLeft: 12 + f.level * 22
                    }}
                  >
                    <div className="folder-item-left">
                      {f.level > 0 && (
                        <CornerDownRight
                          size={14}
                          style={{
                            color: '#94a3b8',
                            flexShrink: 0,
                            marginRight: 2
                          }}
                        />
                      )}
                      <Folder
                        size={18}
                        style={{
                          color: '#eab308',
                          fill: isSelected ? '#fef08a' : '#fef9c3',
                          flexShrink: 0
                        }}
                      />
                      <span className="folder-item-name">{f.name}</span>
                      {isCurrent && (
                        <span className="folder-item-badge">Lokasi Saat Ini</span>
                      )}
                    </div>
                    <div className="folder-select-radio">
                      {isSelected && <Check size={14} />}
                    </div>
                  </button>
                );
              })}

              {hierarchicalFolders.length === 0 && (
                <div
                  style={{
                    padding: '16px 12px',
                    textAlign: 'center',
                    fontSize: 13,
                    color: 'var(--text-muted)'
                  }}
                >
                  Belum ada subfolder.
                </div>
              )}
            </div>
          )}

          {isAlreadyInTarget && (
            <p
              style={{
                fontSize: 12,
                color: '#e11d48',
                margin: '-8px 0 14px',
                textAlign: 'center',
                fontWeight: 500
              }}
            >
              * File sudah berada di folder ini. Pilih folder tujuan lain.
            </p>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || isAlreadyInTarget || loading}
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="spin" />
                  <span>Memindahkan...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Pindahkan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
