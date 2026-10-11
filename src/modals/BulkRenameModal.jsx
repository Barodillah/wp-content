import React, { useState } from 'react';
import { Pencil, Check } from 'lucide-react';

export default function BulkRenameModal({ isOpen, selectedCount, onClose, onSubmit }) {
  const [baseName, setBaseName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!baseName.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(baseName.trim());
      setBaseName('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const previewName = baseName.trim() || '[nama]';

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>
          <span>Ganti Nama Berurutan ({selectedCount} File)</span>
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          Nomor urutan otomatis akan ditambahkan di akhir nama setiap file terpilih.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nama dasar (contoh: foto-produk)"
            value={baseName}
            onChange={(e) => setBaseName(e.target.value)}
            autoFocus
            style={{ width: '100%', marginBottom: 8 }}
          />

          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              background: 'var(--bg-color)',
              padding: '8px 12px',
              borderRadius: 6,
              textAlign: 'left',
              marginBottom: 16
            }}
          >
            Format hasil:{' '}
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
              {previewName}-1.ext, {previewName}-2.ext, ...
            </span>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Batal
            </button>
            <button type="submit" disabled={submitting || !baseName.trim()}>
              <Check size={14} />
              <span>Simpan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
