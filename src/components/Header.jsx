import React, { useState, useRef, useEffect } from 'react';
import { FolderOpen, Users, Database, LogOut, ChevronDown, UserCog, Sliders } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ onOpenUsersModal, onOpenProfileModal, onOpenSettingsModal }) {
  const { user, isSuperuser, canUpload, canDelete, canRename, canMove, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const getRoleLabel = () => {
    if (isSuperuser) return 'Superuser';
    if (canUpload || canDelete || canRename || canMove) return 'User';
    return 'Viewer';
  };

  const getRoleClass = () => {
    if (isSuperuser) return 'superuser';
    if (canUpload || canDelete || canRename || canMove) return 'user';
    return 'viewer';
  };

  const initialLetter = (user?.name || user?.username || 'U')[0].toUpperCase();

  return (
    <div className="header">
      <h2>
        <FolderOpen size={24} style={{ color: 'var(--text-main)' }} />
        <span>Asset Manager</span>
      </h2>

      <div className="header-actions">
        {/* Database indicator */}
        <div className="db-indicator connected" title="Database MySQL Terhubung">
          <Database size={12} />
          <span>Terhubung</span>
        </div>

        {/* User Profile Widget with Dropdown */}
        <div className="user-menu-container" ref={dropdownRef}>
          <button
            type="button"
            className={`user-profile-trigger ${dropdownOpen ? 'active' : ''}`}
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            {/* Avatar Circle with Initial Letter */}
            <div className="user-avatar-circle">
              {initialLetter}
            </div>

            {/* User Meta (Nama atas, Role bawah) */}
            <div className="user-meta-info">
              <span className="user-meta-name" title={user?.name || user?.username}>
                {user?.name || user?.username}
              </span>
              <span className="user-meta-role-text">{getRoleLabel()}</span>
            </div>

            {/* Chevron */}
            <ChevronDown
              size={14}
              className={`user-meta-chevron ${dropdownOpen ? 'rotated' : ''}`}
            />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="user-dropdown-menu">
              <div className="user-dropdown-header">
                <p className="user-dropdown-header-name">{user?.name || user?.username}</p>
                <p className="user-dropdown-header-user">@{user?.username}</p>
                <p className="user-dropdown-role-text">{getRoleLabel()}</p>
              </div>

              {/* Superuser: Kelola User */}
              {isSuperuser && (
                <button
                  type="button"
                  className="user-dropdown-item"
                  onClick={() => {
                    setDropdownOpen(false);
                    if (onOpenUsersModal) onOpenUsersModal();
                  }}
                >
                  <Users size={16} />
                  <span>Kelola User</span>
                </button>
              )}

              {/* Superuser: Pengaturan Sistem */}
              {isSuperuser && (
                <button
                  type="button"
                  className="user-dropdown-item"
                  onClick={() => {
                    setDropdownOpen(false);
                    if (onOpenSettingsModal) onOpenSettingsModal();
                  }}
                >
                  <Sliders size={16} />
                  <span>Pengaturan Sistem</span>
                </button>
              )}

              {/* Setting Profil */}
              <button
                type="button"
                className="user-dropdown-item"
                onClick={() => {
                  setDropdownOpen(false);
                  if (onOpenProfileModal) onOpenProfileModal();
                }}
              >
                <UserCog size={16} />
                <span>Setting Profil</span>
              </button>

              <div className="user-dropdown-divider" />

              {/* Logout */}
              <button
                type="button"
                className="user-dropdown-item danger"
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
              >
                <LogOut size={16} />
                <span>Keluar</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
