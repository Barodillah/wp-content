import React, { useState } from 'react';
import { FolderPlus, Check } from 'lucide-react';

export default function CreateFolderModal({ isOpen, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(name.trim());
      setName('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>
          <FolderPlus size={20} />
          <span>Buat Folder Baru</span>
        </h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nama folder..."
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
              <span>Buat</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
