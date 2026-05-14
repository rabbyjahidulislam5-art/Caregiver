import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useModal } from '../components/ModalContext';

type Tab = 'dashboard' | 'search' | 'bookings' | 'history' | 'complaints' | 'profile';

export default function ClientDashboard() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [profile, setProfile] = useState<any>(null);
  const [caregivers, setCaregivers] = useState<any[]>([]);
  const [activeBookings, setActiveBookings] = useState<any[]>([]);
  const [historyBookings, setHistoryBookings] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintCaregiverId, setComplaintCaregiverId] = useState('');
  const [reviewData, setReviewData] = useState({ caregiverId: '', rating: 5, comment: '' });
  const [animationKey, setAnimationKey] = useState(0);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', phone: '', address: '', profilePictureUrl: '' });

  const navigate = useNavigate();
  const { showSuccess, showError, showConfirm } = useModal();
  const userId = localStorage.getItem('userId') || '';

  useEffect(() => {
    if (!userId) { navigate('/login'); return; }
    loadProfile();
    loadActiveBookings();
  }, []);

  const changeTab = (newTab: Tab) => {
    setTab(newTab);
    setAnimationKey(prev => prev + 1);
    if (newTab === 'history') loadHistory();
    if (newTab === 'complaints') loadComplaints();
    if (newTab === 'bookings') loadActiveBookings();
  };

  const loadProfile = async () => {
    try {
      const p = await api.get(`/profile/${userId}`);
      setProfile(p);
      setEditForm({ 
        firstName: p.firstName || '', 
        lastName: p.lastName || '', 
        phone: p.phone || '', 
        address: p.address || '',
        profilePictureUrl: p.image || ''
      });
    } catch {}
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return showError('File too large', 'Please upload an image smaller than 5MB');
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, profilePictureUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const loadActiveBookings = async () => { try { setActiveBookings(await api.get(`/bookings/active/${userId}`)); } catch {} };
  const loadHistory = async () => { try { setHistoryBookings(await api.get(`/bookings/history/${userId}`)); } catch {} };
  const loadComplaints = async () => { try { setComplaints(await api.get(`/complaints/history/${userId}`)); } catch {} };
  const searchCaregivers = async () => { try { setCaregivers(await api.get(`/caregivers/search?profession=${searchQuery}`)); } catch {} };

  const handleBook = (caregiverId: string) => {
    if (!bookingDate) return showError('Missing Date', 'Please select a service date');
    showConfirm('Confirm Booking', 'Do you want to book this caregiver?', async () => {
      try {
        await api.post('/book', { clientId: userId, caregiverId, serviceDate: new Date(bookingDate).toISOString() });
        showSuccess('Booked!', 'Your booking request has been sent.');
        setBookingDate('');
      } catch (err: any) { showError('Booking Failed', err.message); }
    });
  };

  const handleComplaint = async () => {
    if (!complaintCaregiverId || !complaintDesc) return showError('Missing Info', 'Please fill all fields');
    try {
      await api.post('/complaints/submit', { clientId: userId, caregiverId: complaintCaregiverId, description: complaintDesc });
      showSuccess('Submitted', 'Your complaint has been filed.');
      setComplaintDesc(''); setComplaintCaregiverId('');
      loadComplaints();
    } catch (err: any) { showError('Error', err.message); }
  };

  const handleReview = async () => {
    if (!reviewData.caregiverId) return showError('Missing Info', 'Please provide caregiver ID');
    try {
      await api.post('/reviews', { clientId: userId, ...reviewData });
      showSuccess('Review Posted', 'Thank you for your feedback!');
      setReviewData({ caregiverId: '', rating: 5, comment: '' });
    } catch (err: any) { showError('Error', err.message); }
  };

  const handleLogout = () => {
    showConfirm('Logout', 'Are you sure you want to sign out?', async () => {
      try { await api.post('/logout'); } catch {}
      localStorage.clear(); navigate('/');
    });
  };

  const handleUpdateProfile = async () => {
    try {
      await api.put(`/update-profile/${userId}`, editForm);
      showSuccess('Updated!', 'Your profile has been updated successfully.');
      loadProfile();
    } catch (e: any) { showError('Error', e.message); }
  };

  const handleDeleteAccount = () => {
    showConfirm(
      '⚠️ Delete Account',
      'This will permanently delete your account and all your data. This cannot be undone. Are you absolutely sure?',
      async () => {
        try {
          await api.del(`/account/delete/${userId}`);
          showSuccess('Account Deleted', 'Your account has been permanently removed.');
          localStorage.clear();
          navigate('/');
        } catch (e: any) { showError('Delete Failed', e.message); }
      }
    );
  };

  const sidebarItems: { key: Tab; icon: string; label: string }[] = [
    { key: 'dashboard',  icon: '📊', label: 'Overview' },
    { key: 'search',     icon: '🔍', label: 'Find Caregivers' },
    { key: 'bookings',   icon: '📅', label: 'Active Bookings' },
    { key: 'history',    icon: '📋', label: 'Booking History' },
    { key: 'complaints', icon: '📝', label: 'Complaints & Reviews' },
    { key: 'profile',    icon: '👤', label: 'My Profile' },
  ];

  const getBadgeClass = (status: string) => {
    const s = status?.toUpperCase() || '';
    if (s.includes('APPROVED') || s === 'COMPLETED') return 'badge badge-approved';
    if (s.includes('REJECT')) return 'badge badge-rejected';
    if (s === 'REVIEWED') return 'badge badge-reviewed';
    return 'badge badge-pending';
  };

  return (
    <div className="page-container fade-in">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">🏥 <span>Client Portal</span></div>
        <nav className="sidebar-nav">
          {sidebarItems.map(item => (
            <div
              key={item.key}
              className={`sidebar-item ${tab === item.key ? 'active' : ''}`}
              onClick={() => changeTab(item.key)}
            >
              <span>{item.icon}</span>
              <div className="sidebar-item-label">{item.label}</div>
            </div>
          ))}
        </nav>
        <div style={{ paddingTop: 16, borderTop: '1px solid var(--border-glass)' }}>
          {profile && (
            <div style={{ padding: '12px 16px', marginBottom: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15 }}>
                  {profile.firstName?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.firstName}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Client</div>
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
                <h1>Welcome back, {profile?.firstName || 'User'} 👋</h1>
                <p>Your premium caregiving overview for today.</p>
              </div>
              <div className="stats-grid stagger">
                <div className="stat-card glass-card">
                  <div className="stat-value">{activeBookings.length}</div>
                  <div className="stat-label">Active Bookings</div>
                  <div style={{ position: 'absolute', right: 20, top: 20, fontSize: 36, opacity: 0.15 }}>📅</div>
                </div>
                <div className="stat-card glass-card">
                  <div className="stat-value" style={{ textTransform: 'capitalize' }}>{profile?.role || 'Client'}</div>
                  <div className="stat-label">Account Type</div>
                  <div style={{ position: 'absolute', right: 20, top: 20, fontSize: 36, opacity: 0.15 }}>🛡️</div>
                </div>
              </div>

              {activeBookings.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20, letterSpacing: '-0.3px' }}>Recent Bookings</h2>
                  <div className="stagger" style={{ display: 'grid', gap: 14 }}>
                    {activeBookings.slice(0, 3).map((b: any) => (
                      <div key={b.bookingId} className="glass-card-static" style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{b.caregiverName}</div>
                          <div style={{ color: 'var(--accent-cyan)', fontSize: 13 }}>{b.profession}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 6 }}>{new Date(b.serviceDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</div>
                          <span className={getBadgeClass(b.status)}>{b.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* SEARCH */}
          {tab === 'search' && (
            <>
              <div className="page-header">
                <h1>Find Professionals</h1>
                <p>Search by profession or browse all our premium caregivers.</p>
              </div>
              <div className="glass-card-static" style={{ padding: 24, marginBottom: 32 }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 280px' }}>
                    <label className="form-label">Search Profession</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input className="input-glass" placeholder="e.g. Nurse, Therapist…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchCaregivers()} />
                      <button className="btn btn-primary" onClick={searchCaregivers}>Search 🔍</button>
                    </div>
                  </div>
                  <div style={{ flex: '1 1 220px' }}>
                    <label className="form-label">Desired Service Date</label>
                    <input className="input-glass" type="datetime-local" value={bookingDate} onChange={e => setBookingDate(e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button className="btn btn-ghost" onClick={async () => { setCaregivers(await api.get('/caregivers')); }}>Show All 🌟</button>
                  </div>
                </div>
              </div>
              <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 22 }}>
                {caregivers.map(cg => (
                  <div key={cg.userId} className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 18 }}>
                      <div style={{ width: 50, height: 50, borderRadius: 16, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, flexShrink: 0, overflow: 'hidden' }}>
                        {cg.profilePictureUrl ? (
                          <img src={cg.profilePictureUrl} alt={cg.firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          cg.firstName?.[0] || '👨‍⚕️'
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontWeight: 800, fontSize: 17, marginBottom: 3 }}>{cg.firstName} {cg.lastName}</h3>
                        <p style={{ color: 'var(--accent-cyan)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>{cg.profession || 'Caregiver'}</p>
                      </div>
                      <div className="badge badge-reviewed">★ {cg.rating?.toFixed(1) || '0.0'}</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 12, marginBottom: 18, fontSize: 13 }}>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>📍 {cg.presentAddress || 'N/A'}</p>
                      <p style={{ color: 'var(--text-secondary)' }}>🔧 {cg.experienceYears || 0} years experience</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => handleBook(cg.userId)} style={{ width: '100%', marginTop: 'auto' }}>📅 Request Booking</button>
                  </div>
                ))}
                {caregivers.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, background: 'rgba(255,255,255,0.02)', borderRadius: 22, border: '1px dashed var(--border-glass-strong)' }}>
                    <span style={{ fontSize: 40, marginBottom: 14, display: 'block' }}>🕵️</span>
                    <h3 style={{ fontWeight: 700, marginBottom: 8 }}>No Caregivers Found</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Try a different search query or click "Show All".</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ACTIVE BOOKINGS */}
          {tab === 'bookings' && (
            <>
              <div className="page-header">
                <h1>Active Bookings</h1>
                <p>Track your upcoming scheduled appointments.</p>
              </div>
              <div className="glass-table-container">
                <table className="glass-table">
                  <thead><tr><th>Caregiver</th><th>Profession</th><th>Date & Time</th><th>Status</th></tr></thead>
                  <tbody>
                    {activeBookings.map((b: any) => (
                      <tr key={b.bookingId}>
                        <td style={{ fontWeight: 700, color: '#fff' }}>{b.caregiverName}</td>
                        <td style={{ color: 'var(--accent-cyan)' }}>{b.profession}</td>
                        <td>{new Date(b.serviceDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</td>
                        <td><span className={getBadgeClass(b.status)}>{b.status}</span></td>
                      </tr>
                    ))}
                    {activeBookings.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>You have no active bookings at the moment.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* HISTORY */}
          {tab === 'history' && (
            <>
              <div className="page-header">
                <h1>Booking History</h1>
                <p>A complete record of your past requests and services.</p>
              </div>
              <div className="glass-table-container">
                <table className="glass-table">
                  <thead><tr><th>Caregiver</th><th>Profession</th><th>Date & Time</th><th>Status</th></tr></thead>
                  <tbody>
                    {historyBookings.map((b: any) => (
                      <tr key={b.bookingId}>
                        <td style={{ fontWeight: 700, color: '#fff' }}>{b.caregiverName}</td>
                        <td style={{ color: 'var(--accent-cyan)' }}>{b.profession}</td>
                        <td>{new Date(b.serviceDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</td>
                        <td><span className={getBadgeClass(b.status)}>{b.status}</span></td>
                      </tr>
                    ))}
                    {historyBookings.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Your booking history is empty.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* COMPLAINTS & REVIEWS */}
          {tab === 'complaints' && (
            <>
              <div className="page-header">
                <h1>Complaints & Feedback</h1>
                <p>We value your experience. File complaints or leave positive reviews.</p>
              </div>
              <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24, marginBottom: 40 }}>
                <div className="glass-card-static" style={{ padding: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>⚠️</div>
                    <h3 style={{ fontWeight: 800, fontSize: 19 }}>File a Complaint</h3>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Caregiver ID</label>
                    <input className="input-glass" placeholder="Paste caregiver ID…" value={complaintCaregiverId} onChange={e => setComplaintCaregiverId(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Issue Description</label>
                    <textarea className="input-glass" placeholder="Describe the issue in detail…" rows={4} value={complaintDesc} onChange={e => setComplaintDesc(e.target.value)} style={{ resize: 'vertical' }} />
                  </div>
                  <button className="btn btn-danger" onClick={handleComplaint} style={{ width: '100%' }}>Submit Complaint</button>
                </div>
                <div className="glass-card-static" style={{ padding: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>⭐</div>
                    <h3 style={{ fontWeight: 800, fontSize: 19 }}>Leave a Review</h3>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Caregiver ID</label>
                    <input className="input-glass" placeholder="Paste caregiver ID…" value={reviewData.caregiverId} onChange={e => setReviewData(p => ({ ...p, caregiverId: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rating</label>
                    <select className="select-glass" value={reviewData.rating} onChange={e => setReviewData(p => ({ ...p, rating: Number(e.target.value) }))}>
                      {[5,4,3,2,1].map(r => <option key={r} value={r}>{'⭐'.repeat(r)} ({r} Stars)</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Your Feedback</label>
                    <textarea className="input-glass" placeholder="Share your experience…" rows={3} value={reviewData.comment} onChange={e => setReviewData(p => ({ ...p, comment: e.target.value }))} style={{ resize: 'vertical' }} />
                  </div>
                  <button className="btn btn-primary" onClick={handleReview} style={{ width: '100%' }}>Post Review ⭐</button>
                </div>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Your Complaint History</h2>
              <div className="glass-table-container">
                <table className="glass-table">
                  <thead><tr><th>Caregiver</th><th>Description</th><th>Status</th><th>Admin Response</th></tr></thead>
                  <tbody>
                    {complaints.map((c: any) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 700, color: '#fff' }}>{c.caregiverName}</td>
                        <td style={{ maxWidth: 260, color: 'var(--text-secondary)' }}>{c.description}</td>
                        <td><span className={getBadgeClass(c.status)}>{c.status}</span></td>
                        <td>
                          {c.adminReply
                            ? <div style={{ background: 'rgba(16,185,129,0.08)', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(16,185,129,0.2)', fontSize: 13 }}>
                                <strong style={{ color: 'var(--accent-green)', display: 'block', marginBottom: 4, fontSize: 11, letterSpacing: 1 }}>REPLY:</strong>
                                {c.adminReply}
                              </div>
                            : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 13 }}>Pending review…</span>
                          }
                        </td>
                      </tr>
                    ))}
                    {complaints.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>You have not filed any complaints.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* PROFILE */}
          {tab === 'profile' && profile && (
            <>
              <div className="page-header">
                <h1>My Profile</h1>
                <p>View and update your personal account details.</p>
              </div>

              {/* Profile Card */}
              <div className="glass-card-static" style={{ padding: 40, maxWidth: 640, marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginBottom: 36 }}>
                  <div style={{ width: 84, height: 84, borderRadius: 24, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 900, boxShadow: 'var(--shadow-glow-blue)', flexShrink: 0, overflow: 'hidden' }}>
                    {profile.image ? (
                      <img src={profile.image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      profile.firstName?.[0]?.toUpperCase() || '?'
                    )}
                  </div>
                  <div>
                    <h2 style={{ fontWeight: 800, fontSize: 24, marginBottom: 4 }}>{profile.fullName || `${editForm.firstName} ${editForm.lastName}`}</h2>
                    <p style={{ color: 'var(--accent-cyan)', fontSize: 14, fontWeight: 600 }}>{profile.email}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4, textTransform: 'capitalize' }}>🛡️ {profile.role}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input className="input-glass" value={editForm.firstName} onChange={e => setEditForm(p => ({ ...p, firstName: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input className="input-glass" value={editForm.lastName} onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input className="input-glass" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} placeholder="e.g. +88017xxxxxxxx" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Home Address</label>
                    <input className="input-glass" value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} placeholder="Your address" />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: 18 }}>
                  <label className="form-label">Profile Picture (Optional)</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="input-glass" style={{ padding: '8px', width: '100%' }} />
                </div>

                <button className="btn btn-primary btn-lg" onClick={handleUpdateProfile} style={{ width: '100%', marginTop: 24 }}>
                  💾 Save Changes
                </button>
              </div>

              {/* Info Display */}
              <div className="glass-card-static" style={{ padding: 28, maxWidth: 640, marginBottom: 28 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 18, fontSize: 16 }}>Account Information</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {[['Blood Group', profile.bloodGroup, '🩸'], ['Account Role', profile.role, '🛡️']].map(([label, val, icon]) => (
                    <div key={label as string} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: 12, gap: 14 }}>
                      <span style={{ fontSize: 20 }}>{icon}</span>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
                        <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, textTransform: 'capitalize' }}>{val || 'Not provided'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger Zone */}
              <div style={{ maxWidth: 640, padding: 28, border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, background: 'rgba(239,68,68,0.04)' }}>
                <h3 style={{ color: '#f87171', fontWeight: 800, fontSize: 16, marginBottom: 8 }}>⚠️ Danger Zone</h3>
                <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>Once you delete your account, there is no going back. Your bookings, complaints and reviews will be permanently removed. Your activity history will still be preserved in the system audit log.</p>
                <button onClick={handleDeleteAccount} style={{ padding: '12px 28px', borderRadius: 12, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.5)', color: '#f87171', cursor: 'pointer', fontWeight: 700, fontSize: 14, transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}>
                  🗑️ Delete My Account Permanently
                </button>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
