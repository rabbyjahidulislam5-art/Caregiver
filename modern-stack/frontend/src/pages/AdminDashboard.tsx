import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useModal } from '../components/ModalContext';
import AuditDashboard from '../components/AuditDashboard';

type Tab = 'dashboard' | 'users' | 'caregivers' | 'bookings' | 'complaints' | 'audit' | 'notifications';

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [pendingCaregivers, setPendingCaregivers] = useState<any[]>([]);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [animationKey, setAnimationKey] = useState(0);
  
  const [userTabLevel, setUserTabLevel] = useState<1 | 2>(1);
  const [selectedUserCategory, setSelectedUserCategory] = useState<string>('');
  const [selectedUserDetail, setSelectedUserDetail] = useState<any>(null);

  const navigate = useNavigate();
  const { showSuccess, showError, showConfirm } = useModal();

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'admin') { navigate('/login'); return; }
    loadStats();
    loadNotifications();
  }, []);

  const changeTab = (newTab: Tab) => {
    setTab(newTab);
    setAnimationKey(prev => prev + 1);
    setUserTabLevel(1);
    setSelectedUserCategory('');
    if (newTab === 'users') loadUsers();
    if (newTab === 'caregivers') loadPendingCaregivers();
    if (newTab === 'bookings') loadPendingBookings();
    if (newTab === 'complaints') loadComplaints();
    if (newTab === 'audit') { loadAuditLogs(); loadUsers(); }
    if (newTab === 'dashboard') loadStats();
    if (newTab === 'notifications') loadNotifications();
  };

  const loadStats = async () => { try { setStats(await api.get('/admin/stats')); } catch {} };
  const loadUsers = async () => { try { setUsers(await api.get('/admin/users')); } catch {} };
  const loadPendingCaregivers = async () => { try { setPendingCaregivers(await api.get('/admin/pending-caregivers')); } catch {} };
  const loadPendingBookings = async () => { try { setPendingBookings(await api.get('/admin/requests/pending')); } catch {} };
  const loadComplaints = async () => { try { setComplaints(await api.get('/admin/complaints')); } catch {} };
  const loadAuditLogs = async () => { try { setAuditLogs(await api.get('/admin/audit-logs')); } catch {} };
  const loadNotifications = async () => { try { setNotifications(await api.get('/notifications')); } catch {} };
  const markNotificationRead = async (id: string) => { try { await api.put(`/notifications/${id}/read`); loadNotifications(); } catch {} };

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

  const handleRejectCaregiver = async (profileId: string) => {
    showConfirm('Reject KYC', 'Are you sure you want to reject this profile?', async () => {
      try { await api.put(`/admin/reject/${profileId}`); showSuccess('Rejected', 'Caregiver KYC rejected.'); loadPendingCaregivers(); }
      catch (e: any) { showError('Error', e.message); }
    });
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
    { key: 'notifications', icon: '🔔', label: 'System Alerts' },
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
                <div className="stat-card glass-card" onClick={() => changeTab('notifications')} style={{ cursor: 'pointer', borderTop: '3px solid #f43f5e22' }}>
                  <div className="stat-value" style={{ color: '#f43f5e' }}>{notifications.filter(n => !n.isRead).length}</div>
                  <div className="stat-label">Unread Alerts</div>
                  <div style={{ position: 'absolute', right: 20, top: 20, fontSize: 36, opacity: 0.12 }}>🔔</div>
                  <div style={{ position: 'absolute', top: -40, right: -40, width: 100, height: 100, background: '#f43f5e', filter: 'blur(50px)', opacity: 0.15, borderRadius: '50%' }} />
                </div>
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
              {userTabLevel === 1 && (
                <div style={{ animation: 'fadeScale 0.4s ease-out' }}>
                  <div className="page-header">
                    <h1>Manage Users</h1>
                    <p>Select a category to view and manage registered accounts.</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
                    {[
                      { key: 'Clients', icon: '👤', count: users.filter(u => u.role === 'client' || u.role === 'user').length, color: '#3b82f6', bg: 'linear-gradient(135deg,#3b82f6,#2563eb)' },
                      { key: 'Caregivers', icon: '🩺', count: users.filter(u => u.role === 'caregiver').length, color: '#10b981', bg: 'linear-gradient(135deg,#10b981,#059669)' },
                      { key: 'Admins', icon: '🛡️', count: users.filter(u => u.role === 'admin').length, color: '#8b5cf6', bg: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
                    ].map(card => (
                      <div key={card.key} onClick={() => { setSelectedUserCategory(card.key); setUserTabLevel(2); }}
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 30, cursor: 'pointer', transition: 'all 0.25s', position: 'relative', overflow: 'hidden' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 20px 40px ${card.color}33`; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: card.bg, borderRadius: '50%', opacity: 0.15, filter: 'blur(10px)' }} />
                        <div style={{ fontSize: 40, marginBottom: 16 }}>{card.icon}</div>
                        <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#fff' }}>{card.key}</h3>
                        <div style={{ marginTop: 8, fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>{card.count} Active Accounts</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {userTabLevel === 2 && (
                <div style={{ animation: 'fadeScale 0.4s ease-out' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
                    <button onClick={() => { setUserTabLevel(1); setSelectedUserCategory(''); }} style={{ padding: '8px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>← Back</button>
                    <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: 0 }}>{selectedUserCategory} Directory</h2>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {users.filter(u => selectedUserCategory === 'Clients' ? (u.role === 'client' || u.role === 'user') : selectedUserCategory === 'Caregivers' ? u.role === 'caregiver' : u.role === 'admin').map((u: any) => (
                      <div key={u.userId} onClick={() => setSelectedUserDetail(u)}
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                        <div style={{ width: 50, height: 50, borderRadius: '50%', background: u.role === 'admin' ? 'linear-gradient(135deg,#8b5cf6,#7c3aed)' : u.role === 'caregiver' ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#3b82f6,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                          {(u.firstName.charAt(0) || u.email.charAt(0)).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.firstName} {u.lastName}</div>
                          <div style={{ fontSize: 13, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                          {u.profession && <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 4, fontWeight: 600 }}>{u.profession}</div>}
                        </div>
                      </div>
                    ))}
                    {users.filter(u => selectedUserCategory === 'Clients' ? (u.role === 'client' || u.role === 'user') : selectedUserCategory === 'Caregivers' ? u.role === 'caregiver' : u.role === 'admin').length === 0 && (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>No accounts found in this category.</div>
                    )}
                  </div>
                </div>
              )}
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
                  <div key={c.profileId} className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
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
                      <span className={`badge ${c.kycStatus === 'SUBMITTED' ? 'badge-pending' : 'badge-rejected'}`}>
                        KYC: {c.kycStatus || 'PENDING'}
                      </span>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 13 }}>
                        <div><strong style={{ color: 'var(--text-muted)' }}>NID Number:</strong> <span style={{ color: '#fff' }}>{c.nidNumber || 'Not provided'}</span></div>
                        <div><strong style={{ color: 'var(--text-muted)' }}>Gender:</strong> <span style={{ color: '#fff' }}>{c.gender || 'Not provided'}</span></div>
                        <div><strong style={{ color: 'var(--text-muted)' }}>DOB:</strong> <span style={{ color: '#fff' }}>{c.dob ? new Date(c.dob).toLocaleDateString() : 'Not provided'}</span></div>
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                        {c.nidFrontUrl && <a href={c.nidFrontUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>📄 View NID Front</a>}
                        {c.nidBackUrl && <a href={c.nidBackUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>📄 View NID Back</a>}
                        {c.certificateUrl && <a href={c.certificateUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>📜 View Certificate</a>}
                        {c.policeClearanceUrl && <a href={c.policeClearanceUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>🛡️ View Police Clearance</a>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                      <button className="btn btn-danger" onClick={() => handleRejectCaregiver(c.profileId)} disabled={c.kycStatus === 'REJECTED'}>✕ Reject KYC</button>
                      <button className="btn btn-success" onClick={() => handleApproveCaregiver(c.profileId)} disabled={c.kycStatus === 'APPROVED'}>✓ Approve Profile</button>
                    </div>
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

          {/* NOTIFICATIONS */}
          {tab === 'notifications' && (
            <>
              <div className="page-header">
                <h1>System Alerts</h1>
                <p>Stay updated on platform events, errors, and automated notifications.</p>
              </div>
              <div className="stagger" style={{ display: 'grid', gap: 14 }}>
                {notifications.map((n: any) => (
                  <div key={n.id} className="glass-card-static" style={{ padding: '18px 22px', borderLeft: n.isRead ? '4px solid transparent' : '4px solid var(--accent-blue)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4, color: n.isRead ? 'var(--text-secondary)' : '#fff' }}>{n.title}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 6 }}>{n.message}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                    {!n.isRead && (
                      <button className="btn btn-ghost" onClick={() => markNotificationRead(n.id)} style={{ fontSize: 13, padding: '8px 16px' }}>Mark as Read</button>
                    )}
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 60, background: 'rgba(255,255,255,0.02)', borderRadius: 22, border: '1px dashed var(--border-glass-strong)' }}>
                    <span style={{ fontSize: 40, marginBottom: 14, display: 'block' }}>📭</span>
                    <h3 style={{ fontWeight: 700, color: 'var(--text-muted)' }}>No alerts yet</h3>
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </main>

      {/* USER DETAIL MODAL */}
      {selectedUserDetail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, width: '100%', maxWidth: 500, overflow: 'hidden', animation: 'fadeScale 0.3s ease-out' }}>
            <div style={{ background: selectedUserDetail.role === 'admin' ? 'linear-gradient(135deg,#8b5cf6,#7c3aed)' : selectedUserDetail.role === 'caregiver' ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#3b82f6,#2563eb)', padding: '30px 24px', display: 'flex', alignItems: 'center', gap: 20, position: 'relative' }}>
              {selectedUserDetail.profilePictureUrl ? (
                <img src={selectedUserDetail.profilePictureUrl} alt="profile" style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'cover', border: '4px solid rgba(255,255,255,0.4)', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '4px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                  {(selectedUserDetail.firstName.charAt(0) || selectedUserDetail.email.charAt(0)).toUpperCase()}
                </div>
              )}
              <div style={{ color: '#fff' }}>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{selectedUserDetail.firstName} {selectedUserDetail.lastName}</h2>
                <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}>{selectedUserDetail.role}</div>
              </div>
              <button onClick={() => setSelectedUserDetail(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.2)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>×</button>
            </div>
            
            <div style={{ padding: 24, maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div><div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Email Address</div><div style={{ color: '#f8fafc', fontSize: 15 }}>{selectedUserDetail.email}</div></div>
                {selectedUserDetail.phone && <div><div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Phone Number</div><div style={{ color: '#f8fafc', fontSize: 15 }}>{selectedUserDetail.phone}</div></div>}
                {selectedUserDetail.bloodGroup && <div><div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Blood Group</div><div style={{ color: '#f8fafc', fontSize: 15 }}>{selectedUserDetail.bloodGroup}</div></div>}
                {selectedUserDetail.profession && <div><div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Profession</div><div style={{ color: '#f8fafc', fontSize: 15 }}>{selectedUserDetail.profession}</div></div>}
                {selectedUserDetail.gender && <div><div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Gender</div><div style={{ color: '#f8fafc', fontSize: 15 }}>{selectedUserDetail.gender}</div></div>}
                {selectedUserDetail.dob && <div><div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Date of Birth</div><div style={{ color: '#f8fafc', fontSize: 15 }}>{new Date(selectedUserDetail.dob).toLocaleDateString()}</div></div>}
                {selectedUserDetail.presentAddress && <div><div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Present Address</div><div style={{ color: '#f8fafc', fontSize: 15 }}>{selectedUserDetail.presentAddress}</div></div>}
                {selectedUserDetail.permanentAddress && <div><div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Permanent Address</div><div style={{ color: '#f8fafc', fontSize: 15 }}>{selectedUserDetail.permanentAddress}</div></div>}
                <div><div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Joined Date</div><div style={{ color: '#f8fafc', fontSize: 15 }}>{new Date(selectedUserDetail.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div></div>
                
                {selectedUserDetail.role === 'caregiver' && (
                  <div style={{ marginTop: 12, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Verification Info</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div><div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>KYC Status</div><span className={getBadgeClass(selectedUserDetail.kycStatus)}>{selectedUserDetail.kycStatus}</span></div>
                      {selectedUserDetail.nidNumber && <div><div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>NID Number</div><div style={{ color: '#f8fafc', fontSize: 15 }}>{selectedUserDetail.nidNumber}</div></div>}
                      
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                        {selectedUserDetail.nidFrontUrl && <a href={selectedUserDetail.nidFrontUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '6px 12px' }}>📄 NID Front</a>}
                        {selectedUserDetail.nidBackUrl && <a href={selectedUserDetail.nidBackUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '6px 12px' }}>📄 NID Back</a>}
                        {selectedUserDetail.certificateUrl && <a href={selectedUserDetail.certificateUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '6px 12px' }}>📜 License</a>}
                        {selectedUserDetail.policeClearanceUrl && <a href={selectedUserDetail.policeClearanceUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '6px 12px' }}>🛡️ Police Clear</a>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button onClick={() => setSelectedUserDetail(null)} style={{ padding: '10px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Close</button>
                {selectedUserDetail.role !== 'admin' && (
                  <button onClick={() => { handleDeleteUser(selectedUserDetail.userId, selectedUserDetail.email); setSelectedUserDetail(null); }} style={{ padding: '10px 20px', borderRadius: 12, background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', fontWeight: 600 }}>Delete Account</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
