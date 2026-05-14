import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useModal } from '../components/ModalContext';

export default function Register() {
  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '', role: 'client',
    firstName: '', lastName: '', phone: '', bloodGroup: '',
    profession: '', experienceYears: '', presentAddress: '', permanentAddress: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showSuccess, showError } = useModal();

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const validatePassword = (pw: string) => {
    if (pw.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pw)) return 'Password must contain an uppercase letter';
    if (!/[a-z]/.test(pw)) return 'Password must contain a lowercase letter';
    if (!/[0-9]/.test(pw)) return 'Password must contain a number';
    if (!/[@$!%*?&]/.test(pw)) return 'Password must contain a special character (@$!%*?&)';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pwError = validatePassword(form.password);
    if (pwError) return showError('Weak Password', pwError);
    if (form.password !== form.confirmPassword) return showError('Mismatch', 'Passwords do not match');

    setLoading(true);
    try {
      await api.post('/register', form);
      showSuccess('Account Created!', 'You can now log in with your credentials.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      showError('Registration Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Animated Background Blobs */}
      <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '40vw', height: '40vw', background: 'var(--gradient-primary)', filter: 'blur(100px)', opacity: 0.15, borderRadius: '50%', animation: 'bgDrift 15s infinite ease-in-out alternate-reverse', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '40vw', height: '40vw', background: 'var(--gradient-secondary)', filter: 'blur(100px)', opacity: 0.15, borderRadius: '50%', animation: 'bgDrift 20s infinite ease-in-out alternate', pointerEvents: 'none' }} />

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
      <form className="auth-card glass-card" onSubmit={handleSubmit} style={{ maxWidth: 560, position: 'relative', zIndex: 10, animation: 'pageEnter 0.6s cubic-bezier(0.2,0.8,0.2,1) forwards' }}>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join CaregiverGO today</p>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input className="input-glass" placeholder="John" value={form.firstName} onChange={set('firstName')} required id="reg-first-name" />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input className="input-glass" placeholder="Doe" value={form.lastName} onChange={set('lastName')} required id="reg-last-name" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="input-glass" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required id="reg-email" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="input-glass" type="password" placeholder="Min 8 chars, A-z, 0-9, @!#" value={form.password} onChange={set('password')} required id="reg-password" />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input className="input-glass" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={set('confirmPassword')} required id="reg-confirm-password" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="select-glass" value={form.role} onChange={set('role')} id="reg-role">
              <option value="client">Client</option>
              <option value="caregiver">Caregiver</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="input-glass" placeholder="+880 ..." value={form.phone} onChange={set('phone')} id="reg-phone" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Blood Group</label>
            <select className="select-glass" value={form.bloodGroup} onChange={set('bloodGroup')} id="reg-blood-group">
              <option value="">Select</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Present Address</label>
            <input className="input-glass" placeholder="Your address" value={form.presentAddress} onChange={set('presentAddress')} id="reg-address" />
          </div>
        </div>

        {form.role === 'caregiver' && (
          <div className="form-row fade-in">
            <div className="form-group">
              <label className="form-label">Profession</label>
              <input className="input-glass" placeholder="e.g. Nurse, Therapist" value={form.profession} onChange={set('profession')} id="reg-profession" />
            </div>
            <div className="form-group">
              <label className="form-label">Experience (Years)</label>
              <input className="input-glass" type="number" placeholder="0" value={form.experienceYears} onChange={set('experienceYears')} id="reg-experience" />
            </div>
          </div>
        )}

        <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', marginTop: 12 }} id="reg-submit">
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-secondary)', fontSize: 14 }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
        </p>
      </form>
    </div>
  );
}
