import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useModal } from '../components/ModalContext';

type Tab = 'dashboard' | 'pending' | 'accepted' | 'history' | 'schedule' | 'profile' | 'kyc' | 'notifications';

export default function CaregiverDashboard() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [profile, setProfile] = useState<any>(null);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [acceptedBookings, setAcceptedBookings] = useState<any[]>([]);
  const [historyBookings, setHistoryBookings] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [newSchedule, setNewSchedule] = useState({ dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00' });
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', profession: '', experienceYears: '', address: '', phone: '', profilePictureUrl: '' });
  const [kycForm, setKycForm] = useState({ nidNumber: '', nidFrontUrl: '', nidBackUrl: '', certificateUrl: '', policeClearanceUrl: '', selfieUrl: '' });
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  // Caregiver Interactive Calendar States
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(new Date());

  const navigate = useNavigate();
  const { showSuccess, showError, showConfirm } = useModal();
  const userId = localStorage.getItem('userId') || '';

  useEffect(() => {
    if (!userId) { navigate('/login'); return; }
    loadProfile();
    loadPending();
    loadAccepted();
    loadHistory();
    loadNotifications();
  }, []);

  const changeTab = (newTab: Tab) => {
    setTab(newTab);
    setAnimationKey(prev => prev + 1);
    if (newTab === 'pending') loadPending();
    if (newTab === 'accepted') loadAccepted();
    if (newTab === 'history') loadHistory();
    if (newTab === 'schedule') loadSchedules();
    if (newTab === 'notifications') loadNotifications();
  };

  const loadProfile = async () => {
    try {
      const p = await api.get(`/profile/${userId}`);
      setProfile(p);
      setEditForm({ 
        firstName: p.firstName || '', 
        lastName: p.lastName || '', 
        profession: p.profession || '', 
        experienceYears: String(p.experienceYears || ''), 
        address: p.address || '', 
        phone: p.phone || '',
        profilePictureUrl: p.image || ''
      });
      setKycForm({
        nidNumber: p.nidNumber || '',
        nidFrontUrl: p.nidFrontUrl || '',
        nidBackUrl: p.nidBackUrl || '',
        certificateUrl: p.certificateUrl || '',
        policeClearanceUrl: p.policeClearanceUrl || '',
        selfieUrl: p.selfieUrl || ''
      });
    } catch {}
  };

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);
 
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400, facingMode: 'user' } });
      setCameraStream(stream);
      setIsCameraActive(true);
      setTimeout(() => {
        const video = document.getElementById('webcam-video') as HTMLVideoElement;
        if (video) video.srcObject = stream;
      }, 100);
    } catch (e: any) {
      showError('Camera Error', 'Could not access camera: ' + e.message);
    }
  };
 
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };
 
  const capturePhoto = () => {
    const video = document.getElementById('webcam-video') as HTMLVideoElement;
    if (video) {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(400, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, 400, 400);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setKycForm(prev => ({ ...prev, selfieUrl: dataUrl }));
        stopCamera();
      }
    }
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

  const handleKycUpload = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof kycForm) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return showError('File too large', 'Please upload a file smaller than 5MB');
      const reader = new FileReader();
      reader.onloadend = () => setKycForm(prev => ({ ...prev, [field]: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const loadPending = async () => { try { setPendingBookings(await api.get(`/bookings/caregiver/${userId}/pending`)); } catch {} };
  const loadAccepted = async () => { try { setAcceptedBookings(await api.get(`/bookings/caregiver/${userId}/accepted`)); } catch {} };
  const loadHistory = async () => { try { setHistoryBookings(await api.get(`/bookings/caregiver/${userId}/history`)); } catch {} };
  const loadSchedules = async () => { try { setSchedules(await api.get(`/schedule/${userId}`)); } catch {} };
  const loadNotifications = async () => { try { setNotifications(await api.get('/notifications')); } catch {} };
  const markNotificationRead = async (id: string) => { try { await api.put(`/notifications/${id}/read`); loadNotifications(); } catch {} };

  const reloadBookings = () => {
    loadPending();
    loadAccepted();
    loadHistory();
  };

  const handleAccept = (bookingId: string) => {
    showConfirm('Accept Booking', 'Are you sure you want to accept this booking?', async () => {
      try { await api.post(`/bookings/${bookingId}/accept`); showSuccess('Accepted', 'Booking accepted.'); reloadBookings(); }
      catch (e: any) { showError('Error', e.message); }
    });
  };

  const handleReject = (bookingId: string) => {
    showConfirm('Reject Booking', 'Are you sure you want to reject this booking?', async () => {
      try { await api.post(`/bookings/${bookingId}/reject`); showSuccess('Rejected', 'Booking has been rejected.'); reloadBookings(); }
      catch (e: any) { showError('Error', e.message); }
    });
  };

  const handleComplete = (bookingId: string) => {
    showConfirm('Complete Booking', 'Mark this booking as completed?', async () => {
      try { await api.post(`/bookings/${bookingId}/complete`); showSuccess('Completed', 'Booking marked as completed.'); reloadBookings(); }
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

  const handleSubmitKyc = async () => {
    if (!kycForm.nidNumber || !kycForm.nidFrontUrl || !kycForm.nidBackUrl || !kycForm.selfieUrl) {
      return showError('Missing Fields', 'Please provide your NID Number, both NID images, and capture a live selfie photo.');
    }
    try {
      await api.put(`/update-profile/${userId}`, { ...kycForm, kycStatus: 'SUBMITTED' });
      showSuccess('KYC Submitted', 'Your documents are under review by an Admin.');
      loadProfile();
    } catch (e: any) { showError('Error', e.message); }
  };

  const handleLogout = () => {
    showConfirm('Logout', 'Are you sure?', async () => {
      try { await api.post('/logout'); } catch {}
      localStorage.clear(); navigate('/');
    });
  };

  const handleDeleteAccount = () => {
    showConfirm(
      '⚠️ Delete Account',
      'This will permanently delete your caregiver account. Your bookings and schedules will be removed. Your audit history will be preserved. This cannot be undone.',
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
    { key: 'dashboard', icon: '📊', label: 'Overview' },
    { key: 'pending',   icon: '⏳', label: 'Pending Requests' },
    { key: 'accepted',  icon: '✅', label: 'Accepted Jobs' },
    { key: 'history',   icon: '📋', label: 'Job History' },
    { key: 'schedule',  icon: '🗓️', label: 'My Schedule' },
    { key: 'kyc',       icon: '🛡️', label: 'KYC Verification' },
    { key: 'notifications', icon: '🔔', label: 'Notifications' },
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
      <main className="main-content" key={animationKey} style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Animated Background Blobs for Dashboard */}
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '40vw', height: '40vw', background: 'var(--gradient-primary)', filter: 'blur(120px)', opacity: 0.1, borderRadius: '50%', animation: 'bgDrift 20s infinite ease-in-out alternate-reverse', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '40vw', height: '40vw', background: 'var(--gradient-secondary)', filter: 'blur(120px)', opacity: 0.1, borderRadius: '50%', animation: 'bgDrift 25s infinite ease-in-out alternate', pointerEvents: 'none', zIndex: 0 }} />
        
        <div className="tab-transition" style={{ position: 'relative', zIndex: 1 }}>

          {/* OVERVIEW */}
          {tab === 'dashboard' && (
            <>
              <div className="page-header">
                <h1>Welcome, {profile?.firstName || 'Professional'} 👋</h1>
                <p>Manage your professional caregiving career seamlessly.</p>
              </div>
              <div className="stats-grid stagger">
                <div className="stat-card glass-card" onClick={() => changeTab('notifications')} style={{ cursor: 'pointer', background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(30,58,138,0.1))', border: '1px solid rgba(59,130,246,0.2)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: 'var(--accent-blue)', opacity: 0.2, filter: 'blur(30px)', borderRadius: '50%' }} />
                  <div className="stat-value" style={{ color: '#93c5fd', textShadow: '0 0 10px rgba(147,197,253,0.3)' }}>{notifications.filter(n => !n.isRead).length}</div>
                  <div className="stat-label" style={{ color: '#bfdbfe' }}>Unread Alerts</div>
                  <div style={{ position: 'absolute', right: 20, top: 20, fontSize: 36, opacity: 0.8, filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.5))' }}>🔔</div>
                </div>
                <div className="stat-card glass-card" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(120,53,15,0.1))', border: '1px solid rgba(245,158,11,0.2)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: 'var(--accent-amber)', opacity: 0.2, filter: 'blur(30px)', borderRadius: '50%' }} />
                  <div className="stat-value" style={{ color: '#fcd34d', textShadow: '0 0 10px rgba(252,211,77,0.3)' }}>{profile?.rating?.toFixed(1) || '0.0'}</div>
                  <div className="stat-label" style={{ color: '#fde68a' }}>Average Rating</div>
                  <div style={{ position: 'absolute', right: 20, top: 20, fontSize: 36, opacity: 0.8, filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.5))' }}>⭐</div>
                </div>
                <div className="stat-card glass-card" style={{ background: profile?.isActive ? 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,78,59,0.1))' : 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(127,29,29,0.1))', border: profile?.isActive ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: profile?.isActive ? 'var(--accent-green)' : 'var(--accent-red)', opacity: 0.2, filter: 'blur(30px)', borderRadius: '50%' }} />
                  <div className="stat-value" style={{ color: profile?.isActive ? '#6ee7b7' : '#fca5a5', textShadow: profile?.isActive ? '0 0 10px rgba(110,231,183,0.3)' : '0 0 10px rgba(252,165,165,0.3)' }}>{profile?.isActive ? 'Active' : 'Pending'}</div>
                  <div className="stat-label" style={{ color: profile?.isActive ? '#a7f3d0' : '#fecaca' }}>Account Status</div>
                  <div style={{ position: 'absolute', right: 20, top: 20, fontSize: 36, opacity: 0.8, filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.5))' }}>{profile?.isActive ? '🛡️' : '⏳'}</div>
                </div>
              </div>

              {/* Caregiver Schedule Calendar */}
              {(() => {
                const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                
                const calendarCells = [];
                for (let i = 0; i < firstDayIndex; i++) {
                  calendarCells.push(null);
                }
                for (let day = 1; day <= daysInMonth; day++) {
                  calendarCells.push(new Date(calendarYear, calendarMonth, day));
                }

                const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

                const allBookings = [...pendingBookings, ...acceptedBookings, ...historyBookings];

                const selectedDayBookings = selectedCalendarDate
                  ? allBookings.filter(b => new Date(b.serviceDate).toDateString() === selectedCalendarDate.toDateString())
                  : [];

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 28, marginTop: 32 }}>
                    
                    {/* Calendar Card */}
                    <div className="glass-card" style={{ padding: 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>📅 Work Schedule</h2>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => {
                            if (calendarMonth === 0) {
                              setCalendarMonth(11);
                              setCalendarYear(y => y - 1);
                            } else {
                              setCalendarMonth(m => m - 1);
                            }
                            setSelectedCalendarDate(null);
                          }} style={{ padding: '4px 10px', fontSize: 12 }}>←</button>
                          <span style={{ fontSize: 14, fontWeight: 700, alignSelf: 'center', minWidth: 110, textAlign: 'center' }}>
                            {monthNames[calendarMonth]} {calendarYear}
                          </span>
                          <button className="btn btn-ghost btn-sm" onClick={() => {
                            if (calendarMonth === 11) {
                              setCalendarMonth(0);
                              setCalendarYear(y => y + 1);
                            } else {
                              setCalendarMonth(m => m + 1);
                            }
                            setSelectedCalendarDate(null);
                          }} style={{ padding: '4px 10px', fontSize: 12 }}>→</button>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, textAlign: 'center', marginBottom: 10 }}>
                        {daysOfWeek.map(d => (
                          <div key={d} style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>{d}</div>
                        ))}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                        {calendarCells.map((dateObj, idx) => {
                          if (!dateObj) return <div key={`empty-${idx}`} />;
                          
                          const dayNum = dateObj.getDate();
                          const isSelected = selectedCalendarDate?.toDateString() === dateObj.toDateString();
                          
                          const dayBookings = allBookings.filter(b => new Date(b.serviceDate).toDateString() === dateObj.toDateString());
                          const hasPending = dayBookings.some(b => b.status === 'pending');
                          const hasAccepted = dayBookings.some(b => b.status === 'CAREGIVER_ACCEPTED' || b.status === 'APPROVED_BY_ADMIN');
                          const hasCompleted = dayBookings.some(b => b.status === 'completed');

                          return (
                            <button
                              key={dayNum}
                              onClick={() => setSelectedCalendarDate(dateObj)}
                              style={{
                                padding: '12px 0',
                                borderRadius: 12,
                                border: isSelected ? '2px solid var(--accent-cyan)' : '1.5px solid rgba(255,255,255,0.03)',
                                background: isSelected ? 'rgba(34, 211, 238, 0.1)' : 'rgba(255,255,255,0.02)',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 700,
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 4,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {dayNum}
                              <div style={{ display: 'flex', gap: 3, height: 5, justifyContent: 'center' }}>
                                {hasPending && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fbbf24' }} />}
                                {hasAccepted && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6' }} />}
                                {hasCompleted && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }} />}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 20, fontSize: 11, color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24' }} /> Pending
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} /> Confirmed
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} /> Completed
                        </div>
                      </div>

                    </div>

                    {/* Bookings List Card for Selected Day */}
                    <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
                      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>
                        📅 Day Schedule
                        {selectedCalendarDate && (
                          <span style={{ color: 'var(--accent-cyan)', fontSize: 13, display: 'block', fontWeight: 600, marginTop: 4 }}>
                            {selectedCalendarDate.toLocaleDateString(undefined, { dateStyle: 'long' })}
                          </span>
                        )}
                      </h2>

                      <div style={{ flex: 1, overflowY: 'auto', maxHeight: 310, display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4 }}>
                        {selectedDayBookings.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '40px 0', margin: 'auto', color: 'var(--text-muted)' }}>
                            <span style={{ fontSize: 32, display: 'block', marginBottom: 10 }}>⛱️</span>
                            <p style={{ margin: 0, fontSize: 13 }}>No bookings scheduled for this day.</p>
                          </div>
                        ) : (
                          selectedDayBookings.map(b => (
                            <div key={b.bookingId} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 16 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <span style={{ fontWeight: 800, fontSize: 14 }}>{b.clientName}</span>
                                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', padding: '4px 10px', borderRadius: 20, 
                                  background: b.status === 'pending' ? 'rgba(251,191,36,0.1)' : b.status === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                                  color: b.status === 'pending' ? '#fbbf24' : b.status === 'completed' ? '#10b981' : '#3b82f6',
                                  border: b.status === 'pending' ? '1px solid rgba(251,191,36,0.2)' : b.status === 'completed' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(59,130,246,0.2)'
                                }}>
                                  {b.status === 'CAREGIVER_ACCEPTED' ? 'Accepted' : b.status === 'APPROVED_BY_ADMIN' ? 'Approved' : b.status}
                                </span>
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div>📞 {b.clientPhone}</div>
                                <div>📍 {b.clientAddress}</div>
                                <div style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>⏰ {new Date(b.serviceDate).toLocaleTimeString(undefined, { timeStyle: 'short' })}</div>
                              </div>
                              
                              {/* Quick Actions inside Calendar */}
                              {b.status === 'pending' && (
                                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                                  <button className="btn btn-ghost btn-sm" onClick={() => handleReject(b.bookingId)} style={{ flex: 1, padding: '6px 0', fontSize: 12 }}>Reject</button>
                                  <button className="btn btn-primary btn-sm" onClick={() => handleAccept(b.bookingId)} style={{ flex: 1, padding: '6px 0', fontSize: 12 }}>Accept</button>
                                </div>
                              )}
                              {(b.status === 'CAREGIVER_ACCEPTED' || b.status === 'APPROVED_BY_ADMIN') && (
                                <button className="btn btn-primary btn-sm" onClick={() => handleComplete(b.bookingId)} style={{ width: '100%', marginTop: 12, padding: '6px 0', fontSize: 12 }}>
                                  Mark Completed ✔
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                );
              })()}

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

          {/* NOTIFICATIONS */}
          {tab === 'notifications' && (
            <>
              <div className="page-header">
                <h1>Notifications</h1>
                <p>Stay updated on your bookings and account activities.</p>
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
                    <h3 style={{ fontWeight: 700, color: 'var(--text-muted)' }}>No notifications yet</h3>
                  </div>
                )}
              </div>
            </>
          )}

          {/* KYC VERIFICATION */}
          {tab === 'kyc' && (
            <>
              <div className="page-header">
                <h1>KYC Verification</h1>
                <p>Upload your legal documents to get verified and start receiving bookings.</p>
              </div>
              <div className="glass-card-static" style={{ padding: 40, maxWidth: 760, marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800 }}>Verification Status</h2>
                  </div>
                  <span className={`badge ${profile?.kycStatus === 'APPROVED' ? 'badge-approved' : profile?.kycStatus === 'REJECTED' ? 'badge-rejected' : 'badge-pending'}`} style={{ fontSize: 14, padding: '8px 16px' }}>
                    {profile?.kycStatus === 'APPROVED' ? '✅ Approved & Verified' : profile?.kycStatus === 'SUBMITTED' ? '⏳ Under Review' : profile?.kycStatus === 'REJECTED' ? '❌ Rejected' : '⚠️ Action Required'}
                  </span>
                </div>
                
                {profile?.kycStatus === 'REJECTED' && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: 16, borderRadius: 12, marginBottom: 24, color: '#fca5a5', fontSize: 14 }}>
                    Your previous submission was rejected. Please ensure your documents are clear, valid, and match your profile details, then resubmit.
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">NID / Passport Number *</label>
                  <input className="input-glass" placeholder="Enter your 10 or 13 digit NID number" value={kycForm.nidNumber} onChange={e => setKycForm(p => ({ ...p, nidNumber: e.target.value }))} disabled={profile?.kycStatus === 'APPROVED' || profile?.kycStatus === 'SUBMITTED'} />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">NID Front Image *</label>
                    <input type="file" accept="image/*" className="input-glass" style={{ padding: '8px' }} onChange={e => handleKycUpload(e, 'nidFrontUrl')} disabled={profile?.kycStatus === 'APPROVED' || profile?.kycStatus === 'SUBMITTED'} />
                    {kycForm.nidFrontUrl && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--accent-green)' }}>✓ Uploaded</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">NID Back Image *</label>
                    <input type="file" accept="image/*" className="input-glass" style={{ padding: '8px' }} onChange={e => handleKycUpload(e, 'nidBackUrl')} disabled={profile?.kycStatus === 'APPROVED' || profile?.kycStatus === 'SUBMITTED'} />
                    {kycForm.nidBackUrl && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--accent-green)' }}>✓ Uploaded</div>}
                  </div>
                </div>

                {/* Live Face Verification Selfie */}
                <div className="form-group" style={{ marginBottom: 24 }}>
                  <label className="form-label">Real-time Selfie Photo (Face Verification) *</label>
                  
                  {isCameraActive ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 16, border: '1px solid var(--border-glass)' }}>
                      <div style={{ position: 'relative', width: 220, height: 220, borderRadius: '50%', overflow: 'hidden', border: '4px solid var(--accent-blue)', boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}>
                        <video id="webcam-video" autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}></video>
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn btn-primary" onClick={capturePhoto} style={{ fontSize: 13, padding: '8px 16px' }}>📸 Capture Photo</button>
                        <button className="btn btn-ghost" onClick={stopCamera} style={{ fontSize: 13, padding: '8px 16px', color: '#f87171' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, background: 'rgba(255,255,255,0.01)', padding: 16, borderRadius: 16, border: '1px dashed var(--border-glass-strong)' }}>
                      {kycForm.selfieUrl ? (
                        <img src={kycForm.selfieUrl} alt="selfie" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-green)' }} />
                      ) : (
                        <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>👤</div>
                      )}
                      
                      <div>
                        {kycForm.selfieUrl ? (
                          <div style={{ color: 'var(--accent-green)', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>✓ Live Selfie Captured Successfully</div>
                        ) : (
                          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>Please take a clear photo of your face using your webcam.</div>
                        )}
                        
                        {(profile?.kycStatus === 'PENDING' || profile?.kycStatus === 'REJECTED') && (
                          <button className="btn btn-ghost btn-sm" onClick={startCamera} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 16px' }}>
                            📷 {kycForm.selfieUrl ? 'Retake Photo' : 'Open Camera & Capture'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Professional Certificate / Nursing License (Optional but recommended)</label>
                  <input type="file" accept="image/*,.pdf" className="input-glass" style={{ padding: '8px' }} onChange={e => handleKycUpload(e, 'certificateUrl')} disabled={profile?.kycStatus === 'APPROVED' || profile?.kycStatus === 'SUBMITTED'} />
                  {kycForm.certificateUrl && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--accent-green)' }}>✓ Uploaded</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Recent Police Clearance Certificate (Optional)</label>
                  <input type="file" accept="image/*,.pdf" className="input-glass" style={{ padding: '8px' }} onChange={e => handleKycUpload(e, 'policeClearanceUrl')} disabled={profile?.kycStatus === 'APPROVED' || profile?.kycStatus === 'SUBMITTED'} />
                  {kycForm.policeClearanceUrl && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--accent-green)' }}>✓ Uploaded</div>}
                </div>

                {(profile?.kycStatus === 'PENDING' || profile?.kycStatus === 'REJECTED') && (
                  <button className="btn btn-primary btn-lg" onClick={handleSubmitKyc} style={{ width: '100%', marginTop: 16 }}>
                    🛡️ Submit for Verification
                  </button>
                )}
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
              <div className="glass-card-static" style={{ padding: 40, maxWidth: 760, marginBottom: 28 }}>

                {/* Profile Picture */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 36 }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {profile?.image ? (
                      <img
                        src={profile.image}
                        alt="Profile"
                        style={{ width: 96, height: 96, borderRadius: 24, objectFit: 'cover', border: '3px solid rgba(16,185,129,0.4)', boxShadow: '0 0 24px rgba(16,185,129,0.2)' }}
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{ width: 96, height: 96, borderRadius: 24, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, fontWeight: 900, color: '#fff', boxShadow: '0 0 24px rgba(16,185,129,0.2)' }}>
                        {profile?.firstName?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: -6, right: -6, width: 26, height: 26, borderRadius: '50%', background: profile?.isActive ? '#10b981' : '#f59e0b', border: '2px solid #0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                      {profile?.isActive ? '✓' : '⏳'}
                    </div>
                  </div>
                  <div>
                    <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>{profile?.firstName} {profile?.lastName}</h2>
                    <p style={{ color: 'var(--accent-cyan)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{profile?.profession || 'Professional Caregiver'}</p>
                    <p style={{ color: profile?.isActive ? '#6ee7b7' : '#fcd34d', fontSize: 12, marginTop: 4, fontWeight: 600 }}>{profile?.isActive ? '● Active' : '● Pending Approval'}</p>
                  </div>
                </div>

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
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Profile Picture (Optional)</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="input-glass" style={{ padding: '8px', width: '100%' }} />
                </div>
                <button className="btn btn-primary btn-lg" onClick={handleUpdateProfile} style={{ width: '100%', marginTop: 8 }}>
                  💾 Save Profile Changes
                </button>
              </div>

              {/* Danger Zone */}
              <div style={{ maxWidth: 760, padding: 28, border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, background: 'rgba(239,68,68,0.04)' }}>
                <h3 style={{ color: '#f87171', fontWeight: 800, fontSize: 16, marginBottom: 8 }}>⚠️ Danger Zone</h3>
                <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>Deleting your caregiver account will remove your profile from the platform. Clients will no longer find you. Your past booking history and audit logs will be preserved in the system for compliance purposes.</p>
                <button onClick={handleDeleteAccount} style={{ padding: '12px 28px', borderRadius: 12, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.5)', color: '#f87171', cursor: 'pointer', fontWeight: 700, fontSize: 14, transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}>
                  🗑️ Delete My Caregiver Account
                </button>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
