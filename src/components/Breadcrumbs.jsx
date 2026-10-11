import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumbs({ breadcrumbs, onNavigate, searchQuery, onClearSearch }) {
  if (searchQuery) {
    return (
      <div className="breadcrumbs">
        <span>Hasil Pencarian: "{searchQuery}"</span>
        <button
          type="button"
          className="btn-text"
          style={{ marginLeft: 8 }}
          onClick={onClearSearch}
        >
          Tutup
        </button>
      </div>
    );
  }

  return (
    <div className="breadcrumbs">
      <span
        style={{ cursor: 'pointer', color: 'var(--text-main)', fontWeight: 500 }}
        onClick={() => onNavigate(null)}
      >
        Home
      </span>

      {breadcrumbs && breadcrumbs.map((b) => (
        <React.Fragment key={b.id}>
          <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
          <span
            style={{ cursor: 'pointer', color: 'var(--text-main)', fontWeight: 500 }}
            onClick={() => onNavigate(b.id)}
          >
            {b.name}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}
