import { useState, useMemo } from 'react';

interface User {
  userId: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  createdAt?: string;
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

  // --- FILTERS ---
  const [filterPhone, setFilterPhone] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');

  // --- DATA PROCESSING ---

  const deletedEntities = useMemo(() => {
    const activeIds = new Set(users.map(u => u.userId));
    const deletedMap = new Map<string, { userId: string, email: string, role: string, firstName: string, lastName: string, lastSeen: string, phone?: string | null, createdAt?: string }>();

    auditLogs.forEach(log => {
      if (log.userId && !activeIds.has(log.userId)) {
        if (!deletedMap.has(log.userId)) {
          deletedMap.set(log.userId, {
            userId: log.userId,
            email: log.user?.email || 'Unknown Email',
            role: log.user?.role || 'Unknown',
            firstName: 'Deleted',
            lastName: 'User',
            lastSeen: log.timestamp,
            phone: null,
            createdAt: undefined
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
    else if (level === 2) { 
      setLevel(1); 
      setSelectedCategory(null);
      setFilterPhone('');
      setFilterDate('');
    }
  };


  // --- RENDERERS ---

  const renderLevel1 = () => (
    <div style={{ animation: 'fadeScale 0.6s ease-out forwards' }}>
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
    let list = selectedCategory ? categories[selectedCategory as keyof typeof categories] : [];
    
    // Apply Filters
    if (filterPhone) {
      list = list.filter(e => e.phone && e.phone.includes(filterPhone));
    }
    if (filterDate) {
      list = list.filter(e => {
        if (!e.createdAt) return false;
        // e.createdAt is usually ISO string "YYYY-MM-DDThh:mm:ss"
        return e.createdAt.startsWith(filterDate); 
      });
    }

    return (
      <div style={{ animation: 'slideLeft 0.5s ease-out forwards' }}>
        <button onClick={goBack} className="btn btn-ghost" style={{ marginBottom: 24, padding: '8px 16px', background: 'rgba(255,255,255,0.05)' }}>
          ← Back to Dashboard
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20, marginBottom: 24 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0 }}>{selectedCategory} Directory</h2>
          
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: 10, opacity: 0.5 }}>📱</span>
              <input 
                type="text" 
                placeholder="Filter by Phone..." 
                value={filterPhone}
                onChange={e => setFilterPhone(e.target.value)}
                style={{ padding: '8px 12px 8px 36px', borderRadius: 12, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', width: 200 }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: 10, opacity: 0.5 }}>📅</span>
              <input 
                type="date" 
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                style={{ padding: '8px 12px 8px 36px', borderRadius: 12, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', width: 160 }}
              />
            </div>
            {(filterPhone || filterDate) && (
              <button 
                onClick={() => { setFilterPhone(''); setFilterDate(''); }}
                style={{ padding: '8px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', color: '#fff', cursor: 'pointer' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {list.map(entity => (
            <div key={entity.userId} onClick={() => openProfile(entity.userId, entity.role)} className="glass-card-static" style={{ padding: 20, borderRadius: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, border: '1px solid rgba(255,255,255,0.04)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--gradient-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff' }}>
                {entity.firstName.charAt(0) || entity.email.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <h4 style={{ fontWeight: 700, color: '#fff', fontSize: 16, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{entity.firstName} {entity.lastName}</h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{entity.email}</p>
                {entity.phone && <p style={{ fontSize: 11, color: 'var(--accent-blue)', marginTop: 2 }}>📞 {entity.phone}</p>}
                {entity.createdAt && <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Registered: {new Date(entity.createdAt).toLocaleDateString()}</p>}
              </div>
              <span style={{ fontSize: 20, opacity: 0.5 }}>➔</span>
            </div>
          ))}
          {list.length === 0 && <p style={{ color: 'var(--text-muted)', padding: 20 }}>No records found in this category.</p>}
        </div>
      </div>
    );
  };

  const getLogsForActions = (actions: string[]) => {
    const entityLogs = auditLogs.filter(l => l.userId === selectedEntityId);
    return entityLogs.filter(log => {
      const details = log.details || '';
      return actions.some(kw => log.action.toUpperCase().includes(kw) || details.toUpperCase().includes(kw));
    });
  };

  const renderActivityGrid = (title: string, actions: string[]) => {
    const logs = getLogsForActions(actions);
    if (logs.length === 0) return null;

    return (
      <div style={{ marginBottom: 40 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, textTransform: 'uppercase', marginBottom: 20, borderLeft: '4px solid var(--accent-blue)', paddingLeft: 12, color: '#fff' }}>{title}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {logs.map(log => (
            <div key={log.id} style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                 <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: 1, background: 'rgba(99,102,241,0.1)', padding: '4px 8px', borderRadius: 4 }}>{log.action}</span>
                 <span style={{ fontSize: 10, color: '#666', fontWeight: 600 }}>{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
               </div>
               <p style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 8 }}>{log.details || 'System Action'}</p>
               <p style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>{new Date(log.timestamp).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProvenanceSidebar = (title: string, actions: string[]) => {
    const logs = getLogsForActions(actions);
    
    return (
      <div style={{ background: '#0B0F19', borderRadius: 24, padding: 30, height: '100%', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', marginBottom: 30, letterSpacing: 2, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>⏱️</span> {title}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {logs.length === 0 ? <p style={{ opacity: 0.5, fontSize: 13, color: '#fff' }}>No logs available.</p> : logs.map((log, index) => (
            <div key={log.id} style={{ position: 'relative', paddingLeft: 24 }}>
               {index !== logs.length - 1 && <div style={{ position: 'absolute', left: 4, top: 12, bottom: -24, width: 2, background: 'rgba(255,255,255,0.1)' }} />}
               <div style={{ position: 'absolute', left: -1, top: 4, width: 12, height: 12, borderRadius: '50%', background: 'var(--accent-blue)', boxShadow: '0 0 12px var(--accent-blue)' }} />
               
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                 <span style={{ fontSize: 11, fontWeight: 800, color: '#888' }}>{new Date(log.timestamp).toLocaleString()}</span>
                 <span style={{ fontSize: 9, background: 'var(--accent-blue)', color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>{log.action}</span>
               </div>
               <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: 16, borderRadius: 12, marginTop: 8 }}>
                 <p style={{ fontSize: 13, color: '#ddd', margin: 0, lineHeight: 1.5 }}>{log.details || 'Activity recorded'}</p>
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
      <div style={{ animation: 'fadeScale 0.5s ease-out forwards' }}>
        <button onClick={goBack} className="btn btn-ghost" style={{ marginBottom: 24, padding: '8px 16px', background: 'rgba(255,255,255,0.05)' }}>
          ← Back to Directory
        </button>

        {/* HEADER BLOCK (IDENTITY FORENSIC NODE STYLE) */}
        <div style={{ background: '#5B42F3', borderRadius: 24, padding: '40px 50px', marginBottom: 40, position: 'relative', overflow: 'hidden', boxShadow: '0 10px 40px rgba(91,66,243,0.3)' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 300, height: 300, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(40px)' }} />
          
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: 20, fontSize: 11, fontWeight: 800, letterSpacing: 2, color: '#fff', marginBottom: 20 }}>
            {selectedEntityRole.toUpperCase()} FORENSIC NODE
          </div>
          
          <h1 style={{ fontSize: 48, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '-1px', margin: '0 0 10px 0' }}>
            {entity ? `${entity.firstName} ${entity.lastName}` : 'UNKNOWN ENTITY'}
          </h1>
          
          <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
            <span>{entity?.phone || 'NO PHONE'}</span>
            <span>•</span>
            <span>{entity?.email || 'NO EMAIL'}</span>
            <span>•</span>
            <span>REGISTERED {entity?.createdAt ? new Date(entity.createdAt).toLocaleDateString() : 'UNKNOWN'}</span>
          </div>
        </div>

        {/* SPLIT LAYOUT GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 40, alignItems: 'start' }}>
          
          {/* LEFT: ACTIVITY GRID */}
          <div>
            {selectedEntityRole === 'client' && (
              <>
                {renderActivityGrid('Historical Booking Timeline', ['BOOKING'])}
                {renderActivityGrid('Reviews & Complaints Filed', ['REVIEW', 'COMPLAINT'])}
              </>
            )}
            
            {selectedEntityRole === 'caregiver' && (
              <>
                {renderActivityGrid('Booking Acceptances', ['BOOKING'])}
                {renderActivityGrid('Admin Approvals Received', ['APPROVAL'])}
              </>
            )}
            
            {selectedEntityRole === 'admin' && (
              <>
                {renderActivityGrid('System Interventions', ['DELETED', 'APPROVED', 'UPDATED'])}
              </>
            )}

            {(!selectedEntityRole || selectedEntityRole === 'Unknown') && (
               renderActivityGrid('All Activity', [''])
            )}
          </div>

          {/* RIGHT: PROVENANCE LOGS */}
          <div>
            {renderProvenanceSidebar('Provenance Logs', ['LOGIN', 'LOGOUT', 'REGISTER', 'SIGNIN', 'PROFILE'])}
          </div>
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
