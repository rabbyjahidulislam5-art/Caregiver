import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useModal } from '../components/ModalContext';
import AuditDashboard from '../components/AuditDashboard';

type Tab = 'dashboard' | 'users' | 'caregivers' | 'bookings' | 'complaints' | 'audit';

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [pendingCaregivers, setPendingCaregivers] = useState<any[]>([]);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [animationKey, setAnimationKey] = useState(0);

  const navigate = useNavigate();
  const { showSuccess, showError, showConfirm } = useModal();

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'admin') { navigate('/login'); return; }
    loadStats();
  }, []);

  const changeTab = (newTab: Tab) => {
    setTab(newTab);
    setAnimationKey(prev => prev + 1);
    if (newTab === 'users') loadUsers();
    if (newTab === 'caregivers') loadPendingCaregivers();
    if (newTab === 'bookings') loadPendingBookings();
    if (newTab === 'complaints') loadComplaints();
    if (newTab === 'audit') { loadAuditLogs(); loadUsers(); }
    if (newTab === 'dashboard') loadStats();
  };

  const loadStats = async () => { try { setStats(await api.get('/admin/stats')); } catch {} };
  const loadUsers = async () => { try { setUsers(await api.get('/admin/users')); } catch {} };
  const loadPendingCaregivers = async () => { try { setPendingCaregivers(await api.get('/admin/pending-caregivers')); } catch {} };
  const loadPendingBookings = async () => { try { setPendingBookings(await api.get('/admin/requests/pending')); } catch {} };
  const loadComplaints = async () => { try { setComplaints(await api.get('/admin/complaints')); } catch {} };
  const loadAuditLogs = async () => { try { setAuditLogs(await api.get('/admin/audit-logs')); } catch {} };

  const handleDeleteUser = (id: string, email: string) => {
    showConfirm('Delete User', `Permanently delete "${email}"? This cannot be undone.`, async () => {
      try { await api.del(`/admin/users/${id}`); showSuccess('Deleted', 'User removed.'); loadUsers(); loadStats(); }
      catch (e: any) { showError('Error', e.message); }
    });
  };

  const handleApproveCaregiver = async (profileId: string) => {
    try { await api.put(`/admin/approve/${profileId}`); showSuccess('Approved', 'Caregiver activated.'); loadPendingCaregivers(); }
    catch (e: any) { showError('Error', e.message); }
  };

  const handleBookingAction = (bookingId: string, action: string) => {
    showConfirm(`${action === 'approve' ? 'Approve' : 'Reject'} Booking`, `Are you sure?`, async () => {
      try { await api.post(`/admin/requests/${bookingId}/${action}`); showSuccess('Done', `Booking ${action}d.`); loadPendingBookings(); }
      catch (e: any) { showError('Error', e.message); }
    });
  };

  const handleReplyComplaint = async (id: string) => {
    const reply = replyText[id];
    if (!reply?.trim()) return showError('Empty Reply', 'Please type a reply first.');
    try {
      await api.put(`/admin/complaints/${id}/reply`, { reply });
      showSuccess('Replied', 'Your reply has been sent.');
      setReplyText(prev => ({ ...prev, [id]: '' }));
      loadComplaints();
    } catch (e: any) { showError('Error', e.message); }
  };

  const handleLogout = () => {
    showConfirm('Logout', 'Are you sure?', async () => {
      try { await api.post('/logout'); } catch {}
      localStorage.clear(); navigate('/');
    });
  };

  const sidebarItems: { key: Tab; icon: string; label: string }[] = [
    { key: 'dashboard',  icon: '📊', label: 'Platform Overview' },
    { key: 'users',      icon: '👥', label: 'Manage Users' },
    { key: 'caregivers', icon: '🩺', label: 'Caregiver Approvals' },
    { key: 'bookings',   icon: '📅', label: 'Booking Approvals' },
    { key: 'complaints', icon: '📝', label: 'Complaints Portal' },
    { key: 'audit',      icon: '🔍', label: 'Security Audit Log' },
  ];

  const getBadgeClass = (status: string) => {
    const s = status?.toUpperCase() || '';
    if (s.includes('APPROVED') || s === 'COMPLETED' || s === 'PUBLISHED') return 'badge badge-approved';
    if (s.includes('REJECT')) return 'badge badge-rejected';
    if (s === 'REVIEWED') return 'badge badge-reviewed';
    return 'badge badge-pending';
  };


  const statItems = [
    { value: stats.totalUsers || 0, label: 'Total Users', icon: '👥', color: '#3b82f6' },
    { value: stats.totalCaregivers || 0, label: 'Caregivers', icon: '🩺', color: '#10b981' },
    { value: stats.totalBookings || 0, label: 'Total Bookings', icon: '📅', color: '#8b5cf6' },
    { value: stats.totalComplaints || 0, label: 'Complaints', icon: '📝', color: '#f59e0b' },
  ];

  return (
    <div className="page-container fade-in">
      {/* SIDEBAR */}
      <aside className="sidebar" style={{ width: 300 }}>
        <div className="sidebar-logo">🛡️ <span>Admin Center</span></div>
        <nav className="sidebar-nav">
          {sidebarItems.map(item => (
            <div key={item.key} className={`sidebar-item ${tab === item.key ? 'active' : ''}`} onClick={() => changeTab(item.key)}>
              <span>{item.icon}</span>
              <div className="sidebar-item-label">{item.label}</div>
            </div>
          ))}
        </nav>
        <div style={{ paddingTop: 16, borderTop: '1px solid var(--border-glass)' }}>
          <div style={{ padding: '10px 14px', marginBottom: 12, borderRadius: 14, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <div style={{ fontSize: 11, color: 'var(--accent-red)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>Administrator</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Full platform access</div>
          </div>
          <button className="btn btn-ghost" style={{ width: '100%', borderRadius: 14, border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }} onClick={handleLogout}>🚪 Secure Sign Out</button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-content" style={{ marginLeft: 300 }} key={animationKey}>
        <div className="tab-transition">

          {/* OVERVIEW */}
          {tab === 'dashboard' && (
            <>
              <div className="page-header">
                <h1>System Overview</h1>
                <p>Real-time platform statistics and health metrics.</p>
              </div>
              <div className="stats-grid stagger">
                {statItems.map((s, i) => (
                  <div key={i} className="stat-card glass-card" style={{ borderTop: `3px solid ${s.color}22` }}>
                    <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                    <div style={{ position: 'absolute', right: 20, top: 20, fontSize: 36, opacity: 0.12 }}>{s.icon}</div>
                    <div style={{ position: 'absolute', top: -40, right: -40, width: 100, height: 100, background: s.color, filter: 'blur(50px)', opacity: 0.15, borderRadius: '50%' }} />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* MANAGE USERS */}
          {tab === 'users' && (
            <>
              <div className="page-header">
                <h1>Manage Users</h1>
                <p>View and manage all registered accounts on the platform.</p>
              </div>
              <div className="glass-table-container">
                <table className="glass-table">
                  <thead><tr><th>Full Name</th><th>Email Address</th><th>System Role</th><th>Actions</th></tr></thead>
                  <tbody>
                    {users.map((u: any) => (
                      <tr key={u.userId}>
                        <td style={{ fontWeight: 700, color: '#fff' }}>{u.firstName} {u.lastName}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td>
                          <span className={`badge ${u.role === 'admin' ? 'badge-reviewed' : u.role === 'caregiver' ? 'badge-approved' : 'badge-pending'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          {u.role !== 'admin' && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u.userId, u.email)}>🗑️ Delete</button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>No users found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* CAREGIVER APPROVALS */}
          {tab === 'caregivers' && (
            <>
              <div className="page-header">
                <h1>Caregiver Approvals</h1>
                <p>Review and verify pending professional caregiver registrations.</p>
              </div>
              <div className="stagger" style={{ display: 'grid', gap: 20 }}>
                {pendingCaregivers.map((c: any) => (
                  <div key={c.profileId} className="glass-card" style={{ padding: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
                    <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                      <div style={{ width: 60, height: 60, borderRadius: 20, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, flexShrink: 0 }}>
                        {c.firstName?.[0] || '👩‍⚕️'}
                      </div>
                      <div>
                        <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 6 }}>{c.firstName} {c.lastName}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                          <span style={{ color: 'var(--accent-cyan)' }}>{c.email}</span>
                          {' · '}{c.profession || 'N/A'}
                          {' · '}{c.experienceYears || 0} yrs exp.
                        </p>
                      </div>
                    </div>
                    <button className="btn btn-success btn-lg" onClick={() => handleApproveCaregiver(c.profileId)}>✓ Approve Profile</button>
                  </div>
                ))}
                {pendingCaregivers.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 80, background: 'rgba(255,255,255,0.02)', borderRadius: 22, border: '1px dashed var(--border-glass-strong)' }}>
                    <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>🎉</span>
                    <h3 style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>All clear!</h3>
                    <p style={{ color: 'var(--text-muted)' }}>No pending caregiver approvals right now.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* BOOKING APPROVALS */}
          {tab === 'bookings' && (
            <>
              <div className="page-header">
                <h1>Booking Approvals</h1>
                <p>Review booking matches between clients and caregivers.</p>
              </div>
              <div className="stagger" style={{ display: 'grid', gap: 20 }}>
                {pendingBookings.map((b: any) => (
                  <div key={b.bookingId} className="glass-card" style={{ padding: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                          <h3 style={{ fontWeight: 800, fontSize: 19, color: 'var(--accent-cyan)' }}>{b.clientName}</h3>
                          <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>→</span>
                          <h3 style={{ fontWeight: 800, fontSize: 19, color: 'var(--accent-purple)' }}>{b.caregiverName}</h3>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 10 }}>
                          📅 {new Date(b.serviceDate).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}
                        </p>
                        <span className={getBadgeClass(b.status)}>{b.status}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn btn-success" onClick={() => handleBookingAction(b.bookingId, 'approve')}>✓ Approve</button>
                        <button className="btn btn-danger" onClick={() => handleBookingAction(b.bookingId, 'reject')}>✕ Reject</button>
                      </div>
                    </div>
                  </div>
                ))}
                {pendingBookings.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 80, background: 'rgba(255,255,255,0.02)', borderRadius: 22, border: '1px dashed var(--border-glass-strong)' }}>
                    <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>✅</span>
                    <h3 style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Queue is empty</h3>
                    <p style={{ color: 'var(--text-muted)' }}>No pending booking approvals.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* COMPLAINTS */}
          {tab === 'complaints' && (
            <>
              <div className="page-header">
                <h1>Complaints Management</h1>
                <p>Resolve disputes and answer client concerns to maintain platform quality.</p>
              </div>
              <div className="stagger" style={{ display: 'grid', gap: 22 }}>
                {complaints.map((c: any) => (
                  <div key={c.id} className="glass-card-static" style={{ padding: 30, borderRadius: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <h3 style={{ fontWeight: 800, fontSize: 19, marginBottom: 6 }}>Ticket #{String(c.id).slice(0, 8)}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                          Filed by <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{c.clientName}</span>
                          {' against '}
                          <span style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>{c.caregiverName}</span>
                        </p>
                      </div>
                      <span className={getBadgeClass(c.status)}>{c.status}</span>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 14, padding: 18, marginBottom: 18, border: '1px solid rgba(255,255,255,0.04)' }}>
                      <strong style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 8, fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase' }}>Complaint:</strong>
                      <p style={{ fontSize: 15, lineHeight: 1.65, color: '#fff' }}>"{c.description}"</p>
                    </div>
                    {c.adminReply ? (
                      <div style={{ background: 'rgba(16,185,129,0.06)', borderRadius: 14, padding: 18, border: '1px solid rgba(16,185,129,0.2)' }}>
                        <p style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 800, marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>Your Resolution:</p>
                        <p style={{ fontSize: 15, color: '#fff', lineHeight: 1.6 }}>{c.adminReply}</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 14 }}>
                        <input className="input-glass" placeholder="Type your official resolution…" value={replyText[c.id] || ''} onChange={e => setReplyText(prev => ({ ...prev, [c.id]: e.target.value }))} style={{ flex: 1 }} />
                        <button className="btn btn-primary" onClick={() => handleReplyComplaint(c.id)}>Send ✉️</button>
                      </div>
                    )}
                  </div>
                ))}
                {complaints.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 80, background: 'rgba(255,255,255,0.02)', borderRadius: 22, border: '1px dashed var(--border-glass-strong)' }}>
                    <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>🕊️</span>
                    <h3 style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Peace and Quiet</h3>
                    <p style={{ color: 'var(--text-muted)' }}>No complaints have been filed recently.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* AUDIT LOG */}
          {tab === 'audit' && (
            <>
              <div className="page-header">
                <h1>Security Audit Log</h1>
                <p>Complete historical trail of all significant system actions.</p>
              </div>
              <div style={{ marginTop: 20 }}>
                <AuditDashboard users={users} auditLogs={auditLogs} />
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
