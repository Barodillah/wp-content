import React, { useState, useEffect } from 'react';
import { Pencil, Check } from 'lucide-react';

export default function RenameModal({ isOpen, target, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (target) {
      setName(target.name || target.file_name || '');
    }
  }, [target]);

  if (!isOpen || !target) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    let trimmed = name.trim();
    if (!trimmed) return;

    if (target.file_name !== undefined) {
      if (!trimmed.includes('.') || trimmed.split('.').pop().trim() === '') {
        let ext = '';
        if (target.file_name && target.file_name.includes('.')) {
          ext = target.file_name.split('.').pop();
        } else if (target.file_path && target.file_path.includes('.')) {
          const clean = target.file_path.split('?')[0].split('#')[0];
          ext = clean.split('.').pop();
        }
        if (ext) {
          trimmed = `${trimmed.replace(/\.+$/, '')}.${ext}`;
        }
      }
    }

    setSubmitting(true);
    try {
      await onSubmit(target, trimmed);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>
          <span>Ganti Nama</span>
        </h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nama baru..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            style={{ width: '100%', margin: '14px 0 6px', textAlign: 'center' }}
          />

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Batal
            </button>
            <button type="submit" disabled={submitting || !name.trim()}>
              <Check size={14} />
              <span>Simpan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
