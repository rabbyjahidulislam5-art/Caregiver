import { useState, useMemo } from 'react';

interface User {
  userId: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  userId: string | null;
  details: string;
  user: { email: string, role: string } | null;
}

interface AuditDashboardProps {
  users: User[];
  auditLogs: AuditLog[];
}

export default function AuditDashboard({ users, auditLogs }: AuditDashboardProps) {
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedEntityRole, setSelectedEntityRole] = useState<string>('client');

  // --- DATA PROCESSING ---

  const deletedEntities = useMemo(() => {
    const activeIds = new Set(users.map(u => u.userId));
    const deletedMap = new Map<string, { userId: string, email: string, role: string, firstName: string, lastName: string, lastSeen: string }>();

    auditLogs.forEach(log => {
      if (log.userId && !activeIds.has(log.userId)) {
        if (!deletedMap.has(log.userId)) {
          deletedMap.set(log.userId, {
            userId: log.userId,
            email: log.user?.email || 'Unknown Email',
            role: log.user?.role || 'Unknown',
            firstName: 'Deleted',
            lastName: 'User',
            lastSeen: log.timestamp
          });
        }
        
        const entity = deletedMap.get(log.userId)!;
        const details = log.details || '';
        if (entity.role === 'Unknown') {
          const det = details.toLowerCase();
          if (det.includes('client logged in') || log.action.includes('CLIENT')) entity.role = 'client';
          else if (det.includes('caregiver logged in') || log.action.includes('CAREGIVER')) entity.role = 'caregiver';
          else if (det.includes('admin logged in') || log.action.includes('ADMIN')) entity.role = 'admin';
        }
        if (entity.email === 'Unknown Email') {
            const emailMatch = details.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            if (emailMatch) entity.email = emailMatch[0];
        }
      }
    });
    
    return Array.from(deletedMap.values());
  }, [users, auditLogs]);

  const categories = useMemo(() => ({
    'Users': users.filter(u => u.role === 'client'),
    'Admins': users.filter(u => u.role === 'admin'),
    'Caregivers': users.filter(u => u.role === 'caregiver'),
    'Deleted Users': deletedEntities.filter(e => e.role === 'client' || e.role === 'Unknown'),
    'Deleted Caregivers': deletedEntities.filter(e => e.role === 'caregiver'),
  }), [users, deletedEntities]);

  const trafficData = useMemo(() => {
    const systemLogs = auditLogs.filter(log => !log.userId || log.user?.email === 'SYSTEM');
    let totalVisits = 0;
    const uniqueIPs = new Set<string>();
    const dailyTrends: Record<string, number> = {};

    systemLogs.forEach(log => {
      const isTraffic = log.action.includes('/signin') || log.action === 'USER_REGISTERED' || log.action.includes('/login') || log.action.includes('/logout');
      if (isTraffic) {
        totalVisits++;
        const details = log.details || '';
        const ipMatch = details.match(/IP:\s*([^\s,]+)/);
        if (ipMatch) uniqueIPs.add(ipMatch[1]);

        const date = new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        dailyTrends[date] = (dailyTrends[date] || 0) + 1;
      }
    });

    const trendArray = Object.entries(dailyTrends).map(([date, count]) => ({ date, count })).slice(-7).reverse();
    const maxCount = Math.max(...trendArray.map(t => t.count), 1);

    return { totalVisits, uniqueIPs: uniqueIPs.size, trendArray, maxCount };
  }, [auditLogs]);

  const entityLogs = useMemo(() => {
    if (!selectedEntityId) return [];
    return auditLogs.filter(log => log.userId === selectedEntityId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [auditLogs, selectedEntityId]);


  // --- NAVIGATION ---
  const openCategory = (cat: string) => {
    setSelectedCategory(cat);
    setLevel(2);
  };

  const openProfile = (entityId: string, role: string) => {
    setSelectedEntityId(entityId);
    setSelectedEntityRole(role);
    setLevel(3);
  };

  const goBack = () => {
    if (level === 3) setLevel(2);
    else if (level === 2) { setLevel(1); setSelectedCategory(null); }
  };


  // --- RENDERERS ---

  const renderLevel1 = () => (
    <div>
      <h1 style={{ color: 'red', fontSize: 40, background: 'yellow', padding: 20 }}>TESTING AUDIT DASHBOARD</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 40 }}>
        {[
          { key: 'Users', icon: '👥', color: 'var(--accent-blue)', desc: 'Active Clients' },
          { key: 'Caregivers', icon: '🩺', color: 'var(--accent-green)', desc: 'Active Professionals' },
          { key: 'Admins', icon: '🛡️', color: 'var(--accent-purple)', desc: 'System Administrators' },
          { key: 'Deleted Users', icon: '🗑️', color: 'var(--text-muted)', desc: 'Removed Clients' },
          { key: 'Deleted Caregivers', icon: '🚫', color: 'var(--text-muted)', desc: 'Removed Professionals' },
        ].map(card => {
          const list = categories[card.key as keyof typeof categories];
          return (
            <div key={card.key} onClick={() => openCategory(card.key)} className="glass-card-static" style={{ padding: 24, borderRadius: 24, cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid rgba(255,255,255,0.05)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 32 }}>{card.icon}</span>
                <span style={{ fontSize: 36, fontWeight: 900, color: card.color }}>{list.length}</span>
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{card.key}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{card.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-card-static" style={{ padding: 32, borderRadius: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, color: '#fff' }}>
          <span>🌐</span> System Traffic Analytics
        </h2>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40 }}>
          <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.03)' }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Total Gateway Hits</p>
              <p style={{ fontSize: 32, fontWeight: 900, color: '#fff' }}>{trafficData.totalVisits}</p>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.03)' }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Unique IP Addresses</p>
              <p style={{ fontSize: 32, fontWeight: 900, color: 'var(--accent-cyan)' }}>{trafficData.uniqueIPs}</p>
            </div>
          </div>

          <div style={{ flex: '2 1 400px' }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, fontWeight: 600 }}>Daily Traffic Trend (Last 7 Days)</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 180, padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {trafficData.trendArray.length > 0 ? trafficData.trendArray.map((t, i) => {
                const height = Math.max(10, (t.count / trafficData.maxCount) * 100);
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: '100%', maxWidth: 40, height: `${height}%`, background: 'var(--gradient-primary)', borderRadius: '6px 6px 0 0', opacity: 0.8, transition: 'height 1s ease' }} title={`${t.count} hits`} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{t.date}</span>
                  </div>
                );
              }) : (
                <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>No recent traffic data.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLevel2 = () => {
    const list = selectedCategory ? categories[selectedCategory as keyof typeof categories] : [];
    return (
      <div className="reveal-right">
        <button onClick={goBack} className="btn btn-ghost" style={{ marginBottom: 24, padding: '8px 16px', background: 'rgba(255,255,255,0.05)' }}>
          ← Back to Dashboard
        </button>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24, color: '#fff' }}>{selectedCategory} Directory</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {list.map(entity => (
            <div key={entity.userId} onClick={() => openProfile(entity.userId, entity.role)} className="glass-card-static" style={{ padding: 20, borderRadius: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, border: '1px solid rgba(255,255,255,0.04)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--gradient-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff' }}>
                {entity.firstName.charAt(0) || entity.email.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <h4 style={{ fontWeight: 700, color: '#fff', fontSize: 16, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{entity.firstName} {entity.lastName}</h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{entity.email}</p>
              </div>
              <span style={{ fontSize: 20, opacity: 0.5 }}>➔</span>
            </div>
          ))}
          {list.length === 0 && <p style={{ color: 'var(--text-muted)', padding: 20 }}>No records found in this category.</p>}
        </div>
      </div>
    );
  };

  const renderTimelineSection = (title: string, icon: string, filterKeywords: string[]) => {
    const logs = entityLogs.filter(log => {
      const details = log.details || '';
      return filterKeywords.some(kw => log.action.toUpperCase().includes(kw) || details.toUpperCase().includes(kw));
    });
    if (logs.length === 0) return null;

    return (
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>{icon}</span> {title}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: 20, marginLeft: 10 }}>
          {logs.map(log => (
            <div key={log.id} style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: -26, top: 6, width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-blue)', boxShadow: '0 0 10px var(--accent-blue)' }} />
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: 0.5 }}>{log.action}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{log.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLevel3 = () => {
    const entity = selectedCategory ? categories[selectedCategory as keyof typeof categories].find(e => e.userId === selectedEntityId) : null;
    
    return (
      <div className="reveal-scale">
        <button onClick={goBack} className="btn btn-ghost" style={{ marginBottom: 24, padding: '8px 16px', background: 'rgba(255,255,255,0.05)' }}>
          ← Back to List
        </button>
        
        <div className="glass-card-static" style={{ padding: 40, borderRadius: 24, marginBottom: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: '#fff', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}>
              {entity?.firstName?.charAt(0) || entity?.email?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{entity?.firstName} {entity?.lastName}</h2>
              <p style={{ fontSize: 16, color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: 4 }}>{entity?.role.toUpperCase()} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>• {entity?.email}</span></p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {selectedEntityId}</p>
            </div>
          </div>
        </div>

        <div className="glass-card-static" style={{ padding: 40, borderRadius: 24 }}>
          {selectedEntityRole === 'client' && (
            <>
              {renderTimelineSection('Booking History', '📅', ['BOOKING'])}
              {renderTimelineSection('Authentication', '🔐', ['LOGIN', 'LOGOUT', 'REGISTER', 'SIGNIN'])}
              {renderTimelineSection('Profile Updates', '📝', ['PROFILE'])}
              {renderTimelineSection('Reviews & Feedback', '⭐', ['REVIEW', 'COMPLAINT'])}
            </>
          )}

          {selectedEntityRole === 'caregiver' && (
            <>
              {renderTimelineSection('Admin Approvals', '✅', ['APPROVED', 'REJECTED'])}
              {renderTimelineSection('Booking Acceptances', '🤝', ['BOOKING_ACCEPTED', 'BOOKING'])}
              {renderTimelineSection('Authentication', '🔐', ['LOGIN', 'LOGOUT', 'REGISTER', 'SIGNIN'])}
              {renderTimelineSection('Profile & Details', '📝', ['PROFILE'])}
            </>
          )}

          {selectedEntityRole === 'admin' && (
            <>
              {renderTimelineSection('Actions Taken', '⚖️', ['DELETED', 'APPROVED', 'REPLIED', 'BOOKING_APPROVE', 'BOOKING_REJECT'])}
              {renderTimelineSection('Authentication', '🔐', ['LOGIN', 'LOGOUT', 'REGISTER', 'SIGNIN'])}
              {renderTimelineSection('System Changes', '⚙️', ['SETTINGS', 'CONFIG'])}
            </>
          )}

          {(!selectedEntityRole || selectedEntityRole === 'Unknown') && (
             <>
               {renderTimelineSection('All Actions', '📝', [''])}
             </>
          )}

          {entityLogs.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <span style={{ fontSize: 40, display: 'block', marginBottom: 16 }}>📭</span>
              <p>No historical events recorded for this user.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: '100%', minHeight: 600 }}>
      {level === 1 && renderLevel1()}
      {level === 2 && renderLevel2()}
      {level === 3 && renderLevel3()}
    </div>
  );
}
