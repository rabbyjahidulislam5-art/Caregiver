import { useNavigate } from 'react-router-dom';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 40 }}>
    <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 14, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 4, height: 22, background: 'linear-gradient(135deg,#8b5cf6,#06b6d4)', borderRadius: 4, display: 'inline-block' }} />
      {title}
    </h2>
    <div style={{ color: 'rgba(148,163,184,0.9)', lineHeight: 1.85, fontSize: 15 }}>{children}</div>
  </div>
);

export default function TermsOfService() {
  const navigate = useNavigate();
  return (
    <div className="fade-in" style={{ minHeight: '100vh', padding: '100px 5% 80px', maxWidth: 900, margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} style={{ display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:50,padding:'10px 18px',color:'rgba(255,255,255,0.85)',cursor:'pointer',fontSize:14,fontWeight:600,backdropFilter:'blur(12px)',marginBottom:40,transition:'all 0.25s ease' }}
        onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(139,92,246,0.15)';}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.07)';}}>
        ← Go Back
      </button>

      <div style={{ marginBottom: 52 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent-purple)', marginBottom: 12 }}>Legal</div>
        <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 16 }}>Terms of Service</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>Last updated: May 14, 2026 &nbsp;·&nbsp; Please read carefully before using our service</p>
      </div>

      <div className="glass-card-static" style={{ padding: '48px 52px' }}>
        <Section title="1. Acceptance of Terms">
          <p>By accessing or using the CaregiverGO platform ("Service"), you agree to be bound by these Terms of Service. If you do not agree to all terms, you may not access the Service. These Terms apply to all visitors, users, and caregivers who access or use the Service.</p>
        </Section>

        <Section title="2. Description of Service">
          <p>CaregiverGO is an online platform that connects individuals seeking caregiving services ("Clients") with qualified professional caregivers ("Caregivers"). We provide the technology and infrastructure that facilitates these connections but are <strong style={{ color: '#fff' }}>not a healthcare provider or employer of any caregiver</strong> listed on our platform.</p>
        </Section>

        <Section title="3. User Accounts & Eligibility">
          <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <li>You must be at least 18 years old to create an account.</li>
            <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
            <li>You agree to provide accurate, current, and complete information during registration.</li>
            <li>You may not create more than one account per person.</li>
            <li>Accounts found to be fraudulent or impersonating others will be permanently terminated.</li>
          </ul>
        </Section>

        <Section title="4. Caregiver Responsibilities">
          <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <li>Caregivers must provide truthful and accurate professional credentials.</li>
            <li>Caregivers are independent contractors and not employees of CaregiverGO.</li>
            <li>Caregivers are solely responsible for the quality and safety of services they provide.</li>
            <li>Acceptance of a booking constitutes a commitment to fulfill the service on the agreed date.</li>
            <li>Repeated cancellations without valid reason may result in account suspension.</li>
          </ul>
        </Section>

        <Section title="5. Client Responsibilities">
          <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <li>Clients must treat all caregivers with respect and dignity.</li>
            <li>Clients are responsible for providing accurate service location and requirements.</li>
            <li>False reviews, harassment, or abuse of the complaint system is strictly prohibited.</li>
            <li>Booking cancellations should be made at least 24 hours in advance when possible.</li>
          </ul>
        </Section>

        <Section title="6. Prohibited Conduct">
          <p>The following are strictly prohibited on our platform:</p>
          <ul style={{ marginTop: 12, paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>Submitting false, misleading, or defamatory reviews or complaints.</li>
            <li>Soliciting caregivers to operate outside the platform to avoid service fees.</li>
            <li>Sharing another user's personal contact information without consent.</li>
            <li>Using automated bots, scrapers, or scripts to access the platform.</li>
            <li>Engaging in any discriminatory, abusive, or illegal conduct.</li>
          </ul>
        </Section>

        <Section title="7. Limitation of Liability">
          <p>To the maximum extent permitted by law, CaregiverGO shall not be liable for any indirect, incidental, special, or consequential damages arising from the use or inability to use our Service, including damages for loss of data, loss of profits, or loss of goodwill. Our maximum liability to you shall not exceed the amount paid by you in the six months preceding the claim.</p>
        </Section>

        <Section title="8. Termination">
          <p>We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we determine to be a violation of these Terms or that is harmful to other users, us, third parties, or the integrity of the platform.</p>
        </Section>

        <Section title="9. Governing Law">
          <p>These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising under these Terms shall be resolved through binding arbitration, except where prohibited by law.</p>
        </Section>

        <Section title="10. Changes to Terms">
          <p>We reserve the right to modify these Terms at any time. We will notify users of significant changes via email or a prominent notice on our platform. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>
        </Section>

        <Section title="11. Contact">
          <p>For any questions about these Terms:<br />
            <strong style={{ color: '#fff' }}>CaregiverGO Legal Team</strong><br />
            📧 legal@caregivergo.com<br />
            📍 123 Care Avenue, Wellness City
          </p>
        </Section>
      </div>
    </div>
  );
}
