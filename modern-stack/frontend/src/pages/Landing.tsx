import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useModal } from '../components/ModalContext';

export default function Landing() {
  const [caregivers, setCaregivers] = useState<any[]>([]);
  const [professions, setProfessions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState({ profession: '', minExp: '', minRating: '', day: '' });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { showError, showModal } = useModal();

  useEffect(() => {
    loadCaregivers();
    loadProfessions();
  }, []);

  const loadCaregivers = async () => {
    setLoading(true);
    try {
      const data = await api.get('/caregivers');
      setCaregivers(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadProfessions = async () => {
    try {
      const data = await api.get('/caregivers/professions');
      setProfessions(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async () => {
    try {
      const data = await api.get(`/caregivers/search?profession=${searchQuery}`);
      setCaregivers(data);
    } catch (e: any) {
      showError('Search Failed', e.message);
    }
  };

  const applyFilter = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.profession) params.append('profession', filter.profession);
      if (filter.minExp) params.append('minExp', filter.minExp);
      if (filter.minRating) params.append('minRating', filter.minRating);
      if (filter.day) params.append('day', filter.day);

      const data = await api.get(`/caregivers/filter?${params.toString()}`);
      setCaregivers(data);
      setShowFilterModal(false);
    } catch (e: any) {
      showError('Filter Failed', e.message);
    }
  };

  const handleViewReviews = async (caregiverId: string) => {
    try {
      const data = await api.get(`/caregivers/${caregiverId}/reviews`);
      setReviews(data);
      setShowReviewsModal(true);
    } catch (e: any) {
      showError('Error', 'Failed to load reviews.');
    }
  };

  const handleBookClick = () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      navigate('/client');
    } else {
      showModal({
        title: 'Authentication Required',
        message: 'Please login or register to book a caregiver.',
        type: 'info'
      });
      navigate('/login');
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="page-container" style={{ display: 'block', minHeight: '100vh', padding: 0 }}>
      {/* HEADER */}
      <header style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '20px 40px', background: 'rgba(10,10,26,0.8)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-glass)', position: 'sticky', top: 0, zIndex: 50
      }}>
        <div style={{ fontSize: 24, fontWeight: 800, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🏥 CaregiverGO
        </div>
        <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {localStorage.getItem('userId') ? (
            <button className="btn btn-primary" onClick={() => {
              const role = localStorage.getItem('role');
              navigate(`/${role}`);
            }}>Go to Dashboard</button>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </>
          )}
        </nav>
      </header>

      {/* HERO SECTION */}
      <section style={{ textAlign: 'center', padding: '80px 20px', maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 48, fontWeight: 900, marginBottom: 20, lineHeight: 1.2 }}>
          Find the Perfect Caregiver for Your Loved Ones
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-secondary)', marginBottom: 40 }}>
          Professional, Verified, and Trusted Services.
        </p>

        {/* SEARCH BAR */}
        <div className="glass-card" style={{ display: 'flex', gap: 12, padding: 16, maxWidth: 600, margin: '0 auto' }}>
          <input 
            className="input-glass" 
            placeholder="Search by Profession (e.g. Nurse)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={handleSearch}>Search</button>
          <button className="btn btn-ghost" onClick={() => setShowFilterModal(true)}>
            Filters ⚙️
          </button>
        </div>
      </section>

      {/* CAREGIVERS GRID */}
      <main style={{ padding: '0 40px 60px', maxWidth: 1400, margin: '0 auto' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 30 }}>Featured Caregivers</h2>
        
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Loading caregivers...</p>
        ) : (
          <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {caregivers.map((cg) => (
              <div key={cg.userId} className="glass-card fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{cg.firstName} {cg.lastName}</h3>
                    <span style={{ color: 'var(--accent-cyan)', fontSize: 14, fontWeight: 600 }}>{cg.profession || 'Caregiver'}</span>
                  </div>
                  <div className="badge badge-approved" style={{ fontSize: 14 }}>★ {cg.rating?.toFixed(1) || '0.0'}</div>
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>
                    📍 {cg.presentAddress || 'Location not specified'}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
                    🔧 {cg.experienceYears || 0} years experience
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleBookClick}>
                    📅 Book
                  </button>
                  <button className="btn btn-ghost" onClick={() => handleViewReviews(cg.userId)}>
                    Reviews
                  </button>
                </div>
              </div>
            ))}
            {caregivers.length === 0 && (
              <p style={{ color: 'var(--text-muted)', gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>
                No caregivers found matching your criteria.
              </p>
            )}
          </div>
        )}
      </main>

      {/* FILTER MODAL */}
      {showFilterModal && (
        <div className="modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div className="modal-glass" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Advanced Filter</h3>
            
            <div className="form-group">
              <label className="form-label">Profession</label>
              <select className="select-glass" value={filter.profession} onChange={e => setFilter(p => ({...p, profession: e.target.value}))}>
                <option value="">Any Profession</option>
                {professions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Min Experience (Years)</label>
              <input type="number" className="input-glass" placeholder="e.g. 2" value={filter.minExp} onChange={e => setFilter(p => ({...p, minExp: e.target.value}))} />
            </div>

            <div className="form-group">
              <label className="form-label">Min Rating</label>
              <select className="select-glass" value={filter.minRating} onChange={e => setFilter(p => ({...p, minRating: e.target.value}))}>
                <option value="">Any Rating</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars & Up</option>
                <option value="3">3 Stars & Up</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Availability</label>
              <select className="select-glass" value={filter.day} onChange={e => setFilter(p => ({...p, day: e.target.value}))}>
                <option value="">Any Day</option>
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="modal-actions" style={{ marginTop: 24 }}>
              <button className="btn btn-ghost" onClick={() => setShowFilterModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={applyFilter}>Apply Filter</button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEWS MODAL */}
      {showReviewsModal && (
        <div className="modal-overlay" onClick={() => setShowReviewsModal(false)}>
          <div className="modal-glass" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 className="modal-title" style={{ margin: 0 }}>Caregiver Reviews</h3>
              <button style={{ background: 'none', border: 'none', color: 'white', fontSize: 24, cursor: 'pointer' }} onClick={() => setShowReviewsModal(false)}>&times;</button>
            </div>

            <div style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 10 }}>
              {reviews.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No reviews yet.</p>
              ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                  {reviews.map((r) => (
                    <div key={r.reviewId} style={{ background: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12, border: '1px solid var(--border-glass)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.reviewerName}</span>
                        <span style={{ color: '#fbbf24' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{r.comment || 'No comment provided.'}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
