import React from 'react';
import { getDownloadUrl } from '../utils/basename';

export default function PreviewModal({ asset, onClose }) {
  if (!asset) return null;

  const isImage = asset.file_type && asset.file_type.startsWith('image/');
  const isVideo = asset.file_type && asset.file_type.startsWith('video/');
  const isPdf =
    (asset.file_type && (asset.file_type === 'application/pdf' || asset.file_type.includes('pdf'))) ||
    (asset.file_name && asset.file_name.toLowerCase().endsWith('.pdf'));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content preview" onClick={(e) => e.stopPropagation()}>
        {isImage && (
          <img src={asset.file_path} alt={asset.file_name} />
        )}
        {isVideo && (
          <video controls autoPlay src={asset.file_path} />
        )}
        {isPdf && (
          <iframe
            src={asset.file_path}
            title={asset.file_name}
          />
        )}
        {!isImage && !isVideo && !isPdf && (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <p>Preview tidak didukung untuk tipe file ini.</p>
            <a
              href={getDownloadUrl(asset.id)}
              download={asset.file_name}
              className="btn-cancel"
              style={{ display: 'inline-block', padding: '8px 16px', borderRadius: 8, textDecoration: 'none' }}
            >
              Download File
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
