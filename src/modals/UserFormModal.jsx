import React, { useState, useEffect } from 'react';
import { UserPlus, Pencil, Check } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

export default function UserFormModal({ isOpen, user, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [canUpload, setCanUpload] = useState(true);
  const [canDelete, setCanDelete] = useState(true);
  const [canRename, setCanRename] = useState(true);
  const [canMove, setCanMove] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const applyPreset = (type) => {
    if (type === 'all') {
      setCanUpload(true);
      setCanDelete(true);
      setCanRename(true);
      setCanMove(true);
    } else if (type === 'editor') {
      setCanUpload(true);
      setCanDelete(false);
      setCanRename(true);
      setCanMove(true);
    } else if (type === 'viewer') {
      setCanUpload(false);
      setCanDelete(false);
      setCanRename(false);
      setCanMove(false);
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setPassword('');
      setCanUpload(!!parseInt(user.can_upload || 0));
      setCanDelete(!!parseInt(user.can_delete || 0));
      setCanRename(!!parseInt(user.can_rename || 0));
      setCanMove(!!parseInt(user.can_move || 0));
    } else {
      setName('');
      setUsername('');
      setPassword('');
      applyPreset('all');
    }
  }, [user, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !name.trim()) {
      showToast('Username dan Nama harus diisi!', 'error');
      return;
    }
    if (!user && !password) {
      showToast('Password harus diisi untuk user baru!', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        username: username.trim(),
        name: name.trim(),
        can_upload: canUpload ? 1 : 0,
        can_delete: canDelete ? 1 : 0,
        can_rename: canRename ? 1 : 0,
        can_move: canMove ? 1 : 0
      };
      if (password) payload.password = password;

      if (user) {
        payload.id = user.id;
        await api.updateUser(payload);
        showToast('Pengguna berhasil diperbarui!', 'success');
      } else {
        await api.createUser(payload);
        showToast('Pengguna baru berhasil ditambahkan!', 'success');
      }
      onSaved();
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 480, textAlign: 'left' }}>
        <h3 style={{ marginTop: 0, justifyContent: 'flex-start' }}>
          {user ? (
            <>
              <span>Edit Pengguna: @{user.username}</span>
            </>
          ) : (
            <>
              <span>Tambah User Baru</span>
            </>
          )}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Nama Lengkap
            </label>
            <input
              type="text"
              placeholder="Contoh: Staff Gudang"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Username
            </label>
            <input
              type="text"
              placeholder="Contoh: staff1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Password
            </label>
            <input
              type="password"
              placeholder={user ? 'Kosongkan jika tidak diubah' : 'Masukkan password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!user}
              style={{ width: '100%' }}
            />
            {user && (
              <small style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                Kosongkan jika tidak ingin mengubah password.
              </small>
            )}
          </div>

          <div style={{ marginTop: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Preset Hak Akses
            </label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button type="button" className="btn-preset" onClick={() => applyPreset('all')}>
                Akses Penuh
              </button>
              <button type="button" className="btn-preset" onClick={() => applyPreset('editor')}>
                Editor (Tanpa Hapus)
              </button>
              <button type="button" className="btn-preset" onClick={() => applyPreset('viewer')}>
                Hanya Lihat (Viewer)
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Rincian Hak Akses
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <label className="perm-checkbox-item">
                <input
                  type="checkbox"
                  checked={canUpload}
                  onChange={(e) => setCanUpload(e.target.checked)}
                />
                <span>Unggah & Folder</span>
              </label>

              <label className="perm-checkbox-item">
                <input
                  type="checkbox"
                  checked={canDelete}
                  onChange={(e) => setCanDelete(e.target.checked)}
                />
                <span>Hapus File/Folder</span>
              </label>

              <label className="perm-checkbox-item">
                <input
                  type="checkbox"
                  checked={canRename}
                  onChange={(e) => setCanRename(e.target.checked)}
                />
                <span>Ganti Nama</span>
              </label>

              <label className="perm-checkbox-item">
                <input
                  type="checkbox"
                  checked={canMove}
                  onChange={(e) => setCanMove(e.target.checked)}
                />
                <span>Pindahkan File</span>
              </label>
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: 16 }}>
            <button type="button" className="btn-cancel" onClick={onClose}>
              Batal
            </button>
            <button type="submit" disabled={submitting}>
              <Check size={14} />
              <span>Simpan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
