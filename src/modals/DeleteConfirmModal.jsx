import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function DeleteConfirmModal({
  isOpen,
  isBulk,
  count,
  target,
  selectedIds = [],
  onClose,
  onConfirm
}) {
  const [submitting, setSubmitting] = useState(false);
  const [checkingUsage, setCheckingUsage] = useState(false);
  const [usageData, setUsageData] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setUsageData(null);
      setCheckingUsage(false);
      return;
    }

    const checkUsage = async () => {
      if (isBulk) {
        if (selectedIds && selectedIds.length > 0) {
          setCheckingUsage(true);
          try {
            const res = await api.checkAssetUsage(null, selectedIds);
            if (res && res.data && res.data.has_in_use) {
              setUsageData(res.data);
            }
          } catch { } finally {
            setCheckingUsage(false);
          }
        }
      } else if (target && target.file_name && target.id) {
        setCheckingUsage(true);
        try {
          const res = await api.checkAssetUsage(target.id);
          if (res && res.data && res.data.is_in_use) {
            setUsageData(res.data);
          }
        } catch { } finally {
          setCheckingUsage(false);
        }
      }
    };

    checkUsage();
  }, [isOpen, target, isBulk, selectedIds]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const title = isBulk
    ? `Hapus ${count} File Terpilih?`
    : target?.file_name
      ? `Hapus File "${target.file_name}"?`
      : `Hapus Folder "${target?.name}"?`;

  const desc = isBulk
    ? 'Tindakan ini tidak dapat dibatalkan. Semua file terpilih akan dihapus dari server.'
    : target?.name
      ? 'Tindakan ini akan menghapus folder beserta seluruh file di dalamnya.'
      : 'Tindakan ini tidak dapat dibatalkan. File akan dihapus permanen dari server.';

  const hasUsageWarning = usageData && (usageData.is_in_use || usageData.has_in_use);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 440, width: '92%' }}>
        <h3>
          <span>{title}</span>
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '6px 0 16px' }}>{desc}</p>

        {/* Warning Banner jika file sedang digunakan */}
        {hasUsageWarning && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              background: '#fffbeb',
              border: '1px solid #fef3c7',
              marginBottom: 16,
              textAlign: 'left'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#b45309',
                fontWeight: 600,
                fontSize: 13,
                marginBottom: 4
              }}
            >
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>Peringatan: File Sedang Digunakan!</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#92400e', lineHeight: 1.45 }}>
              File ini terdeteksi masih aktif digunakan oleh website atau memiliki riwayat akses. Menghapus file ini dapat merusak tampilan halaman yang menggunakannya (gambar rusak / 404).
            </p>

            {usageData.wp_posts && usageData.wp_posts.length > 0 && (
              <div style={{ marginTop: 8, fontSize: 11, color: '#78350f' }}>
                <strong>Postingan Terkait:</strong>{' '}
                {usageData.wp_posts.map((p) => p.post_title || p.guid).slice(0, 3).join(', ')}
              </div>
            )}

            {usageData.external_referers && usageData.external_referers.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 11, color: '#78350f' }}>
                <strong>Diakses oleh:</strong>{' '}
                {usageData.external_referers.map((r) => r.referer_domain).slice(0, 3).join(', ')}
              </div>
            )}

            {usageData.in_use_assets && (
              <div style={{ marginTop: 6, fontSize: 11, color: '#78350f' }}>
                ⚠️ <strong>{usageData.in_use_assets.length} file</strong> di antaranya sedang aktif digunakan.
              </div>
            )}
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Batal
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>{hasUsageWarning ? 'Tetap Hapus' : 'Hapus'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
