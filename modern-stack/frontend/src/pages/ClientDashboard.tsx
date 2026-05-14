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
  const navigate = useNavigate();
  const { showSuccess, showError, showConfirm } = useModal();
  const userId = localStorage.getItem('userId') || '';

  useEffect(() => {
    if (!userId) { navigate('/login'); return; }
    loadProfile();
    loadActiveBookings();
  }, []);

  const loadProfile = async () => {
    try { setProfile(await api.get(`/profile/${userId}`)); } catch {}
  };
  const loadActiveBookings = async () => {
    try { setActiveBookings(await api.get(`/bookings/active/${userId}`)); } catch {}
  };
  const loadHistory = async () => {
    try { setHistoryBookings(await api.get(`/bookings/history/${userId}`)); } catch {}
  };
  const loadComplaints = async () => {
    try { setComplaints(await api.get(`/complaints/history/${userId}`)); } catch {}
  };
  const searchCaregivers = async () => {
    try { setCaregivers(await api.get(`/caregivers/search?profession=${searchQuery}`)); } catch {}
  };

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
      localStorage.clear();
      navigate('/login');
    });
  };

  const sidebarItems: { key: Tab; icon: string; label: string }[] = [
    { key: 'dashboard', icon: '📊', label: 'Dashboard' },
    { key: 'search', icon: '🔍', label: 'Find Caregivers' },
    { key: 'bookings', icon: '📅', label: 'Active Bookings' },
    { key: 'history', icon: '📋', label: 'Booking History' },
    { key: 'complaints', icon: '📝', label: 'My Complaints' },
    { key: 'profile', icon: '👤', label: 'My Profile' },
  ];

  const getBadgeClass = (status: string) => {
    const s = status?.toUpperCase() || '';
    if (s.includes('APPROVED') || s === 'COMPLETED') return 'badge badge-approved';
    if (s.includes('REJECT')) return 'badge badge-rejected';
    if (s === 'REVIEWED') return 'badge badge-reviewed';
    return 'badge badge-pending';
  };

  return (
    <div className="page-container">
      <aside className="sidebar">
        <div className="sidebar-logo">🏥 CaregiverGO</div>
        <nav className="sidebar-nav">
          {sidebarItems.map(item => (
            <div key={item.key} className={`sidebar-item ${tab === item.key ? 'active' : ''}`}
              onClick={() => { setTab(item.key); if (item.key === 'history') loadHistory(); if (item.key === 'complaints') loadComplaints(); if (item.key === 'bookings') loadActiveBookings(); }}>
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
        </nav>
        <div style={{ padding: '16px 12px' }}>
          <button className="btn btn-ghost" style={{ width: '100%' }} onClick={handleLogout}>🚪 Sign Out</button>
        </div>
      </aside>

      <main className="main-content fade-in">
        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <>
            <div className="page-header">
              <h1>Welcome back, {profile?.firstName || 'User'} 👋</h1>
              <p>Here's your overview for today</p>
            </div>
            <div className="stats-grid stagger">
              <div className="glass-card stat-card"><div className="stat-value">{activeBookings.length}</div><div className="stat-label">Active Bookings</div></div>
              <div className="glass-card stat-card"><div className="stat-value">{profile?.role || '—'}</div><div className="stat-label">Account Type</div></div>
            </div>
          </>
        )}

        {/* SEARCH CAREGIVERS */}
        {tab === 'search' && (
          <>
            <div className="page-header"><h1>Find Caregivers</h1><p>Search by profession or browse all available caregivers</p></div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <input className="input-glass" placeholder="Search by profession..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ flex: 1 }} id="search-profession" />
              <button className="btn btn-primary" onClick={searchCaregivers} id="search-btn">Search</button>
              <button className="btn btn-ghost" onClick={async () => { setCaregivers(await api.get('/caregivers')); }}>Show All</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Service Date (required for booking)</label>
              <input className="input-glass" type="datetime-local" value={bookingDate} onChange={e => setBookingDate(e.target.value)} style={{ maxWidth: 300 }} id="service-date" />
            </div>
            <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {caregivers.map(cg => (
                <div key={cg.userId} className="glass-card" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: 16 }}>{cg.firstName} {cg.lastName}</h3>
                      <p style={{ color: 'var(--accent-cyan)', fontSize: 13, fontWeight: 600 }}>{cg.profession || 'N/A'}</p>
                    </div>
                    <div className="badge badge-approved">★ {cg.rating?.toFixed(1) || '0.0'}</div>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 4 }}>📍 {cg.presentAddress || 'N/A'}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>🔧 {cg.experienceYears || 0} years experience</p>
                  <button className="btn btn-primary btn-sm" onClick={() => handleBook(cg.userId)} style={{ width: '100%' }}>📅 Book Now</button>
                </div>
              ))}
              {caregivers.length === 0 && <p style={{ color: 'var(--text-muted)', gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>No caregivers found. Try searching or click "Show All".</p>}
            </div>
          </>
        )}

        {/* ACTIVE BOOKINGS */}
        {tab === 'bookings' && (
          <>
            <div className="page-header"><h1>Active Bookings</h1><p>Your approved upcoming appointments</p></div>
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="glass-table">
                <thead><tr><th>Caregiver</th><th>Profession</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                  {activeBookings.map((b: any) => (
                    <tr key={b.bookingId}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.caregiverName}</td>
                      <td>{b.profession}</td>
                      <td>{new Date(b.serviceDate).toLocaleDateString()}</td>
                      <td><span className={getBadgeClass(b.status)}>{b.status}</span></td>
                    </tr>
                  ))}
                  {activeBookings.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No active bookings</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* BOOKING HISTORY */}
        {tab === 'history' && (
          <>
            <div className="page-header"><h1>Booking History</h1><p>All your past and current requests</p></div>
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="glass-table">
                <thead><tr><th>Caregiver</th><th>Profession</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                  {historyBookings.map((b: any) => (
                    <tr key={b.bookingId}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.caregiverName}</td>
                      <td>{b.profession}</td>
                      <td>{new Date(b.serviceDate).toLocaleDateString()}</td>
                      <td><span className={getBadgeClass(b.status)}>{b.status}</span></td>
                    </tr>
                  ))}
                  {historyBookings.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No booking history</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* COMPLAINTS */}
        {tab === 'complaints' && (
          <>
            <div className="page-header"><h1>My Complaints</h1><p>File and track complaints</p></div>
            <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>File a Complaint</h3>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <input className="input-glass" placeholder="Caregiver ID" value={complaintCaregiverId} onChange={e => setComplaintCaregiverId(e.target.value)} id="complaint-caregiver-id" />
                <input className="input-glass" placeholder="Describe the issue..." value={complaintDesc} onChange={e => setComplaintDesc(e.target.value)} id="complaint-desc" />
              </div>
              <button className="btn btn-danger btn-sm" onClick={handleComplaint} id="complaint-submit">Submit Complaint</button>
            </div>

            <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Leave a Review</h3>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <input className="input-glass" placeholder="Caregiver ID" value={reviewData.caregiverId} onChange={e => setReviewData(p => ({ ...p, caregiverId: e.target.value }))} id="review-caregiver-id" />
                <select className="select-glass" value={reviewData.rating} onChange={e => setReviewData(p => ({ ...p, rating: Number(e.target.value) }))} id="review-rating">
                  {[1,2,3,4,5].map(r => <option key={r} value={r}>{'★'.repeat(r)} ({r})</option>)}
                </select>
              </div>
              <input className="input-glass" placeholder="Your review comment..." value={reviewData.comment} onChange={e => setReviewData(p => ({ ...p, comment: e.target.value }))} style={{ marginBottom: 12 }} id="review-comment" />
              <button className="btn btn-primary btn-sm" onClick={handleReview} id="review-submit">Post Review</button>
            </div>

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="glass-table">
                <thead><tr><th>Caregiver</th><th>Description</th><th>Status</th><th>Admin Reply</th></tr></thead>
                <tbody>
                  {complaints.map((c: any) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.caregiverName}</td>
                      <td>{c.description}</td>
                      <td><span className={getBadgeClass(c.status)}>{c.status}</span></td>
                      <td style={{ color: c.adminReply ? 'var(--accent-green)' : 'var(--text-muted)' }}>{c.adminReply || 'Awaiting reply'}</td>
                    </tr>
                  ))}
                  {complaints.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No complaints filed</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* PROFILE */}
        {tab === 'profile' && profile && (
          <>
            <div className="page-header"><h1>My Profile</h1><p>Your account information</p></div>
            <div className="glass-card" style={{ padding: 32, maxWidth: 500 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                  {profile.firstName?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <h2 style={{ fontWeight: 700, fontSize: 20 }}>{profile.fullName}</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{profile.email}</p>
                </div>
              </div>
              {[
                ['Phone', profile.phone], ['Address', profile.address], ['Role', profile.role],
                ['Blood Group', profile.bloodGroup],
              ].map(([label, val]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-glass)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
                  <span style={{ fontWeight: 500 }}>{val || 'N/A'}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
