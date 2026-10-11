import React, { useState, useEffect } from 'react';
import { Users, UserPlus, X, Pencil, Trash2, Loader } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

export default function UsersManagementModal({ isOpen, onClose, onOpenUserForm }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers();
      setUsers(res.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Yakin ingin menghapus pengguna "${u.username}"?`)) return;
    try {
      await api.deleteUser(u.id);
      showToast('Pengguna berhasil dihapus!', 'success');
      loadUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large-modal">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, justifyContent: 'flex-start' }}>
            <span>Kelola Pengguna</span>
          </h3>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => onOpenUserForm(null, loadUsers)}
              style={{ padding: '7px 14px', fontSize: 12 }}
            >
              <UserPlus size={14} />
              <span>Tambah User</span>
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              style={{ padding: '7px 14px', fontSize: 12 }}
            >
              <X size={14} />
              <span>Tutup</span>
            </button>
          </div>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 10px' }}>
          Atur hak akses pengguna untuk mengunggah, menghapus, mengubah nama, atau memindahkan file.
        </p>

        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Role</th>
                <th>Hak Akses</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                    <Loader size={20} className="spin" style={{ display: 'inline', marginRight: 8 }} />
                    Memuat pengguna...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                    Tidak ada pengguna ditemukan.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSuper = u.role === 'superuser';
                  const roleClass = isSuper
                    ? 'superuser'
                    : u.can_upload || u.can_delete || u.can_rename || u.can_move
                      ? 'user'
                      : 'viewer';
                  const roleLabel = isSuper
                    ? 'Superuser'
                    : u.can_upload || u.can_delete || u.can_rename || u.can_move
                      ? 'User'
                      : 'Viewer';

                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{u.username}</div>
                      </td>
                      <td>
                        <span className={`badge-role ${roleClass}`}>{roleLabel}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                          {isSuper ? (
                            <span className="perm-tag enabled" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                              Semua Hak Akses
                            </span>
                          ) : (
                            <>
                              <span className={`perm-tag ${u.can_upload ? 'enabled' : 'disabled'}`}>Upload</span>
                              <span className={`perm-tag ${u.can_delete ? 'enabled' : 'disabled'}`}>Hapus</span>
                              <span className={`perm-tag ${u.can_rename ? 'enabled' : 'disabled'}`}>Rename</span>
                              <span className={`perm-tag ${u.can_move ? 'enabled' : 'disabled'}`}>Pindah</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 4 }}>
                          <button
                            type="button"
                            title="Edit"
                            onClick={() => onOpenUserForm(u, loadUsers)}
                            style={{
                              padding: '6px 8px',
                              fontSize: 12,
                              background: 'var(--bg-color)',
                              color: 'var(--text-main)',
                              border: '1px solid var(--border-color)'
                            }}
                          >
                            <Pencil size={13} />
                          </button>
                          {!isSuper && (
                            <button
                              type="button"
                              className="btn-danger"
                              title="Hapus"
                              onClick={() => handleDeleteUser(u)}
                              style={{ padding: '6px 8px', fontSize: 12 }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
