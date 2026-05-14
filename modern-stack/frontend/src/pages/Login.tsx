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
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-secondary)', fontSize: 14 }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>Register</Link>
        </p>
      </form>
    </div>
  );
}
