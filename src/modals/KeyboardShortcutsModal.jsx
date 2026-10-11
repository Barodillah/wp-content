import React from 'react';
import { Keyboard, X } from 'lucide-react';

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcutSections = [
    {
      title: 'Global & Batal',
      items: [
        { keys: ['Esc'], desc: 'Tutup modal / Batal pilih / Reset search' },
        { keys: ['/'], orKeys: ['Ctrl', 'K'], desc: 'Fokus ke kotak pencarian' },
        { keys: ['?'], desc: 'Buka panduan pintasan keyboard ini' }
      ]
    },
    {
      title: 'Navigasi Folder',
      items: [
        { keys: ['Backspace'], orKeys: ['Alt', '↑'], desc: 'Kembali ke folder induk (naik 1 level)' },
        { keys: ['Alt', 'H'], desc: 'Kembali ke Direktori Utama (Home)' }
      ]
    },
    {
      title: 'Mode Seleksi & Aksi File',
      items: [
        { keys: ['S'], desc: 'Aktifkan / Matikan mode pilih file' },
        { keys: ['Ctrl', 'A'], desc: 'Pilih semua / Batalkan semua file' },
        { keys: ['Shift', 'N'], desc: 'Buat folder baru' },
        { keys: ['Space'], desc: 'Pratinjau file (Quick Look preview)' },
        { keys: ['M'], desc: 'Pindahkan file terpilih' },
        { keys: ['R'], orKeys: ['F2'], desc: 'Ganti nama file terpilih' },
        { keys: ['D'], desc: 'Unduh file terpilih' },
        { keys: ['Del'], desc: 'Hapus file terpilih' }
      ]
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 560, width: '92%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Keyboard size={22} style={{ color: '#18181b' }} />
            <h3 style={{ margin: 0, fontSize: 18 }}>Pintasan Keyboard (Shortcuts)</h3>
          </div>
          <button
            type="button"
            className="btn-cancel"
            onClick={onClose}
            style={{ padding: 6, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Tutup (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', paddingRight: 4 }}>
          {shortcutSections.map((sec, idx) => (
            <div key={idx} style={{ marginBottom: 20 }}>
              <h4
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.5px',
                  marginBottom: 10,
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: 4
                }}
              >
                {sec.title}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sec.items.map((it, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      padding: '4px 0'
                    }}
                  >
                    <span style={{ color: 'var(--text-main)' }}>{it.desc}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span className="kbd-combo">
                        {it.keys.map((k, ki) => (
                          <React.Fragment key={ki}>
                            <kbd className="kbd-badge">{k}</kbd>
                            {ki < it.keys.length - 1 && <span style={{ fontSize: 11, color: '#a1a1aa' }}>+</span>}
                          </React.Fragment>
                        ))}
                      </span>
                      {it.orKeys && (
                        <>
                          <span style={{ fontSize: 11, color: '#a1a1aa' }}>/</span>
                          <span className="kbd-combo">
                            {it.orKeys.map((k, ki) => (
                              <React.Fragment key={ki}>
                                <kbd className="kbd-badge">{k}</kbd>
                                {ki < it.orKeys.length - 1 && <span style={{ fontSize: 11, color: '#a1a1aa' }}>+</span>}
                              </React.Fragment>
                            ))}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
            Tekan <kbd className="kbd-badge">Esc</kbd> untuk menutup jendela ini.
          </p>
        </div>
      </div>
    </div>
  );
}
