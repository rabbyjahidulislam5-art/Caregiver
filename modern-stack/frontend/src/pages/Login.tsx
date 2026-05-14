import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useModal } from '../components/ModalContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showError } = useModal();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post('/login', { email, password });
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('role', data.role);
      localStorage.setItem('token', data.token);

      if (data.role === 'admin') navigate('/admin');
      else if (data.role === 'caregiver') navigate('/caregiver');
      else navigate('/client');
    } catch (err: any) {
      showError('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Back to Home Button */}
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'fixed', top: 20, left: 24, zIndex: 100,
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 50, padding: '10px 18px',
          color: 'rgba(255,255,255,0.85)', cursor: 'pointer',
          fontSize: 14, fontWeight: 600,
          backdropFilter: 'blur(12px)',
          transition: 'all 0.25s ease',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.15)';
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.4)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)';
        }}
      >
        ← Back to Home
      </button>

      <form className="auth-card glass-card" onSubmit={handleLogin}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏥</div>
        </div>
        <h1 className="auth-title">CaregiverGO</h1>
        <p className="auth-subtitle">Sign in to your account</p>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            className="input-glass"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            id="login-email"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="input-glass"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            id="login-password"
          />
        </div>

        <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }} id="login-submit">
          {loading ? 'Signing in...' : 'Sign In →'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-secondary)', fontSize: 14 }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>Register Free</Link>
        </p>
      </form>
    </div>
  );
}
