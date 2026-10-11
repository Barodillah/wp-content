import React, { useState, useEffect } from 'react';
import { Settings, Globe, Folder, Check, Loader2, AlertCircle, AlertTriangle, X, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

export default function SystemSettingsModal({ isOpen, onClose, isNoticeMode = false, onSaved }) {
  const { showToast } = useToast();

  const currentOrigin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mainDomain, setMainDomain] = useState(currentOrigin);
  const [subPath, setSubPath] = useState('/wp-content');
  const [uploadFolder, setUploadFolder] = useState('uploads');
  const [localProxyTarget, setLocalProxyTarget] = useState('http://localhost');
  const [updatedAt, setUpdatedAt] = useState(null);
  const [error, setError] = useState('');

  // Fetch settings when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setError('');
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await api.getSettings();
        if (res && res.data) {
          setMainDomain(res.data.main_domain || currentOrigin);
          setSubPath(res.data.sub_path || '/wp-content');
          setUploadFolder(res.data.upload_folder || 'uploads');
          setLocalProxyTarget(res.data.local_proxy_target || 'http://localhost');
          setUpdatedAt(res.data.updated_at || null);
        }
      } catch (err) {
        setError(err.message || 'Gagal memuat pengaturan sistem.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [isOpen, currentOrigin]);

  // Handle ESC key to close modal (disabled in notice mode or saving)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !saving && !isNoticeMode) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, saving, isNoticeMode, onClose]);

  if (!isOpen) return null;

  // Normalisasi preview URL
  const cleanDomain = mainDomain.trim().replace(/\/+$/, '') || currentOrigin;
  const cleanSub = subPath.trim().replace(/^\/+|\/+$/g, '');
  const subPrefix = cleanSub ? `/${cleanSub}` : '';
  const cleanFolder = uploadFolder.trim().replace(/^\/+|\/+$/g, '') || 'uploads';
  const previewBaseUrl = `${cleanDomain}${subPrefix}/${cleanFolder}/`;

  const handleApplyCurrentOrigin = () => {
    if (currentOrigin) {
      setMainDomain(currentOrigin);
    }
    setError('');
  };

  // Konversi timestamp UTC (dari DB) ke UTC+7 (WIB)
  const formatUtcToWib = (dateStr) => {
    if (!dateStr) return '';
    try {
      let iso = dateStr.trim().replace(' ', 'T');
      if (!iso.endsWith('Z')) {
        iso += 'Z';
      }
      const d = new Date(iso);
      if (isNaN(d.getTime())) return dateStr;

      // Geser waktu +7 jam (UTC+7)
      const wibDate = new Date(d.getTime() + 7 * 60 * 60 * 1000);
      const year = wibDate.getUTCFullYear();
      const month = String(wibDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(wibDate.getUTCDate()).padStart(2, '0');
      const hours = String(wibDate.getUTCHours()).padStart(2, '0');
      const minutes = String(wibDate.getUTCMinutes()).padStart(2, '0');
      const seconds = String(wibDate.getUTCSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} WIB`;
    } catch (e) {
      return dateStr;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!mainDomain.trim()) {
      showToast('Domain utama wajib diisi.', 'error');
      return;
    }
    if (!uploadFolder.trim()) {
      showToast('Nama folder uploads wajib diisi.', 'error');
      return;
    }
    const cleanUploadName = uploadFolder.trim().toLowerCase();
    if (cleanUploadName === 'assets' || cleanUploadName === 'wp_api') {
      showToast('Nama folder uploads tidak boleh menggunakan "assets" atau "wp_api" karena merupakan folder sistem.', 'error');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(uploadFolder.trim())) {
      showToast('Nama folder uploads hanya boleh berisi huruf, angka, tanda strip (-), atau underscore (_).', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await api.updateSettings({
        main_domain: mainDomain.trim(),
        sub_path: subPath.trim(),
        upload_folder: uploadFolder.trim(),
        local_proxy_target: localProxyTarget.trim() || 'http://localhost'
      });

      if (res && res.success) {
        showToast('Pengaturan sistem berhasil disimpan!', 'success');
        if (onSaved) {
          onSaved();
        }
        onClose();
      } else {
        setError(res?.error || 'Gagal menyimpan pengaturan.');
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !saving && !isNoticeMode && onClose()}>
      <div
        className="modal-content"
        style={{ maxWidth: 520, width: '94%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 17 }}>
            <span>{isNoticeMode ? 'Inisialisasi Pengaturan Sistem' : 'Pengaturan Domain & Storage'}</span>
          </h3>
          {!isNoticeMode && (
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: 4,
                borderRadius: 4
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Notice Banner jika tabel system_settings masih kosong (mode himbauan & wajib simpan) */}
        {isNoticeMode && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '12px 14px',
              background: '#fffbeb',
              color: '#92400e',
              border: '1px solid #fef3c7',
              borderRadius: 8,
              marginBottom: 16
            }}
          >
            <AlertTriangle size={22} style={{ color: '#d97706', flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 13, lineHeight: 1.45 }}>
              <strong style={{ display: 'block', marginBottom: 2, color: '#b45309' }}>Konfigurasi Sistem Diperlukan</strong>
              Tabel pengaturan sistem (<code>system_settings</code>) saat ini masih kosong. Anda wajib memeriksa dan menyimpan konfigurasi domain serta folder penyimpanan ini untuk mengaktifkan sistem.
            </div>
          </div>
        )}

        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 0, marginBottom: 16 }}>
          Atur domain utama, direktori sub-path, dan nama folder penyimpanan file aset. Pengaturan ini otomatis tersimpan di database dan menyinkronkan konfigurasi sistem.
        </p>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              background: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fee2e2',
              borderRadius: 6,
              fontSize: 13,
              marginBottom: 14
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px', display: 'block' }} />
            <span>Memuat pengaturan dari database...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Shortcut Tombol Domain Saat Ini */}
            {currentOrigin && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Deteksi Domain Otomatis
                </span>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="preset-btn"
                    onClick={handleApplyCurrentOrigin}
                  >
                    <Globe size={13} />
                    <span>Gunakan Domain Saat Ini ({currentOrigin})</span>
                  </button>
                </div>
              </div>
            )}

            {/* Input: Domain Utama */}
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                Domain Utama
              </label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <Globe size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder={currentOrigin || 'https://domainanda.com'}
                  value={mainDomain}
                  onChange={(e) => setMainDomain(e.target.value)}
                  style={{ width: '100%', paddingLeft: 36, height: 38, borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 13 }}
                  required
                />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                Domain publik yang disematkan ke tautan publik aset (contoh: {currentOrigin || 'https://domainanda.com'}).
              </span>
            </div>

            {/* Input: Sub-path */}
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                Sub-path / Prefix Direktori
              </label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>/</span>
                <input
                  type="text"
                  placeholder="/wp-content (kosongkan jika di root)"
                  value={subPath}
                  onChange={(e) => setSubPath(e.target.value)}
                  style={{ width: '100%', paddingLeft: 28, height: 38, borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 13 }}
                />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                Sub-direktori URL tempat aplikasi terpasang (contoh: /wp-content, atau kosongkan jika di root).
              </span>
            </div>

            {/* Input: Nama Folder Uploads */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                Nama Folder Penyimpanan Uploads
              </label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <Folder size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="uploads"
                  value={uploadFolder}
                  onChange={(e) => setUploadFolder(e.target.value)}
                  style={{ width: '100%', paddingLeft: 36, height: 38, borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 13 }}
                  required
                />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                Nama folder fisik penyimpanan di server (default: uploads). Hanya huruf, angka, strip, atau underscore. Dilarang menggunakan nama sistem <code>assets</code> atau <code>wp_api</code>.
              </span>
            </div>

            {/* Live Preview Box */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '12px 14px',
                marginBottom: 20
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <ExternalLink size={14} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Pratinjau URL Aset (BASE_URL):</span>
              </div>
              <code
                style={{
                  display: 'block',
                  background: '#ffffff',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  fontSize: 12,
                  fontFamily: 'monospace',
                  wordBreak: 'break-all'
                }}
              >
                {previewBaseUrl}contoh-gambar.jpg
              </code>
              {updatedAt && (
                <span style={{ display: 'block', marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                  Terakhir diperbarui: {formatUtcToWib(updatedAt)}
                </span>
              )}
            </div>

            {/* Form Actions */}
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              {!isNoticeMode && (
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={saving}
                  onClick={onClose}
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>{isNoticeMode ? 'Simpan & Aktifkan Sistem' : 'Simpan Pengaturan'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
