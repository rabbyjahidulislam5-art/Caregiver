import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const quickLinks = [
    { label: 'Home', href: '/' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms of Service', href: '/terms-of-service' },
    { label: 'Cookie Policy', href: '/cookie-policy' },
  ];

  const services = [
    { label: 'Medical Nursing', icon: '🏥' },
    { label: 'Elderly Care', icon: '👴' },
    { label: 'Child Care', icon: '👶' },
    { label: 'Specialized Support', icon: '💊' },
  ];

  return (
    <footer style={{
      background: 'rgba(3,3,12,0.97)',
      backdropFilter: 'blur(40px)',
      WebkitBackdropFilter: 'blur(40px)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      position: 'relative',
      overflow: 'hidden',
      zIndex: 10,
    }}>
      {/* Glow orbs */}
      <div style={{
        position: 'absolute', top: -80, left: '10%',
        width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: -60, right: '10%',
        width: 250, height: 250,
        background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '72px 40px 0' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 48,
          marginBottom: 56,
        }}>

          {/* Brand */}
          <div>
            <div style={{
              fontSize: 26, fontWeight: 900,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 16, display: 'inline-block',
              letterSpacing: '-0.5px',
            }}>
              🏥 CaregiverGO
            </div>
            <p style={{
              color: 'rgba(148,163,184,0.85)',
              lineHeight: 1.75, marginBottom: 24,
              fontSize: 14.5, maxWidth: 280,
            }}>
              Premium, reliable, and compassionate care services delivered to your doorstep. Your loved ones deserve the best.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              {['🌐', '📱', '✉️', '📞'].map((icon, i) => (
                <button key={i} style={{
                  width: 40, height: 40,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  fontSize: 17, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s cubic-bezier(0.175,0.885,0.32,1.275)',
                  color: 'white',
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.15)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.4)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px) scale(1.1)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0) scale(1)';
                  }}
                >{icon}</button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{
              color: '#fff', fontWeight: 800, marginBottom: 20,
              fontSize: 13, letterSpacing: '1.5px', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ width: 20, height: 2, background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)', display: 'inline-block', borderRadius: 2 }} />
              Quick Links
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {quickLinks.map(link => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    style={{
                      color: hoveredLink === link.label ? '#fff' : 'rgba(148,163,184,0.8)',
                      textDecoration: 'none',
                      fontSize: 14.5,
                      transition: 'all 0.25s ease',
                      display: 'flex', alignItems: 'center', gap: 8,
                      fontWeight: hoveredLink === link.label ? 600 : 400,
                    }}
                    onMouseEnter={() => setHoveredLink(link.label)}
                    onMouseLeave={() => setHoveredLink(null)}
                  >
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: hoveredLink === link.label
                        ? 'linear-gradient(135deg,#3b82f6,#8b5cf6)'
                        : 'rgba(255,255,255,0.2)',
                      transition: 'all 0.25s ease',
                      display: 'inline-block', flexShrink: 0,
                    }} />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 style={{
              color: '#fff', fontWeight: 800, marginBottom: 20,
              fontSize: 13, letterSpacing: '1.5px', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ width: 20, height: 2, background: 'linear-gradient(90deg,#06b6d4,#3b82f6)', display: 'inline-block', borderRadius: 2 }} />
              Our Services
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {services.map(s => (
                <li key={s.label} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  color: 'rgba(148,163,184,0.8)', fontSize: 14.5,
                }}>
                  <span style={{ fontSize: 16 }}>{s.icon}</span>
                  {s.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{
              color: '#fff', fontWeight: 800, marginBottom: 20,
              fontSize: 13, letterSpacing: '1.5px', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ width: 20, height: 2, background: 'linear-gradient(90deg,#10b981,#06b6d4)', display: 'inline-block', borderRadius: 2 }} />
              Contact Us
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { icon: '📍', text: '123 Care Avenue, Wellness City' },
                { icon: '📞', text: '+1 (555) 123-4567' },
                { icon: '✉️', text: 'support@caregivergo.com' },
                { icon: '⏰', text: '24/7 Always Available' },
              ].map(item => (
                <li key={item.text} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  color: 'rgba(148,163,184,0.8)', fontSize: 14,
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          height: 1,
          background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.06), rgba(59,130,246,0.15), rgba(255,255,255,0.06), transparent)',
        }} />

        {/* Bottom bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 16,
          padding: '24px 0',
        }}>
          <p style={{ color: 'rgba(100,116,139,0.8)', fontSize: 13 }}>
            © {new Date().getFullYear()} <span style={{ color: 'rgba(148,163,184,0.9)', fontWeight: 600 }}>CaregiverGO</span>. All rights reserved. Made with ❤️ for better care.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { label: 'Privacy Policy', to: '/privacy-policy' },
              { label: 'Terms of Service', to: '/terms-of-service' },
              { label: 'Cookie Policy', to: '/cookie-policy' },
            ].map(({ label, to }) => (
              <Link key={label} to={to} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{
                color: 'rgba(100,116,139,0.8)', textDecoration: 'none',
                fontSize: 13, transition: 'color 0.25s ease',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(100,116,139,0.8)')}
              >{label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
