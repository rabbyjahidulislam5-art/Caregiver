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
  const [animationKey, setAnimationKey] = useState(0);

  const navigate = useNavigate();
  const { showSuccess, showError, showConfirm } = useModal();
  const userId = localStorage.getItem('userId') || '';

  useEffect(() => {
    if (!userId) { navigate('/login'); return; }
    loadProfile();
    loadPending();
  }, []);

  const changeTab = (newTab: Tab) => {
    setTab(newTab);
    setAnimationKey(prev => prev + 1);
    if (newTab === 'pending') loadPending();
    if (newTab === 'accepted') loadAccepted();
    if (newTab === 'history') loadHistory();
    if (newTab === 'schedule') loadSchedules();
  };

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
      try { await api.post(`/bookings/${bookingId}/accept`); showSuccess('Accepted', 'Booking accepted.'); loadPending(); }
      catch (e: any) { showError('Error', e.message); }
    });
  };

  const handleReject = (bookingId: string) => {
    showConfirm('Reject Booking', 'Are you sure you want to reject this booking?', async () => {
      try { await api.post(`/bookings/${bookingId}/reject`); showSuccess('Rejected', 'Booking has been rejected.'); loadPending(); }
      catch (e: any) { showError('Error', e.message); }
    });
  };

  const handleComplete = (bookingId: string) => {
    showConfirm('Complete Booking', 'Mark this booking as completed?', async () => {
      try { await api.post(`/bookings/${bookingId}/complete`); showSuccess('Completed', 'Booking marked as completed.'); loadAccepted(); }
      catch (e: any) { showError('Error', e.message); }
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
      try { await api.del(`/schedule/${id}`); loadSchedules(); }
      catch (e: any) { showError('Error', e.message); }
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
      localStorage.clear(); navigate('/');
    });
  };

  const sidebarItems: { key: Tab; icon: string; label: string }[] = [
    { key: 'dashboard', icon: '📊', label: 'Overview' },
    { key: 'pending',   icon: '⏳', label: 'Pending Requests' },
    { key: 'accepted',  icon: '✅', label: 'Accepted Jobs' },
    { key: 'history',   icon: '📋', label: 'Job History' },
    { key: 'schedule',  icon: '🗓️', label: 'My Schedule' },
    { key: 'profile',   icon: '👤', label: 'Edit Profile' },
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="page-container fade-in">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">🏥 <span>Caregiver Portal</span></div>
        <nav className="sidebar-nav">
          {sidebarItems.map(item => (
            <div key={item.key} className={`sidebar-item ${tab === item.key ? 'active' : ''}`} onClick={() => changeTab(item.key)}>
              <span>{item.icon}</span>
              <div className="sidebar-item-label">{item.label}</div>
              {item.key === 'pending' && pendingBookings.length > 0 && (
                <span style={{ background: 'var(--accent-red)', color: '#fff', borderRadius: 50, fontSize: 11, fontWeight: 800, padding: '2px 7px', marginLeft: 'auto' }}>{pendingBookings.length}</span>
              )}
            </div>
          ))}
        </nav>
        <div style={{ paddingTop: 16, borderTop: '1px solid var(--border-glass)' }}>
          {profile && (
            <div style={{ padding: '12px 16px', marginBottom: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15 }}>
                  {profile.firstName?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.firstName}</div>
                  <div style={{ color: profile.isActive ? 'var(--accent-green)' : 'var(--accent-amber)', fontSize: 11, fontWeight: 600 }}>{profile.isActive ? '● Active' : '● Pending'}</div>
                </div>
              </div>
            </div>
          )}
          <button className="btn btn-danger" style={{ width: '100%', borderRadius: 14 }} onClick={handleLogout}>🚪 Sign Out</button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-content" key={animationKey}>
        <div className="tab-transition">

          {/* OVERVIEW */}
          {tab === 'dashboard' && (
            <>
              <div className="page-header">
                <h1>Welcome, {profile?.firstName || 'Professional'} 👋</h1>
                <p>Manage your professional caregiving career seamlessly.</p>
              </div>
              <div className="stats-grid stagger">
                <div className="stat-card glass-card">
                  <div className="stat-value">{pendingBookings.length}</div>
                  <div className="stat-label">Pending Requests</div>
                  <div style={{ position: 'absolute', right: 20, top: 20, fontSize: 36, opacity: 0.15 }}>📩</div>
                </div>
                <div className="stat-card glass-card">
                  <div className="stat-value">{profile?.rating?.toFixed(1) || '0.0'}</div>
                  <div className="stat-label">Average Rating</div>
                  <div style={{ position: 'absolute', right: 20, top: 20, fontSize: 36, opacity: 0.15 }}>⭐</div>
                </div>
                <div className="stat-card glass-card" style={{ border: profile?.isActive ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(245,158,11,0.3)' }}>
                  <div className="stat-value" style={{ color: profile?.isActive ? '#6ee7b7' : '#fcd34d' }}>{profile?.isActive ? 'Active' : 'Pending'}</div>
                  <div className="stat-label">Account Status</div>
                  <div style={{ position: 'absolute', right: 20, top: 20, fontSize: 36, opacity: 0.15 }}>🛡️</div>
                </div>
              </div>
            </>
          )}

          {/* PENDING */}
          {tab === 'pending' && (
            <>
              <div className="page-header">
                <h1>Pending Requests</h1>
                <p>Clients are waiting for your response. Accept or reject incoming bookings.</p>
              </div>
              <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 24 }}>
                {pendingBookings.map((b: any) => (
                  <div key={b.bookingId} className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                      <div>
                        <h3 style={{ fontWeight: 800, fontSize: 19, marginBottom: 6 }}>{b.clientName}</h3>
                        <span className="badge badge-pending">⚡ Action Required</span>
                      </div>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📞</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.25)', padding: 16, borderRadius: 14, marginBottom: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[['Phone', b.clientPhone], ['Address', b.clientAddress]].map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', gap: 8, fontSize: 14 }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', minWidth: 60 }}>{k}:</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{v}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: 8, fontSize: 14 }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', minWidth: 60 }}>Date:</span>
                        <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{new Date(b.serviceDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                      <button className="btn btn-success" style={{ flex: 1 }} onClick={() => handleAccept(b.bookingId)}>✓ Accept</button>
                      <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleReject(b.bookingId)}>✕ Reject</button>
                    </div>
                  </div>
                ))}
                {pendingBookings.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 70, background: 'rgba(255,255,255,0.02)', borderRadius: 22, border: '1px dashed var(--border-glass-strong)' }}>
                    <span style={{ fontSize: 44, display: 'block', marginBottom: 14 }}>📭</span>
                    <h3 style={{ fontWeight: 700, marginBottom: 8 }}>All Caught Up</h3>
                    <p style={{ color: 'var(--text-muted)' }}>No pending requests to review.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ACCEPTED */}
          {tab === 'accepted' && (
            <>
              <div className="page-header">
                <h1>Accepted Jobs</h1>
                <p>Your ongoing assignments. Mark them complete when finished.</p>
              </div>
              <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 24 }}>
                {acceptedBookings.map((b: any) => (
                  <div key={b.bookingId} className="glass-card" style={{ padding: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                      <div>
                        <h3 style={{ fontWeight: 800, fontSize: 19, marginBottom: 6 }}>{b.clientName}</h3>
                        <span className={`badge ${b.status === 'APPROVED_BY_ADMIN' ? 'badge-approved' : 'badge-pending'}`}>
                          {b.status === 'APPROVED_BY_ADMIN' ? '✅ Ready for Service' : '⏳ Awaiting Admin'}
                        </span>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.25)', padding: 16, borderRadius: 14, marginBottom: 22, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
                      <p style={{ color: 'var(--text-secondary)' }}>📞 {b.clientPhone}</p>
                      <p style={{ color: 'var(--text-secondary)' }}>📍 {b.clientAddress}</p>
                      <p style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>📅 {new Date(b.serviceDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                    {b.status === 'APPROVED_BY_ADMIN' ? (
                      <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleComplete(b.bookingId)}>✓ Mark as Completed</button>
                    ) : (
                      <button className="btn btn-ghost" style={{ width: '100%', opacity: 0.5, cursor: 'not-allowed' }} disabled>Waiting for Admin Approval</button>
                    )}
                  </div>
                ))}
                {acceptedBookings.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 70, background: 'rgba(255,255,255,0.02)', borderRadius: 22, border: '1px dashed var(--border-glass-strong)' }}>
                    <h3 style={{ fontWeight: 700, marginBottom: 8 }}>No Accepted Jobs</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Accept requests from the pending tab.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* HISTORY */}
          {tab === 'history' && (
            <>
              <div className="page-header">
                <h1>Job History</h1>
                <p>Record of all your completed and past assignments.</p>
              </div>
              <div className="glass-table-container">
                <table className="glass-table">
                  <thead><tr><th>Client</th><th>Phone Number</th><th>Service Date</th><th>Status</th></tr></thead>
                  <tbody>
                    {historyBookings.map((b: any) => (
                      <tr key={b.bookingId}>
                        <td style={{ fontWeight: 700, color: '#fff' }}>{b.clientName}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{b.clientPhone}</td>
                        <td>{new Date(b.serviceDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</td>
                        <td><span className={`badge ${b.status === 'completed' ? 'badge-reviewed' : 'badge-approved'}`}>{b.status}</span></td>
                      </tr>
                    ))}
                    {historyBookings.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>No history to display yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* SCHEDULE */}
          {tab === 'schedule' && (
            <>
              <div className="page-header">
                <h1>My Schedule</h1>
                <p>Set the times you are available to be booked by clients.</p>
              </div>
              <div className="glass-card-static" style={{ padding: 32, marginBottom: 32 }}>
                <h3 style={{ fontWeight: 800, fontSize: 19, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>➕</span>
                  Add Availability Slot
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 18, alignItems: 'end' }}>
                  <div>
                    <label className="form-label">Day of Week</label>
                    <select className="select-glass" value={newSchedule.dayOfWeek} onChange={e => setNewSchedule(p => ({ ...p, dayOfWeek: e.target.value }))}>
                      {days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Start Time</label>
                    <input className="input-glass" type="time" value={newSchedule.startTime} onChange={e => setNewSchedule(p => ({ ...p, startTime: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">End Time</label>
                    <input className="input-glass" type="time" value={newSchedule.endTime} onChange={e => setNewSchedule(p => ({ ...p, endTime: e.target.value }))} />
                  </div>
                  <button className="btn btn-primary" onClick={handleAddSchedule} style={{ height: 50 }}>Add Slot ✨</button>
                </div>
              </div>
              <div className="glass-table-container">
                <table className="glass-table">
                  <thead><tr><th>Day</th><th>Start Time</th><th>End Time</th><th>Action</th></tr></thead>
                  <tbody>
                    {schedules.map((s: any) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 700, color: '#fff' }}>{s.dayOfWeek}</td>
                        <td style={{ color: 'var(--accent-cyan)' }}>{s.startTime}</td>
                        <td style={{ color: 'var(--accent-purple)' }}>{s.endTime}</td>
                        <td><button className="btn btn-danger btn-sm" onClick={() => handleDeleteSchedule(s.id)}>🗑️ Remove</button></td>
                      </tr>
                    ))}
                    {schedules.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>You haven't set any schedules yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* EDIT PROFILE */}
          {tab === 'profile' && (
            <>
              <div className="page-header">
                <h1>Edit Professional Profile</h1>
                <p>Keep your details updated to attract more clients.</p>
              </div>
              <div className="glass-card-static" style={{ padding: 40, maxWidth: 760 }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input className="input-glass" value={editForm.firstName} onChange={e => setEditForm(p => ({ ...p, firstName: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input className="input-glass" value={editForm.lastName} onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Profession Category</label>
                    <input className="input-glass" placeholder="e.g. Registered Nurse" value={editForm.profession} onChange={e => setEditForm(p => ({ ...p, profession: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Years of Experience</label>
                    <input className="input-glass" type="number" min="0" value={editForm.experienceYears} onChange={e => setEditForm(p => ({ ...p, experienceYears: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Present Address / Coverage Area</label>
                  <input className="input-glass" value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input className="input-glass" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <button className="btn btn-primary btn-lg" onClick={handleUpdateProfile} style={{ width: '100%', marginTop: 8 }}>
                  💾 Save Profile Changes
                </button>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
