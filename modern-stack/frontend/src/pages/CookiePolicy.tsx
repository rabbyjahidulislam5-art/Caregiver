import { useNavigate } from 'react-router-dom';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 40 }}>
    <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 14, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 4, height: 22, background: 'linear-gradient(135deg,#10b981,#06b6d4)', borderRadius: 4, display: 'inline-block' }} />
      {title}
    </h2>
    <div style={{ color: 'rgba(148,163,184,0.9)', lineHeight: 1.85, fontSize: 15 }}>{children}</div>
  </div>
);

export default function CookiePolicy() {
  const navigate = useNavigate();
  return (
    <div className="fade-in" style={{ minHeight: '100vh', padding: '100px 5% 80px', maxWidth: 900, margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} style={{ display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:50,padding:'10px 18px',color:'rgba(255,255,255,0.85)',cursor:'pointer',fontSize:14,fontWeight:600,backdropFilter:'blur(12px)',marginBottom:40,transition:'all 0.25s ease' }}
        onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(16,185,129,0.15)';}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.07)';}}>
        ← Go Back
      </button>

      <div style={{ marginBottom: 52 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent-green)', marginBottom: 12 }}>Legal</div>
        <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 16 }}>Cookie Policy</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>Last updated: May 14, 2026 &nbsp;·&nbsp; This policy explains how we use cookies</p>
      </div>

      <div className="glass-card-static" style={{ padding: '48px 52px' }}>
        <Section title="1. What Are Cookies?">
          <p>Cookies are small text files that are stored on your device (computer, tablet, or phone) when you visit a website. They are widely used to make websites work more efficiently, as well as to provide information to the site owners about user behavior and preferences.</p>
          <p style={{ marginTop: 12 }}>CaregiverGO uses a minimal, privacy-respecting approach to cookies and browser storage — prioritizing only what is strictly necessary for the platform to function correctly.</p>
        </Section>

        <Section title="2. Types of Storage We Use">
          <p>We primarily use <strong style={{ color: '#fff' }}>browser localStorage</strong> rather than traditional cookies for session management. This means your data stays on your device and is never sent to advertising networks. Here's what we store:</p>
          <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
            {[
              { key: 'userId', desc: 'Your unique user identifier, used to load your personalized dashboard.', essential: true },
              { key: 'role', desc: 'Your account type (client, caregiver, admin), used for routing and access control.', essential: true },
              { key: 'token', desc: 'Your JWT authentication token, valid for 24 hours, required for all authenticated API requests.', essential: true },
            ].map(item => (
              <div key={item.key} style={{ background: 'rgba(0,0,0,0.25)', padding: '16px 20px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <code style={{ color: '#6ee7b7', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap', flexShrink: 0 }}>{item.key}</code>
                <div>
                  <p>{item.desc}</p>
                  <span style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>✓ Essential — cannot be disabled</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="3. Third-Party Services">
          <p>Our platform uses the following third-party services which may set their own cookies:</p>
          <ul style={{ marginTop: 12, paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <li><strong style={{ color: '#93c5fd' }}>Vercel (Frontend Hosting):</strong> May set performance and analytics cookies to optimize content delivery. See <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>Vercel Privacy Policy</a>.</li>
            <li><strong style={{ color: '#93c5fd' }}>Render (Backend Hosting):</strong> Infrastructure provider with no user-facing cookies. See <a href="https://render.com/privacy" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>Render Privacy Policy</a>.</li>
            <li><strong style={{ color: '#93c5fd' }}>Neon (Database):</strong> Serverless PostgreSQL provider with no user-facing cookies.</li>
          </ul>
          <p style={{ marginTop: 12 }}>We do <strong style={{ color: '#fff' }}>not</strong> use any advertising, marketing, or social media tracking cookies.</p>
        </Section>

        <Section title="4. How to Control Cookies">
          <p>Since we use localStorage rather than cookies, you can clear your session at any time by:</p>
          <ul style={{ marginTop: 12, paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>Clicking the <strong style={{ color: '#fff' }}>"Sign Out"</strong> button on any dashboard — this clears all stored data immediately.</li>
            <li>Manually clearing your browser's site data via <strong style={{ color: '#fff' }}>Settings → Privacy → Clear Browsing Data</strong>.</li>
            <li>Using your browser's built-in developer tools (F12) → Application → Local Storage → Clear.</li>
          </ul>
          <p style={{ marginTop: 12 }}>For traditional browser cookies set by third-party providers, you can manage them via your browser settings. Please note that disabling certain cookies may affect the functionality of third-party features.</p>
        </Section>

        <Section title="5. Data Expiry">
          <p>All session data stored in your browser automatically becomes invalid after <strong style={{ color: '#fff' }}>24 hours</strong> (JWT token expiry), at which point you will be prompted to log in again. We do not store any persistent tracking data beyond your active session.</p>
        </Section>

        <Section title="6. Updates to This Policy">
          <p>We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date. Your continued use of CaregiverGO after changes have been posted constitutes your acceptance of the updated policy.</p>
        </Section>

        <Section title="7. Contact Us">
          <p>If you have any questions about our use of cookies or browser storage:<br />
            <strong style={{ color: '#fff' }}>CaregiverGO Privacy Team</strong><br />
            📧 privacy@caregivergo.com<br />
            📍 123 Care Avenue, Wellness City<br />
            📞 +1 (555) 123-4567
          </p>
        </Section>
      </div>
    </div>
  );
}
