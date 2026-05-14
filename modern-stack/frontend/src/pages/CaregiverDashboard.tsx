import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useModal } from '../components/ModalContext';

type Tab = 'dashboard' | 'pending' | 'accepted' | 'history' | 'schedule' | 'profile';

export default function CaregiverDashboard() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [profile, setProfile] = useState<any>(null);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [acceptedBookings, setAcceptedBookings] = useState<any[]>([]);
  const [historyBookings, setHistoryBookings] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [newSchedule, setNewSchedule] = useState({ dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00' });
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', profession: '', experienceYears: '', address: '', phone: '' });
  const navigate = useNavigate();
  const { showSuccess, showError, showConfirm } = useModal();
  const userId = localStorage.getItem('userId') || '';

  useEffect(() => {
    if (!userId) { navigate('/login'); return; }
    loadProfile();
    loadPending();
  }, []);

  const loadProfile = async () => {
    try {
      const p = await api.get(`/profile/${userId}`);
      setProfile(p);
      setEditForm({ firstName: p.firstName || '', lastName: p.lastName || '', profession: p.profession || '', experienceYears: String(p.experienceYears || ''), address: p.address || '', phone: p.phone || '' });
    } catch {}
  };
  const loadPending = async () => { try { setPendingBookings(await api.get(`/bookings/caregiver/${userId}/pending`)); } catch {} };
  const loadAccepted = async () => { try { setAcceptedBookings(await api.get(`/bookings/caregiver/${userId}/accepted`)); } catch {} };
  const loadHistory = async () => { try { setHistoryBookings(await api.get(`/bookings/caregiver/${userId}/history`)); } catch {} };
  const loadSchedules = async () => { try { setSchedules(await api.get(`/schedule/${userId}`)); } catch {} };

  const handleAccept = (bookingId: string) => {
    showConfirm('Accept Booking', 'Are you sure you want to accept this booking?', async () => {
      try { await api.post(`/bookings/${bookingId}/accept`); showSuccess('Accepted', 'Booking accepted. Awaiting admin approval.'); loadPending(); } catch (e: any) { showError('Error', e.message); }
    });
  };

  const handleReject = (bookingId: string) => {
    showConfirm('Reject Booking', 'Are you sure you want to reject this booking?', async () => {
      try { await api.post(`/bookings/${bookingId}/reject`); showSuccess('Rejected', 'Booking has been rejected.'); loadPending(); } catch (e: any) { showError('Error', e.message); }
    });
  };

  const handleComplete = (bookingId: string) => {
    showConfirm('Complete Booking', 'Mark this booking as completed?', async () => {
      try { await api.post(`/bookings/${bookingId}/complete`); showSuccess('Completed', 'Booking marked as completed.'); loadAccepted(); } catch (e: any) { showError('Error', e.message); }
    });
  };

  const handleAddSchedule = async () => {
    try {
      await api.post('/schedule/add', { caregiverId: userId, ...newSchedule });
      showSuccess('Schedule Added', 'Your availability has been updated.');
      loadSchedules();
    } catch (e: any) { showError('Error', e.message); }
  };

  const handleDeleteSchedule = (id: string) => {
    showConfirm('Delete Schedule', 'Remove this availability slot?', async () => {
      try { await api.del(`/schedule/${id}`); loadSchedules(); } catch (e: any) { showError('Error', e.message); }
    });
  };

  const handleUpdateProfile = async () => {
    try {
      await api.put(`/update-profile/${userId}`, editForm);
      showSuccess('Updated', 'Profile updated successfully!');
      loadProfile();
    } catch (e: any) { showError('Error', e.message); }
  };

  const handleLogout = () => {
    showConfirm('Logout', 'Are you sure?', async () => {
      try { await api.post('/logout'); } catch {}
      localStorage.clear(); navigate('/login');
    });
  };

  const sidebarItems: { key: Tab; icon: string; label: string }[] = [
    { key: 'dashboard', icon: '📊', label: 'Dashboard' },
    { key: 'pending', icon: '⏳', label: 'Pending Requests' },
    { key: 'accepted', icon: '✅', label: 'Accepted Jobs' },
    { key: 'history', icon: '📋', label: 'Job History' },
    { key: 'schedule', icon: '🗓️', label: 'My Schedule' },
    { key: 'profile', icon: '👤', label: 'Edit Profile' },
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="page-container">
      <aside className="sidebar">
        <div className="sidebar-logo">🏥 CaregiverGO</div>
        <nav className="sidebar-nav">
          {sidebarItems.map(item => (
            <div key={item.key} className={`sidebar-item ${tab === item.key ? 'active' : ''}`}
              onClick={() => { setTab(item.key); if (item.key === 'pending') loadPending(); if (item.key === 'accepted') loadAccepted(); if (item.key === 'history') loadHistory(); if (item.key === 'schedule') loadSchedules(); }}>
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
        </nav>
        <div style={{ padding: '16px 12px' }}><button className="btn btn-ghost" style={{ width: '100%' }} onClick={handleLogout}>🚪 Sign Out</button></div>
      </aside>

      <main className="main-content fade-in">
        {tab === 'dashboard' && (
          <>
            <div className="page-header"><h1>Welcome, {profile?.firstName || 'Caregiver'} 👋</h1><p>Manage your bookings and schedule</p></div>
            <div className="stats-grid stagger">
              <div className="glass-card stat-card"><div className="stat-value">{pendingBookings.length}</div><div className="stat-label">Pending Requests</div></div>
              <div className="glass-card stat-card"><div className="stat-value">{profile?.rating?.toFixed(1) || '0.0'}</div><div className="stat-label">Your Rating</div></div>
              <div className="glass-card stat-card"><div className="stat-value">{profile?.isActive ? '✓ Active' : '⏳ Pending'}</div><div className="stat-label">Account Status</div></div>
            </div>
          </>
        )}

        {tab === 'pending' && (
          <>
            <div className="page-header"><h1>Pending Requests</h1><p>New booking requests from clients</p></div>
            <div className="stagger" style={{ display: 'grid', gap: 16 }}>
              {pendingBookings.map((b: any) => (
                <div key={b.bookingId} className="glass-card" style={{ padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontWeight: 700 }}>{b.clientName}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>📞 {b.clientPhone} · 📍 {b.clientAddress}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>📅 {new Date(b.serviceDate).toLocaleString()}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-success btn-sm" onClick={() => handleAccept(b.bookingId)}>✓ Accept</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleReject(b.bookingId)}>✕ Reject</button>
                  </div>
                </div>
              ))}
              {pendingBookings.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No pending requests</p>}
            </div>
          </>
        )}

        {tab === 'accepted' && (
          <>
            <div className="page-header"><h1>Accepted Jobs</h1><p>Your current active assignments</p></div>
            <div className="stagger" style={{ display: 'grid', gap: 16 }}>
              {acceptedBookings.map((b: any) => (
                <div key={b.bookingId} className="glass-card" style={{ padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontWeight: 700 }}>{b.clientName}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>📞 {b.clientPhone} · 📍 {b.clientAddress}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>📅 {new Date(b.serviceDate).toLocaleString()}</p>
                    <span className={`badge ${b.status === 'APPROVED_BY_ADMIN' ? 'badge-approved' : 'badge-pending'}`}>{b.status}</span>
                  </div>
                  {b.status === 'APPROVED_BY_ADMIN' && (
                    <button className="btn btn-primary btn-sm" onClick={() => handleComplete(b.bookingId)}>✓ Mark Complete</button>
                  )}
                </div>
              ))}
              {acceptedBookings.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No accepted jobs</p>}
            </div>
          </>
        )}

        {tab === 'history' && (
          <>
            <div className="page-header"><h1>Job History</h1><p>All completed and approved assignments</p></div>
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="glass-table">
                <thead><tr><th>Client</th><th>Phone</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                  {historyBookings.map((b: any) => (
                    <tr key={b.bookingId}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.clientName}</td>
                      <td>{b.clientPhone}</td>
                      <td>{new Date(b.serviceDate).toLocaleDateString()}</td>
                      <td><span className={`badge ${b.status === 'completed' ? 'badge-completed' : 'badge-approved'}`}>{b.status}</span></td>
                    </tr>
                  ))}
                  {historyBookings.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No history yet</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'schedule' && (
          <>
            <div className="page-header"><h1>My Schedule</h1><p>Manage your availability</p></div>
            <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Add Availability</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Day</label>
                  <select className="select-glass" value={newSchedule.dayOfWeek} onChange={e => setNewSchedule(p => ({ ...p, dayOfWeek: e.target.value }))}>
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Start</label>
                  <input className="input-glass" type="time" value={newSchedule.startTime} onChange={e => setNewSchedule(p => ({ ...p, startTime: e.target.value }))} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">End</label>
                  <input className="input-glass" type="time" value={newSchedule.endTime} onChange={e => setNewSchedule(p => ({ ...p, endTime: e.target.value }))} />
                </div>
                <button className="btn btn-primary" onClick={handleAddSchedule} style={{ height: 46 }}>+ Add</button>
              </div>
            </div>
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="glass-table">
                <thead><tr><th>Day</th><th>Start</th><th>End</th><th>Action</th></tr></thead>
                <tbody>
                  {schedules.map((s: any) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.dayOfWeek}</td>
                      <td>{s.startTime}</td>
                      <td>{s.endTime}</td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => handleDeleteSchedule(s.id)}>Delete</button></td>
                    </tr>
                  ))}
                  {schedules.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No schedules set</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'profile' && (
          <>
            <div className="page-header"><h1>Edit Profile</h1><p>Update your professional information</p></div>
            <div className="glass-card" style={{ padding: 32, maxWidth: 560 }}>
              <div className="form-row">
                <div className="form-group"><label className="form-label">First Name</label><input className="input-glass" value={editForm.firstName} onChange={e => setEditForm(p => ({ ...p, firstName: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Last Name</label><input className="input-glass" value={editForm.lastName} onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Profession</label><input className="input-glass" value={editForm.profession} onChange={e => setEditForm(p => ({ ...p, profession: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Experience (Years)</label><input className="input-glass" type="number" value={editForm.experienceYears} onChange={e => setEditForm(p => ({ ...p, experienceYears: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label className="form-label">Address</label><input className="input-glass" value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Phone</label><input className="input-glass" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <button className="btn btn-primary btn-lg" onClick={handleUpdateProfile} style={{ width: '100%', marginTop: 8 }}>Save Changes</button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
