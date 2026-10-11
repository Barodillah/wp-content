import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, ClipboardPaste, X, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { api } from '../services/api';

export default function HeroUpload({ currentFolderId, onUploadSuccess }) {
  const { canUpload } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    if (!canUpload) return;

    const handleDragEnter = (e) => {
      e.preventDefault();
      dragCounterRef.current++;
      setIsDragging(true);
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      dragCounterRef.current--;
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setIsDragging(false);
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        setDroppedFiles(Array.from(files));
      } else {
        setIsDragging(false);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [canUpload]);

  if (!canUpload) return null;

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    showToast(`Mengunggah ${files.length} file...`, 'info');
    try {
      await api.uploadFiles(files, currentFolderId);
      showToast('File berhasil diunggah!', 'success');
      onUploadSuccess();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePasteUrl = async (e) => {
    e.stopPropagation();
    try {
      const text = await navigator.clipboard.readText();
      if (!text || (!text.startsWith('http://') && !text.startsWith('https://'))) {
        showToast('Clipboard tidak berisi URL yang valid (harus http/https)', 'error');
        return;
      }
      showToast('Mengambil file dari tautan...', 'info');
      await api.uploadUrl(text, currentFolderId);
      showToast('Asset berhasil ditarik dari tautan!', 'success');
      onUploadSuccess();
    } catch (err) {
      showToast('Tidak dapat mengakses clipboard atau URL gagal ditarik', 'error');
    }
  };

  const handleConfirmDrop = async () => {
    if (!droppedFiles || droppedFiles.length === 0) return;
    setIsUploading(true);
    try {
      await api.uploadFiles(droppedFiles, currentFolderId);
      showToast('File berhasil diunggah via drag & drop!', 'success');
      setDroppedFiles(null);
      setIsDragging(false);
      onUploadSuccess();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveDroppedFile = (index) => {
    if (!droppedFiles) return;
    const updated = droppedFiles.filter((_, i) => i !== index);
    if (updated.length === 0) {
      setDroppedFiles(null);
      setIsDragging(false);
    } else {
      setDroppedFiles(updated);
    }
  };

  const handleCancelDrop = () => {
    setDroppedFiles(null);
    setIsDragging(false);
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div
        className="hero-upload"
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
      >
        <UploadCloud size={48} style={{ color: 'var(--text-muted)' }} />
        <h3>Seret & Lepas file ke mana saja</h3>
        <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 6, margin: 0 }}>
          <span>Atau klik area ini untuk memilih file. Anda juga dapat</span>
          <button
            type="button"
            className="btn-text"
            onClick={handlePasteUrl}
            style={{ marginLeft: 2 }}
          >
            <ClipboardPaste size={14} style={{ flexShrink: 0 }} />
            <span>Tempel Tautan (Paste URL)</span>
          </button>
        </p>
      </div>

      {/* Fullscreen Drag Overlay */}
      {(isDragging || droppedFiles) && (
        <div className="dropzone-overlay">
          {!droppedFiles ? (
            <div className="drop-content">
              <UploadCloud size={64} style={{ color: 'white' }} />
              <h3 style={{ margin: '16px 0 8px', fontSize: 20 }}>Lepas file di sini</h3>
              <p style={{ margin: 0, opacity: 0.7 }}>File akan diunggah ke Asset Manager</p>
            </div>
          ) : (
            <div className="drop-preview">
              {isUploading ? (
                <div style={{ color: 'white' }}>
                  <Loader size={48} className="spin" style={{ margin: '0 auto 16px' }} />
                  <h3>Mengunggah...</h3>
                </div>
              ) : (
                <>
                  <div className="drop-file-list">
                    {droppedFiles.map((file, idx) => (
                      <div key={idx} className="drop-file-item">
                        <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
                          <strong>{file.name}</strong>
                          <br />
                          <small>{(file.size / 1024).toFixed(1)} KB</small>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDroppedFile(idx)}
                          style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5', padding: 6, borderRadius: 6 }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={handleCancelDrop}
                    >
                      Batal Semua
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDrop}
                      style={{ background: '#2563eb' }}
                    >
                      Upload {droppedFiles.length} File
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
