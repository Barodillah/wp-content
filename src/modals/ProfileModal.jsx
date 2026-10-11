import React, { useState, useEffect } from 'react';
import { Check, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

export default function ProfileModal({ isOpen, onClose, isNoticeMode = false }) {
  const { user, isSuperuser, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setUsername(user.username || '');
      setName(user.name || '');
      setPassword('');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSuperuser) {
      if (!username.trim()) {
        showToast('Username tidak boleh kosong.', 'error');
        return;
      }
      if (username.trim().length < 3) {
        showToast('Username minimal 3 karakter.', 'error');
        return;
      }
    }

    if (!name.trim()) {
      showToast('Nama lengkap tidak boleh kosong.', 'error');
      return;
    }

    if (isNoticeMode) {
      if (isSuperuser && username.trim().toLowerCase() === 'admin') {
        showToast('Silakan ubah username Anda dari "admin".', 'error');
        return;
      }
      if (name.trim() === 'Super Administrator') {
        showToast('Silakan ubah nama Anda dari "Super Administrator".', 'error');
        return;
      }
      if (!password.trim()) {
        showToast('Silakan masukkan password baru untuk mengamankan akun.', 'error');
        return;
      }
      if (password.trim().length < 4) {
        showToast('Password baru minimal 4 karakter.', 'error');
        return;
      }
      if (password.trim() === 'admin123') {
        showToast('Password baru tidak boleh menggunakan "admin123".', 'error');
        return;
      }
    } else if (password.trim() && password.trim().length < 4) {
      showToast('Password baru minimal 4 karakter.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.updateProfile({
        username: isSuperuser ? username.trim().toLowerCase() : undefined,
        name: name.trim(),
        password: password.trim()
      });
      showToast('Profil dan keamanan akun berhasil diperbarui!', 'success');
      await refreshUser();
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const initialLetter = (name.trim() || user.name || user.username || 'U')[0].toUpperCase();

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        style={{ maxWidth: 460, width: '92%' }}
      >
        {/* Notice Banner saat mode himbauan */}
        {isNoticeMode && (
          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              padding: '12px 14px',
              background: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: 8,
              marginBottom: 16,
              textAlign: 'left'
            }}
          >
            <ShieldAlert size={22} style={{ color: '#d97706', flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.45 }}>
              <strong style={{ display: 'block', marginBottom: 2 }}>Peringatan Keamanan Akun</strong>
              Akun Anda saat ini masih menggunakan kredensial bawaan: username <em>(admin)</em>, nama <em>(Super Administrator)</em>, dan password <em>(admin123)</em>. Silakan ganti username, nama, dan password Anda sekarang demi keamanan sistem.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: isNoticeMode
                ? 'linear-gradient(135deg, #d97706, #b45309)'
                : 'linear-gradient(135deg, #18181b, #3f3f46)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 20,
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
              flexShrink: 0
            }}
          >
            {isNoticeMode ? <ShieldAlert size={24} /> : initialLetter}
          </div>
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>
              {isNoticeMode ? 'Perbarui Profil & Password' : 'Setting Profil'}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              @{user.username} • <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{user.role}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                {isNoticeMode && isSuperuser ? 'Username Baru' : 'Username'}
              </label>
              {isSuperuser && (
                <span style={{ fontSize: 11, color: '#0284c7', fontWeight: 500 }}>
                  Dapat diubah (Superuser)
                </span>
              )}
            </div>
            <input
              type="text"
              value={isSuperuser ? username : user.username}
              onChange={(e) => isSuperuser && setUsername(e.target.value)}
              disabled={!isSuperuser}
              required={isSuperuser}
              placeholder="Masukkan username..."
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: isSuperuser ? '#fff' : '#f4f4f5',
                color: isSuperuser ? 'var(--text-main)' : '#71717a',
                cursor: isSuperuser ? 'text' : 'not-allowed'
              }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-main)' }}>
              {isNoticeMode ? 'Nama Lengkap Baru' : 'Nama Lengkap'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Masukkan nama lengkap Anda..."
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: '#fff'
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-main)' }}>
              {isNoticeMode ? 'Password Baru (Wajib Diubah)' : 'Ganti Password Baru (Opsional)'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={isNoticeMode}
              placeholder={isNoticeMode ? 'Masukkan password baru Anda...' : 'Kosongkan jika tidak ingin mengubah password'}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: '#fff'
              }}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              {isNoticeMode ? 'Nanti Saja' : 'Batal'}
            </button>
            <button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={14} className="spin" />
                  <span>Menyimpan...</span>
                </>
              ) : isNoticeMode ? (
                <>
                  <ShieldCheck size={14} />
                  <span>Simpan & Amankan</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
