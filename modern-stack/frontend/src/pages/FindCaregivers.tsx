import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useModal } from '../components/ModalContext';

export default function FindCaregivers() {
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
    try { setCaregivers(await api.get('/caregivers')); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadProfessions = async () => {
    try { setProfessions(await api.get('/caregivers/professions')); }
    catch (e) { console.error(e); }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/caregivers/search?profession=${searchQuery}`);
      setCaregivers(data);
    } catch (e: any) { showError('Search Failed', e.message); }
    finally { setLoading(false); }
  };

  const applyFilter = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.profession) params.append('profession', filter.profession);
      if (filter.minExp) params.append('minExp', filter.minExp);
      if (filter.minRating) params.append('minRating', filter.minRating);
      if (filter.day) params.append('day', filter.day);
      setCaregivers(await api.get(`/caregivers/filter?${params}`));
      setShowFilterModal(false);
    } catch (e: any) { showError('Filter Failed', e.message); }
    finally { setLoading(false); }
  };

  const handleViewReviews = async (caregiverId: string) => {
    try {
      setReviews(await api.get(`/caregivers/${caregiverId}/reviews`));
      setShowReviewsModal(true);
    } catch { showError('Error', 'Failed to load reviews.'); }
  };

  const handleBookClick = () => {
    const userId = localStorage.getItem('userId');
    if (userId) { navigate('/client'); }
    else {
      showModal({ title: 'Authentication Required', message: 'Please login or register to book a caregiver.', type: 'info' });
      navigate('/login');
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="fade-in" style={{ minHeight: '100vh', paddingTop: 90, paddingBottom: 80, background: 'var(--bg-primary)' }}>
      {/* Header section similar to auth pages */}
      <div style={{ padding: '0 5%', maxWidth: 1480, margin: '0 auto', marginBottom: 40 }}>
        <button onClick={() => navigate('/')} style={{ display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:50,padding:'10px 18px',color:'rgba(255,255,255,0.85)',cursor:'pointer',fontSize:14,fontWeight:600,backdropFilter:'blur(12px)',marginBottom:30,transition:'all 0.25s ease' }}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(59,130,246,0.15)';}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.07)';}}>
          ← Back to Home
        </button>
        
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 16 }}>
            Find Your <span className="text-gradient">Perfect Caregiver</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 18, maxWidth: 600, margin: '0 auto' }}>
            Browse our network of verified professionals and find the best match for your loved ones.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="glass-card" style={{ padding: 24, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
          <div style={{ flex: 1, minWidth: 280, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }}>🔍</span>
            <input
              type="text"
              placeholder="Search by profession (e.g. Nurse)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="input-glass"
              style={{ paddingLeft: 44, margin: 0 }}
            />
          </div>
          <button className="btn btn-primary" onClick={handleSearch}>Search</button>
          <button className="btn btn-ghost" onClick={() => setShowFilterModal(true)} style={{ background: 'rgba(255,255,255,0.05)' }}>
            Advanced Filter ⚙️
          </button>
        </div>

        {/* Grid */}
        <div className="stagger" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Available Professionals</h2>
          <span className="badge badge-reviewed" style={{ fontSize: 14, padding: '6px 16px' }}>{caregivers.length} Results</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 100, gap: 16 }}>
            <div style={{ width: 48, height: 48, border: '4px solid rgba(255,255,255,0.08)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Loading caregivers…</span>
          </div>
        ) : (
          <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 28 }}>
            {caregivers.map(cg => (
              <div key={cg.userId} className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: 'var(--gradient-primary)', filter: 'blur(60px)', opacity: 0.18, borderRadius: '50%', pointerEvents: 'none' }} />
                
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 22 }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: 20,
                    background: 'linear-gradient(135deg, #1e3a5f, #1e1b4b)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, fontWeight: 800,
                    border: '2px solid rgba(59,130,246,0.25)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                    flexShrink: 0, color: '#93c5fd',
                  }}>
                    {cg.firstName?.[0]?.toUpperCase() || '👨‍⚕️'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cg.firstName} {cg.lastName}
                    </h3>
                    <span style={{ color: 'var(--accent-cyan)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                      {cg.profession || 'Caregiver'}
                    </span>
                  </div>
                  <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>★ {cg.rating?.toFixed(1) || '0.0'}</div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px 16px', borderRadius: 14, marginBottom: 22, border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Experience</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>{cg.experienceYears || 0} Years</span>
                  </div>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.04)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Location</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, textAlign: 'right', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cg.presentAddress || 'Anywhere'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleBookClick}>📅 Book Now</button>
                  <button className="btn btn-ghost" onClick={() => handleViewReviews(cg.userId)}>💬 Reviews</button>
                </div>
              </div>
            ))}
            {caregivers.length === 0 && (
              <div className="glass-card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: 80 }}>
                <span style={{ fontSize: 52, display: 'block', marginBottom: 16 }}>🔍</span>
                <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>No matches found</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>Try adjusting your filters or searching for a different profession.</p>
                <button className="btn btn-primary btn-pill" style={{ marginTop: 24 }} onClick={() => { setSearchQuery(''); setFilter({ profession: '', minExp: '', minRating: '', day: '' }); loadCaregivers(); }}>Reset & Show All</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FILTER MODAL */}
      {showFilterModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowFilterModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 99999 }}>
          <div className="modal-glass" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 className="modal-title" style={{ margin: 0 }}>Advanced Filter ⚙️</h3>
              <button onClick={() => setShowFilterModal(false)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-glass)', color: 'white', width: 38, height: 38, borderRadius: 12, cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            <div className="form-group">
              <label className="form-label">Profession</label>
              <select className="select-glass" value={filter.profession} onChange={e => setFilter(p => ({ ...p, profession: e.target.value }))}>
                <option value="">Any Profession</option>
                {professions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Min Experience (Years)</label>
              <input type="number" className="input-glass" placeholder="e.g. 2" value={filter.minExp} onChange={e => setFilter(p => ({ ...p, minExp: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Minimum Rating</label>
              <select className="select-glass" value={filter.minRating} onChange={e => setFilter(p => ({ ...p, minRating: e.target.value }))}>
                <option value="">Any Rating</option>
                <option value="5">🌟 5 Stars</option>
                <option value="4">⭐ 4+ Stars</option>
                <option value="3">👍 3+ Stars</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Availability Day</label>
              <select className="select-glass" value={filter.day} onChange={e => setFilter(p => ({ ...p, day: e.target.value }))}>
                <option value="">Any Day</option>
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="modal-actions" style={{ marginTop: 32 }}>
              <button className="btn btn-ghost" onClick={() => setShowFilterModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={applyFilter}>Apply Filter ✨</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* REVIEWS MODAL */}
      {showReviewsModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowReviewsModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 99999 }}>
          <div className="modal-glass" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 className="modal-title" style={{ margin: 0 }}>Client Reviews 💬</h3>
              <button onClick={() => setShowReviewsModal(false)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-glass)', color: 'white', width: 38, height: 38, borderRadius: 12, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            <div style={{ maxHeight: 420, overflowY: 'auto', paddingRight: 8 }}>
              {reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48 }}>
                  <span style={{ fontSize: 44, display: 'block', marginBottom: 12 }}>📭</span>
                  <p style={{ color: 'var(--text-muted)' }}>No reviews yet for this professional.</p>
                </div>
              ) : (
                <div className="stagger" style={{ display: 'grid', gap: 14 }}>
                  {reviews.map(r => (
                    <div key={r.reviewId} style={{ background: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 16, border: '1px solid var(--border-glass)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>{r.reviewerName?.[0] || 'U'}</div>
                          <span style={{ fontWeight: 700 }}>{r.reviewerName}</span>
                        </div>
                        <span style={{ color: '#fbbf24', letterSpacing: 2 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.65 }}>"{r.comment || 'No comment provided.'}"</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 10, textAlign: 'right' }}>{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
