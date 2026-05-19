import { useNavigate } from 'react-router-dom';
import { useReveal } from '../hooks/useReveal';

export default function Landing() {
  const navigate = useNavigate();
  
  const { ref: heroRef, show: heroShow } = useReveal(100);
  const { ref: feature1Ref, show: feature1Show } = useReveal(200);
  const { ref: feature2Ref, show: feature2Show } = useReveal(200);
  const { ref: feature3Ref, show: feature3Show } = useReveal(200);
  const { ref: ctaRef, show: ctaShow } = useReveal(200);

  return (
    <div style={{ overflowX: 'hidden' }}>
      {/* ── TOP NAVBAR ─────────────────────────────────────── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, padding: '20px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ width: 36, height: 36, background: 'var(--gradient-primary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 4px 20px rgba(59,130,246,0.4)' }}>📘</div>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>Caregiver<span style={{ color: 'var(--accent-blue)' }}>GO</span></span>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <button className="btn btn-ghost" style={{ padding: '8px 20px' }} onClick={() => navigate('/login')}>Login</button>
          <button className="btn btn-primary" style={{ padding: '8px 24px', borderRadius: 100 }} onClick={() => navigate('/register')}>Sign Up Free</button>
        </div>
      </nav>
      {/* ── HERO SECTION ───────────────────────────────────── */}
      <section style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative',
        padding: '80px 5% 0 5%',
        background: 'var(--bg-primary)',
        overflow: 'hidden'
      }}>
        {/* Animated Background Elements */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw', background: 'var(--gradient-primary)', filter: 'blur(100px)', opacity: 0.15, borderRadius: '50%', animation: 'bgDrift 20s infinite ease-in-out alternate' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '60vw', height: '60vw', background: 'var(--gradient-secondary)', filter: 'blur(120px)', opacity: 0.1, borderRadius: '50%', animation: 'bgDrift 25s infinite ease-in-out alternate-reverse' }} />
        
        <div 
          ref={heroRef} 
          className={`reveal-scale ${heroShow ? 'show' : ''}`}
          style={{ 
            maxWidth: 1000, 
            textAlign: 'center', 
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '8px 20px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 100, marginBottom: 32, color: 'var(--accent-blue)', fontWeight: 600, letterSpacing: 0.5 }}>
            <span style={{ position: 'relative', display: 'flex', height: 10, width: 10 }}>
              <span style={{ animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite', position: 'absolute', inlineSize: '100%', blockSize: '100%', borderRadius: '50%', backgroundColor: 'var(--accent-blue)', opacity: 0.75 }}></span>
              <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', height: 10, width: 10, backgroundColor: 'var(--accent-blue)' }}></span>
            </span>
            Platform Live Now
          </div>
          
          <h1 style={{ fontSize: 'clamp(48px, 8vw, 84px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-2px', marginBottom: 24, color: 'var(--text-primary)' }}>
            Find the Perfect <br />
            <span className="text-gradient">Caregiver</span> Today.
          </h1>
          
          <p style={{ fontSize: 'clamp(18px, 3vw, 24px)', color: 'var(--text-secondary)', marginBottom: 48, maxWidth: 680, lineHeight: 1.6 }}>
            Connecting families with compassionate, verified professionals for unparalleled care and peace of mind.
          </p>
          
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn btn-primary" style={{ fontSize: 18, padding: '16px 40px', borderRadius: 100 }} onClick={() => navigate('/find-caregivers')}>
              Find Caregivers 🔍
            </button>
            <button className="btn btn-ghost" style={{ fontSize: 18, padding: '16px 40px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }} onClick={() => navigate('/register')}>
              Join as Professional →
            </button>
          </div>
        </div>
      </section>

      {/* ── STORY SECTION 1 ─────────────────────────────────── */}
      <section style={{ padding: '120px 5%', background: 'var(--bg-secondary)', position: 'relative' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 80, flexWrap: 'wrap' }}>
          <div ref={feature1Ref} className={`reveal-left ${feature1Show ? 'show' : ''}`} style={{ flex: '1 1 500px' }}>
            <h2 style={{ fontSize: 'clamp(36px, 5vw, 54px)', fontWeight: 800, marginBottom: 24, lineHeight: 1.2 }}>
              Verified Professionals,<br/> <span className="text-gradient">Trusted Care.</span>
            </h2>
            <p style={{ fontSize: 20, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 32 }}>
              Every caregiver on our platform undergoes a rigorous background check, interview process, and skill verification. We ensure that your loved ones are in the safest hands possible.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                'Comprehensive Background Checks',
                'Verified Reviews & Ratings',
                'Detailed Professional Profiles'
              ].map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 18, color: 'var(--text-primary)', fontWeight: 500 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>✓</div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div ref={feature2Ref} className={`reveal-right ${feature2Show ? 'show' : ''}`} style={{ flex: '1 1 400px', position: 'relative' }}>
            <div style={{ position: 'relative', borderRadius: 32, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', height: 400 }}>
              <img src="https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?q=80&w=1200&auto=format&fit=crop" alt="Caring professional" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 30, background: 'linear-gradient(to top, rgba(15,23,42,0.95), transparent)' }}>
                <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: 'white' }}>Safety First 🛡️</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, lineHeight: 1.5 }}>Our multi-step verification process guarantees peace of mind.</p>
              </div>
            </div>
            <div style={{ position: 'absolute', top: -30, right: -30, width: '100%', height: '100%', background: 'var(--gradient-primary)', filter: 'blur(80px)', opacity: 0.2, zIndex: -1, borderRadius: 32 }} />
          </div>
        </div>
      </section>

      {/* ── STORY SECTION 2 ─────────────────────────────────── */}
      <section style={{ padding: '120px 5%', position: 'relative' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 80, flexWrap: 'wrap-reverse' }}>
          
          <div ref={feature3Ref} className={`reveal-scale ${feature3Show ? 'show' : ''}`} style={{ flex: '1 1 400px', position: 'relative' }}>
            <div style={{ position: 'relative', borderRadius: 32, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', height: 400 }}>
              <img src="https://images.pexels.com/photos/3768131/pexels-photo-3768131.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Smiling caregiver" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 30, background: 'linear-gradient(to top, rgba(15,23,42,0.95), transparent)' }}>
                <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: 'white' }}>Instant Booking ⚡</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, lineHeight: 1.5 }}>Find the right match and secure their services in just a few clicks.</p>
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: -30, left: -30, width: '100%', height: '100%', background: 'var(--gradient-secondary)', filter: 'blur(80px)', opacity: 0.2, zIndex: -1, borderRadius: 32 }} />
          </div>

          <div ref={ctaRef} className={`reveal-right ${ctaShow ? 'show' : ''}`} style={{ flex: '1 1 500px' }}>
            <h2 style={{ fontSize: 'clamp(36px, 5vw, 54px)', fontWeight: 800, marginBottom: 24, lineHeight: 1.2 }}>
              Seamless Experience, <br/><span className="text-gradient">Zero Hassle.</span>
            </h2>
            <p style={{ fontSize: 20, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 32 }}>
              From browsing profiles to scheduling appointments and managing payments, CaregiverGO simplifies every step of the process.
            </p>
            <button className="btn btn-primary" style={{ fontSize: 18, padding: '16px 40px', borderRadius: 100 }} onClick={() => navigate('/find-caregivers')}>
              Start Browsing Now →
            </button>
          </div>

        </div>
      </section>

      {/* ── CALL TO ACTION ─────────────────────────────────── */}
      <section style={{ padding: '120px 5%', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
         <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100vw', height: '100%', background: 'var(--gradient-primary)', filter: 'blur(150px)', opacity: 0.1, zIndex: 0 }} />
         
         <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 900, marginBottom: 24 }}>Ready to get started?</h2>
            <p style={{ fontSize: 22, color: 'var(--text-secondary)', marginBottom: 40 }}>Join thousands of families who have found their perfect caregiver match.</p>
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
              <button className="btn btn-primary" style={{ fontSize: 20, padding: '18px 48px', borderRadius: 100 }} onClick={() => navigate('/register')}>
                Create Free Account
              </button>
            </div>
         </div>
      </section>
    </div>
  );
}
