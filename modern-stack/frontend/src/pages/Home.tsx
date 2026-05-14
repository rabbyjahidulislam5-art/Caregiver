import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function Home() {
  const [caregivers, setCaregivers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState({ profession: '', minExp: '', minRating: '', day: '' });
  const [professions, setProfessions] = useState<string[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showReviews, setShowReviews] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCaregivers();
    loadProfessions();
  }, []);

  const loadCaregivers = async () => {
    setLoading(true);
    try { setCaregivers(await api.get('/caregivers')); } catch { setCaregivers([]); }
    setLoading(false);
  };

  const loadProfessions = async () => {
    try { setProfessions(await api.get('/caregivers/professions')); } catch {}
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/caregivers/search?profession=${encodeURIComponent(searchQuery)}`);
      setCaregivers(data);
    } catch { setCaregivers([]); }
    setLoading(false);
  };

  const handleFilter = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.profession) params.append('profession', filter.profession);
      if (filter.minExp) params.append('minExp', filter.minExp);
      if (filter.minRating) params.append('minRating', filter.minRating);
      if (filter.day) params.append('day', filter.day);
      const data = await api.get(`/caregivers/filter?${params.toString()}`);
      setCaregivers(data);
      setShowFilter(false);
    } catch { setCaregivers([]); }
    setLoading(false);
  };

  const viewReviews = async (caregiverId: string, name: string) => {
    try {
      setReviewName(name);
      setReviews(await api.get(`/caregivers/${caregiverId}/reviews`));
      setShowReviews(true);
    } catch { setReviews([]); setShowReviews(true); }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* NAVBAR */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(10, 10, 26, 0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-glass)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 40px',
      }}>
        <div style={{ fontSize: 22, fontWeight: 800, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🏥 CaregiverGO
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>Home</Link>
          <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        paddingTop: 140, paddingBottom: 60, textAlign: 'center',
        background: 'radial-gradient(ellipse at center top, rgba(99, 102, 241, 0.12) 0%, transparent 60%)',
      }}>
        <h1 style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.15, marginBottom: 16, letterSpacing: -1 }}>
          Find the Perfect Caregiver<br />
          <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            for Your Loved Ones
          </span>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.6 }}>
          Professional, verified, and trusted caregiving services. Browse our caregivers and book the perfect match.
        </p>

        {/* SEARCH */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', padding: '0 20px' }}>
          <input
            className="input-glass"
            placeholder="Search by profession (e.g. Nurse, Therapist)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            style={{ maxWidth: 400, background: 'rgba(255,255,255,0.06)' }}
            id="home-search"
          />
          <button className="btn btn-primary" onClick={handleSearch} id="home-search-btn">🔍 Search</button>
          <button className="btn btn-ghost" onClick={() => setShowFilter(true)} id="home-filter-btn">⚙️ Filter</button>
        </div>
      </section>

      {/* FEATURED CAREGIVERS */}
      <section style={{ padding: '40px 40px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Featured Caregivers</h2>
          <button className="btn btn-ghost btn-sm" onClick={loadCaregivers}>Refresh</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            Loading caregivers...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }} className="stagger">
            {caregivers.map(cg => (
              <div key={cg.userId} className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 14,
                    background: 'var(--gradient-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, fontWeight: 700, flexShrink: 0,
                  }}>
                    {cg.firstName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{cg.firstName} {cg.lastName}</h3>
                    <p style={{ color: 'var(--accent-cyan)', fontSize: 13, fontWeight: 600 }}>{cg.profession || 'Caregiver'}</p>
                  </div>
                  <div className="badge badge-approved" style={{ height: 'fit-content' }}>★ {cg.rating?.toFixed(1) || '0.0'}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--border-glass)' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Experience</p>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>{cg.experienceYears || 0} Years</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--border-glass)' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Location</p>
                    <p style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cg.presentAddress || 'N/A'}</p>
                  </div>
                </div>

                {cg.schedules && cg.schedules.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Availability</p>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {cg.schedules.slice(0, 4).map((s: any, i: number) => (
                        <span key={i} style={{
                          padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                          background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(99, 102, 241, 0.2)',
                        }}>
                          {s.dayOfWeek?.slice(0, 3)} {s.startTime}-{s.endTime}
                        </span>
                      ))}
                      {cg.schedules.length > 4 && <span style={{ fontSize: 11, color: 'var(--text-muted)', padding: '3px 4px' }}>+{cg.schedules.length - 4} more</span>}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => viewReviews(cg.userId, `${cg.firstName} ${cg.lastName}`)} style={{ flex: 1 }}>
                    💬 Reviews
                  </button>
                  <Link to="/register" className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                    📅 Book Now
                  </Link>
                </div>
              </div>
            ))}
            {caregivers.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                <p style={{ fontSize: 16 }}>No caregivers found. Try a different search or check back later.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* FILTER MODAL */}
      {showFilter && (
        <div className="modal-overlay" onClick={() => setShowFilter(false)}>
          <div className="modal-glass" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <h3 className="modal-title" style={{ marginBottom: 20 }}>⚙️ Advanced Filter</h3>

            <div className="form-group">
              <label className="form-label">Profession</label>
              <select className="select-glass" value={filter.profession} onChange={e => setFilter(p => ({ ...p, profession: e.target.value }))}>
                <option value="">Any</option>
                {professions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Min Experience (Years)</label>
              <input className="input-glass" type="number" placeholder="e.g. 2" value={filter.minExp} onChange={e => setFilter(p => ({ ...p, minExp: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Min Rating</label>
              <select className="select-glass" value={filter.minRating} onChange={e => setFilter(p => ({ ...p, minRating: e.target.value }))}>
                <option value="">Any</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars & Up</option>
                <option value="3">3 Stars & Up</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Availability</label>
              <select className="select-glass" value={filter.day} onChange={e => setFilter(p => ({ ...p, day: e.target.value }))}>
                <option value="">Any Day</option>
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowFilter(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleFilter}>Apply Filter</button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEWS MODAL */}
      {showReviews && (
        <div className="modal-overlay" onClick={() => setShowReviews(false)}>
          <div className="modal-glass" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <h3 className="modal-title" style={{ marginBottom: 20 }}>💬 Reviews for {reviewName}</h3>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {reviews.length > 0 ? reviews.map((r: any) => (
                <div key={r.reviewId} style={{
                  padding: 16, marginBottom: 12, borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{r.reviewerName}</span>
                    <span style={{ color: '#fbbf24', fontSize: 14 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>{r.comment || 'No comment'}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 6 }}>{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              )) : (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No reviews yet for this caregiver.</p>
              )}
            </div>
            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button className="btn btn-primary" onClick={() => setShowReviews(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
