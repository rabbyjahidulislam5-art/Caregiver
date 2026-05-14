import { useNavigate } from 'react-router-dom';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 40 }}>
    <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 14, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 4, height: 22, background: 'var(--gradient-primary)', borderRadius: 4, display: 'inline-block' }} />
      {title}
    </h2>
    <div style={{ color: 'rgba(148,163,184,0.9)', lineHeight: 1.85, fontSize: 15 }}>{children}</div>
  </div>
);

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  return (
    <div className="fade-in" style={{ minHeight: '100vh', padding: '100px 5% 80px', maxWidth: 900, margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} style={{ display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:50,padding:'10px 18px',color:'rgba(255,255,255,0.85)',cursor:'pointer',fontSize:14,fontWeight:600,backdropFilter:'blur(12px)',marginBottom:40,transition:'all 0.25s ease' }}
        onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(59,130,246,0.15)';}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.07)';}}>
        ← Go Back
      </button>

      <div style={{ marginBottom: 52 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent-blue)', marginBottom: 12 }}>Legal</div>
        <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 16 }}>Privacy Policy</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>Last updated: May 14, 2026 &nbsp;·&nbsp; Effective immediately</p>
      </div>

      <div className="glass-card-static" style={{ padding: '48px 52px' }}>
        <Section title="1. Introduction">
          <p>Welcome to <strong style={{ color: '#fff' }}>CaregiverGO</strong>. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and services.</p>
          <p style={{ marginTop: 12 }}>If you disagree with any terms in this policy, please discontinue use of our site. By continuing to use CaregiverGO, you consent to the practices described here.</p>
        </Section>

        <Section title="2. Information We Collect">
          <p>We collect information that you voluntarily provide to us when you register, including:</p>
          <ul style={{ marginTop: 12, paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li><strong style={{ color: '#93c5fd' }}>Personal Identifiers:</strong> Full name, email address, phone number, and password (stored as a cryptographic hash).</li>
            <li><strong style={{ color: '#93c5fd' }}>Professional Information:</strong> For caregivers — profession, years of experience, and service area/address.</li>
            <li><strong style={{ color: '#93c5fd' }}>Health Context:</strong> Blood group (optional, for emergency reference only).</li>
            <li><strong style={{ color: '#93c5fd' }}>Usage Data:</strong> Log data, browser type, IP address, pages visited, and timestamps — collected automatically via our audit system.</li>
            <li><strong style={{ color: '#93c5fd' }}>Communications:</strong> Messages, reviews, and complaints submitted through the platform.</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Information">
          <p>We use the information we collect to:</p>
          <ul style={{ marginTop: 12, paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>Create and manage your account and professional profile.</li>
            <li>Facilitate bookings between clients and caregivers.</li>
            <li>Process and manage complaints and reviews.</li>
            <li>Send service-related notifications and updates.</li>
            <li>Maintain platform security via audit logs and anomaly detection.</li>
            <li>Improve our services through anonymized usage analysis.</li>
          </ul>
        </Section>

        <Section title="4. Sharing Your Information">
          <p>We <strong style={{ color: '#fff' }}>do not sell</strong> your personal data. We may share it only in the following limited circumstances:</p>
          <ul style={{ marginTop: 12, paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li><strong style={{ color: '#93c5fd' }}>Between Users:</strong> Client contact details are shared with caregivers only upon an accepted booking, and vice versa.</li>
            <li><strong style={{ color: '#93c5fd' }}>Service Providers:</strong> Trusted third-party vendors (e.g., Neon database, Render hosting, Vercel CDN) who help us operate our platform.</li>
            <li><strong style={{ color: '#93c5fd' }}>Legal Requirements:</strong> When required by law, court order, or government authority.</li>
          </ul>
        </Section>

        <Section title="5. Data Security">
          <p>We implement industry-standard security measures including bcrypt password hashing (cost factor 12), JWT-based authentication with 24-hour expiry, HTTPS-only data transmission, and comprehensive audit logging. However, no method of electronic storage is 100% secure.</p>
        </Section>

        <Section title="6. Data Retention">
          <p>We retain your personal information for as long as your account remains active or as needed to provide services. You may request deletion of your account at any time by contacting our support team at <strong style={{ color: '#93c5fd' }}>support@caregivergo.com</strong>.</p>
        </Section>

        <Section title="7. Your Rights">
          <p>Depending on your location, you may have the right to access, correct, or delete your personal data. You also have the right to object to processing and to data portability. Contact us at <strong style={{ color: '#93c5fd' }}>privacy@caregivergo.com</strong> to exercise these rights.</p>
        </Section>

        <Section title="8. Contact Us">
          <p>For questions about this Privacy Policy, please contact:<br />
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
