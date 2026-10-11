import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, LogIn, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Username atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        marginTop: 80,
        maxWidth: 400,
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: '36px 30px',
        borderRadius: 16,
        background: 'var(--box-bg)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
      }}
    >
      <h2
        style={{
          marginTop: 0,
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10
        }}
      >
        <ShieldCheck size={24} style={{ color: 'var(--text-main)' }} />
        <span>Masuk</span>
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, margin: '0 0 20px' }}>
        Masukkan username dan password Anda
      </p>

      {error && (
        <div
          style={{
            textAlign: 'center',
            background: '#fee2e2',
            color: '#b91c1c',
            padding: 10,
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 500
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            Username
          </label>
          <input
            type="text"
            placeholder="Masukkan username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            Password
          </label>
          <input
            type="password"
            placeholder="Masukkan password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', justifyContent: 'center', padding: 12, marginTop: 6 }}
        >
          {loading ? (
            <Loader size={16} className="spin" />
          ) : (
            <>
              <LogIn size={16} />
              <span>Masuk</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
