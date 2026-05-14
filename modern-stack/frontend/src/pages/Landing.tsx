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
  const [scrolled, setScrolled] = useState(false);

  const navigate = useNavigate();
  const { showError, showModal } = useModal();

  useEffect(() => {
    loadCaregivers();
    loadProfessions();
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
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
      const data = await api.get(`/caregivers/search?profession=${searchQuery}`);
      setCaregivers(data);
      document.getElementById('caregivers-section')?.scrollIntoView({ behavior: 'smooth' });
    } catch (e: any) { showError('Search Failed', e.message); }
  };

  const applyFilter = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.profession) params.append('profession', filter.profession);
      if (filter.minExp) params.append('minExp', filter.minExp);
      if (filter.minRating) params.append('minRating', filter.minRating);
      if (filter.day) params.append('day', filter.day);
      setCaregivers(await api.get(`/caregivers/filter?${params}`));
      setShowFilterModal(false);
      document.getElementById('caregivers-section')?.scrollIntoView({ behavior: 'smooth' });
    } catch (e: any) { showError('Filter Failed', e.message); }
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

  const stats = [
    { value: '500+', label: 'Verified Caregivers' },
    { value: '10K+', label: 'Happy Families' },
    { value: '4.9★', label: 'Average Rating' },
    { value: '24/7', label: 'Always Available' },
  ];

  const services = [
    { img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop', title: 'Medical Nursing', desc: 'Registered nurses providing post-surgery recovery, medication administration, and vital monitoring.', icon: '🏥' },
    { img: 'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=600&auto=format&fit=crop', title: 'Elderly Care', desc: 'Compassionate daily living assistance, mobility support, and engaging companionship for seniors.', icon: '👴' },
    { img: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&auto=format&fit=crop', title: 'Specialized Support', desc: 'Trained professionals equipped to handle specific physical or cognitive needs with utmost patience.', icon: '💊' },
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* ── STICKY HEADER ─────────────────────────────────── */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 5%', height: 70,
        background: scrolled ? 'rgba(5,5,15,0.92)' : 'rgba(5,5,15,0.6)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        transition: 'all 0.4s ease',
        boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.5)' : 'none',
      }}>
        <div style={{ fontSize: 24, fontWeight: 900, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px', flexShrink: 0 }}>
          🏥 CaregiverGO
        </div>

        {/* Search bar — hidden on small screens via opacity trick */}
        <div className="glass" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 14px', borderRadius: 50, flex: '0 1 380px',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <span style={{ fontSize: 16, opacity: 0.7 }}>🔍</span>
          <input
            type="text"
            placeholder="Search by profession…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'white', flex: 1, fontSize: 14, minWidth: 0 }}
          />
          <button className="btn btn-primary btn-sm btn-pill" style={{ padding: '6px 16px', fontSize: 13 }} onClick={handleSearch}>Find</button>
        </div>

        <nav style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
          {localStorage.getItem('userId') ? (
            <button className="btn btn-primary btn-pill" onClick={() => navigate(`/${localStorage.getItem('role')}`)}>Dashboard 🚀</button>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-pill">Login</Link>
              <Link to="/register" className="btn btn-primary btn-pill">Sign Up Free</Link>
            </>
          )}
        </nav>
      </header>

      {/* ── HERO SECTION ──────────────────────────────────── */}
      <section style={{
        position: 'relative',
        minHeight: '92vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '100px 5% 60px',
        overflow: 'hidden',
      }}>
        {/* BG image */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2940&auto=format&fit=crop)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(5,5,15,0.88) 0%, rgba(15,12,41,0.75) 50%, rgba(5,5,15,0.92) 100%)' }} />
        </div>

        {/* Animated orbs */}
        <div style={{ position: 'absolute', top: '20%', left: '5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', borderRadius: '50%', animation: 'bgDrift 8s ease-in-out infinite', zIndex: 1 }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '8%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', borderRadius: '50%', animation: 'bgDrift 12s ease-in-out infinite reverse', zIndex: 1 }} />

        <div className="stagger" style={{ textAlign: 'center', maxWidth: 860, zIndex: 2, position: 'relative' }}>
          <div className="hero-badge" style={{ marginBottom: 28 }}>
            ✨ Trusted by 10,000+ families across the country
          </div>
          <h1 style={{
            fontSize: 'clamp(38px, 5.5vw, 72px)',
            fontWeight: 900, lineHeight: 1.08,
            marginBottom: 24,
            letterSpacing: '-1.5px',
            textShadow: '0 4px 30px rgba(0,0,0,0.5)',
          }}>
            Expert Care For The Ones{' '}
            <span style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200%', animation: 'shimmer 4s linear infinite' }}>
              You Love Most.
            </span>
          </h1>
          <p style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: 'rgba(240,244,255,0.8)',
            marginBottom: 44, lineHeight: 1.65,
            maxWidth: 680, margin: '0 auto 44px',
            textShadow: '0 2px 10px rgba(0,0,0,0.4)',
          }}>
            Connect with highly qualified, compassionate, and background-verified professionals ready to provide top-tier caregiving services right to your door.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-xl"
              onClick={() => document.getElementById('caregivers-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Browse Caregivers ↓
            </button>
            <button
              className="btn btn-ghost btn-xl"
              style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
              onClick={() => setShowFilterModal(true)}
            >
              Advanced Filter ⚙️
            </button>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex', gap: 0, justifyContent: 'center',
            marginTop: 64, flexWrap: 'wrap',
          }}>
            {stats.map((s, i) => (
              <div key={i} style={{
                padding: '20px 36px',
                borderRight: i < stats.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.8)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 4, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES SECTION ───────────────────────────────── */}
      <section id="services" style={{ padding: '100px 5%', background: 'var(--bg-secondary)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(to right, transparent, rgba(59,130,246,0.3), transparent)' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="stagger" style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent-blue)', marginBottom: 16 }}>What We Offer</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800, marginBottom: 16, letterSpacing: '-0.8px' }}>
              Our Story &amp; Services
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 18, maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
              We believe everyone deserves compassionate, reliable, and professional care in the comfort of their home.
            </p>
          </div>

          <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
            {services.map((s, i) => (
              <div key={i} className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>
                <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
                  <img src={s.img} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,5,15,0.8) 0%, transparent 50%)' }} />
                  <div style={{ position: 'absolute', bottom: 16, left: 20, fontSize: 32 }}>{s.icon}</div>
                </div>
                <div style={{ padding: '28px 28px 32px' }}>
                  <h3 style={{ fontSize: 21, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.3px' }}>{s.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 14.5 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAREGIVERS GRID ────────────────────────────────── */}
      <main id="caregivers-section" style={{ padding: '100px 5%', maxWidth: 1480, margin: '0 auto', width: '100%' }}>
        <div className="stagger" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent-purple)', marginBottom: 10 }}>Our Network</div>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, letterSpacing: '-0.5px' }}>Featured Professionals</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span className="badge badge-reviewed" style={{ fontSize: 14, padding: '8px 18px' }}>{caregivers.length} Available</span>
            <button className="btn btn-ghost btn-pill" onClick={() => setShowFilterModal(true)}>Filter ⚙️</button>
          </div>
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
                {/* Glow accent */}
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
                <button className="btn btn-primary btn-pill" style={{ marginTop: 24 }} onClick={loadCaregivers}>Reset & Show All</button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── FILTER MODAL ──────────────────────────────────── */}
      {showFilterModal && (
        <div className="modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div className="modal-glass" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Advanced Filter ⚙️</h3>
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
        </div>
      )}

      {/* ── REVIEWS MODAL ─────────────────────────────────── */}
      {showReviewsModal && (
        <div className="modal-overlay" onClick={() => setShowReviewsModal(false)}>
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
                      <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 10, textAlign: 'right' }}>{new Date(r.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
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
