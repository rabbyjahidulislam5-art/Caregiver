import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useModal } from '../components/ModalContext';

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
  const navigate = useNavigate();
  const { showSuccess, showError, showConfirm } = useModal();

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'admin') { navigate('/login'); return; }
    loadStats();
  }, []);

  const loadStats = async () => { try { setStats(await api.get('/admin/stats')); } catch {} };
  const loadUsers = async () => { try { setUsers(await api.get('/admin/users')); } catch {} };
  const loadPendingCaregivers = async () => { try { setPendingCaregivers(await api.get('/admin/pending-caregivers')); } catch {} };
  const loadPendingBookings = async () => { try { setPendingBookings(await api.get('/admin/requests/pending')); } catch {} };
  const loadComplaints = async () => { try { setComplaints(await api.get('/admin/complaints')); } catch {} };
  const loadAuditLogs = async () => { try { setAuditLogs(await api.get('/admin/audit-logs')); } catch {} };

  const handleDeleteUser = (id: string, email: string) => {
    showConfirm('Delete User', `Permanently delete user "${email}"? This cannot be undone.`, async () => {
      try { await api.del(`/admin/users/${id}`); showSuccess('Deleted', 'User removed from the system.'); loadUsers(); loadStats(); } catch (e: any) { showError('Error', e.message); }
    });
  };

  const handleApproveCaregiver = async (profileId: string) => {
    try { await api.put(`/admin/approve/${profileId}`); showSuccess('Approved', 'Caregiver activated.'); loadPendingCaregivers(); } catch (e: any) { showError('Error', e.message); }
  };

  const handleBookingAction = (bookingId: string, action: string) => {
    showConfirm(`${action === 'approve' ? 'Approve' : 'Reject'} Booking`, `Are you sure you want to ${action} this booking?`, async () => {
      try { await api.post(`/admin/requests/${bookingId}/${action}`); showSuccess('Done', `Booking ${action}d.`); loadPendingBookings(); } catch (e: any) { showError('Error', e.message); }
    });
  };

  const handleReplyComplaint = async (id: string) => {
    const reply = replyText[id];
    if (!reply?.trim()) return showError('Empty Reply', 'Please type a reply first.');
    try {
      await api.put(`/admin/complaints/${id}/reply`, { reply });
      showSuccess('Replied', 'Your reply has been sent to the client.');
      setReplyText(prev => ({ ...prev, [id]: '' }));
      loadComplaints();
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
    { key: 'users', icon: '👥', label: 'Manage Users' },
    { key: 'caregivers', icon: '🩺', label: 'Caregiver Approvals' },
    { key: 'bookings', icon: '📅', label: 'Booking Approvals' },
    { key: 'complaints', icon: '📝', label: 'Complaints' },
    { key: 'audit', icon: '🔍', label: 'Activity Log' },
  ];

  const getBadgeClass = (status: string) => {
    const s = status?.toUpperCase() || '';
    if (s.includes('APPROVED') || s === 'COMPLETED' || s === 'PUBLISHED') return 'badge badge-approved';
    if (s.includes('REJECT')) return 'badge badge-rejected';
    if (s === 'REVIEWED') return 'badge badge-reviewed';
    return 'badge badge-pending';
  };

  const getActionColor = (action: string) => {
    if (action.includes('LOGIN')) return 'var(--accent-green)';
    if (action.includes('LOGOUT')) return 'var(--accent-amber)';
    if (action.includes('DELETE')) return 'var(--accent-red)';
    if (action.includes('APPROVED') || action.includes('REGISTER')) return 'var(--accent-cyan)';
    return 'var(--accent-blue)';
  };

  return (
    <div className="page-container">
      <aside className="sidebar">
        <div className="sidebar-logo">🛡️ Admin Panel</div>
        <nav className="sidebar-nav">
          {sidebarItems.map(item => (
            <div key={item.key} className={`sidebar-item ${tab === item.key ? 'active' : ''}`}
              onClick={() => {
                setTab(item.key);
                if (item.key === 'users') loadUsers();
                if (item.key === 'caregivers') loadPendingCaregivers();
                if (item.key === 'bookings') loadPendingBookings();
                if (item.key === 'complaints') loadComplaints();
                if (item.key === 'audit') loadAuditLogs();
                if (item.key === 'dashboard') loadStats();
              }}>
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
        </nav>
        <div style={{ padding: '16px 12px' }}><button className="btn btn-ghost" style={{ width: '100%' }} onClick={handleLogout}>🚪 Sign Out</button></div>
      </aside>

      <main className="main-content fade-in">
        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <>
            <div className="page-header"><h1>System Overview</h1><p>Real-time platform statistics</p></div>
            <div className="stats-grid stagger">
              <div className="glass-card stat-card"><div className="stat-value">{stats.totalUsers || 0}</div><div className="stat-label">Total Users</div></div>
              <div className="glass-card stat-card"><div className="stat-value">{stats.totalCaregivers || 0}</div><div className="stat-label">Caregivers</div></div>
              <div className="glass-card stat-card"><div className="stat-value">{stats.totalBookings || 0}</div><div className="stat-label">Total Bookings</div></div>
              <div className="glass-card stat-card"><div className="stat-value">{stats.totalComplaints || 0}</div><div className="stat-label">Complaints</div></div>
            </div>
          </>
        )}

        {/* MANAGE USERS */}
        {tab === 'users' && (
          <>
            <div className="page-header"><h1>Manage Users</h1><p>View and manage all registered users</p></div>
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="glass-table">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr></thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.userId}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.firstName} {u.lastName}</td>
                      <td>{u.email}</td>
                      <td><span className={`badge ${u.role === 'admin' ? 'badge-reviewed' : u.role === 'caregiver' ? 'badge-approved' : 'badge-pending'}`}>{u.role}</span></td>
                      <td>
                        {u.role !== 'admin' && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u.userId, u.email)}>Delete</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* CAREGIVER APPROVALS */}
        {tab === 'caregivers' && (
          <>
            <div className="page-header"><h1>Caregiver Approvals</h1><p>Pending caregiver registrations</p></div>
            <div className="stagger" style={{ display: 'grid', gap: 16 }}>
              {pendingCaregivers.map((c: any) => (
                <div key={c.profileId} className="glass-card" style={{ padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontWeight: 700 }}>{c.firstName} {c.lastName}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>✉️ {c.email} · 🔧 {c.profession || 'N/A'} · ⏱️ {c.experienceYears || 0} yrs</p>
                  </div>
                  <button className="btn btn-success btn-sm" onClick={() => handleApproveCaregiver(c.profileId)}>✓ Approve</button>
                </div>
              ))}
              {pendingCaregivers.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No pending approvals</p>}
            </div>
          </>
        )}

        {/* BOOKING APPROVALS */}
        {tab === 'bookings' && (
          <>
            <div className="page-header"><h1>Booking Approvals</h1><p>Review and approve booking requests</p></div>
            <div className="stagger" style={{ display: 'grid', gap: 16 }}>
              {pendingBookings.map((b: any) => (
                <div key={b.bookingId} className="glass-card" style={{ padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontWeight: 700 }}>{b.clientName} → {b.caregiverName}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>📅 {new Date(b.serviceDate).toLocaleString()}</p>
                    <span className={getBadgeClass(b.status)}>{b.status}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-success btn-sm" onClick={() => handleBookingAction(b.bookingId, 'approve')}>✓ Approve</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleBookingAction(b.bookingId, 'reject')}>✕ Reject</button>
                  </div>
                </div>
              ))}
              {pendingBookings.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No pending bookings</p>}
            </div>
          </>
        )}

        {/* COMPLAINTS */}
        {tab === 'complaints' && (
          <>
            <div className="page-header"><h1>Complaints Management</h1><p>Review and respond to user complaints</p></div>
            <div className="stagger" style={{ display: 'grid', gap: 16 }}>
              {complaints.map((c: any) => (
                <div key={c.id} className="glass-card" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontWeight: 700 }}>Complaint #{String(c.id).slice(0, 8)}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        Client: <span style={{ color: 'var(--accent-cyan)' }}>{c.clientName}</span> ({c.clientEmail}) →
                        Caregiver: <span style={{ color: 'var(--accent-purple)' }}>{c.caregiverName}</span>
                      </p>
                    </div>
                    <span className={getBadgeClass(c.status)}>{c.status}</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid var(--border-glass)' }}>
                    <p style={{ fontSize: 14, lineHeight: 1.6 }}>{c.description}</p>
                  </div>
                  {c.adminReply ? (
                    <div style={{ background: 'rgba(16,185,129,0.05)', borderRadius: 12, padding: 16, border: '1px solid rgba(16,185,129,0.2)' }}>
                      <p style={{ fontSize: 12, color: 'var(--accent-green)', fontWeight: 600, marginBottom: 4 }}>ADMIN REPLY</p>
                      <p style={{ fontSize: 14 }}>{c.adminReply}</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <input className="input-glass" placeholder="Type your reply..." value={replyText[c.id] || ''} onChange={e => setReplyText(prev => ({ ...prev, [c.id]: e.target.value }))} style={{ flex: 1 }} />
                      <button className="btn btn-primary btn-sm" onClick={() => handleReplyComplaint(c.id)}>Reply</button>
                    </div>
                  )}
                </div>
              ))}
              {complaints.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No complaints</p>}
            </div>
          </>
        )}

        {/* AUDIT LOG — Activity Trail */}
        {tab === 'audit' && (
          <>
            <div className="page-header"><h1>Activity Log</h1><p>Complete audit trail of all system actions</p></div>
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="glass-table">
                <thead><tr><th>Time</th><th>Action</th><th>User</th><th>Details</th></tr></thead>
                <tbody>
                  {auditLogs.map((log: any) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString()}</td>
                      <td>
                        <span style={{ color: getActionColor(log.action), fontWeight: 700, fontSize: 13, fontFamily: 'monospace' }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{log.user?.email || 'System'}</td>
                      <td style={{ fontSize: 13, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.details || '—'}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No activity logged yet</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
