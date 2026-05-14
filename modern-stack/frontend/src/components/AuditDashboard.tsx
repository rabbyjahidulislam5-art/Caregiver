import { useState, useMemo } from 'react';

interface User {
  userId: string; email: string; role: string;
  firstName: string; lastName: string;
  phone?: string | null; createdAt?: string;
}
interface AuditLog {
  id: string; timestamp: string; action: string;
  userId: string | null; details: string;
  user: { email: string; role: string } | null;
}
interface Props { users: User[]; auditLogs: AuditLog[]; }

const ROLE_SECTIONS: Record<string, { title: string; icon: string; keywords: string[]; color: string }[]> = {
  client: [
    { title: 'Account Activity', icon: '🔐', keywords: ['USER_LOGIN','USER_LOGOUT','USER_REGISTERED'], color: '#6366f1' },
    { title: 'Booking Requests', icon: '📋', keywords: ['BOOKING_CREATED'], color: '#3b82f6' },
    { title: 'Booking Approvals', icon: '✅', keywords: ['BOOKING_APPROVED_BY_ADMIN','BOOKING_APPROVE'], color: '#10b981' },
    { title: 'Booking Rejections', icon: '❌', keywords: ['BOOKING_REJECTED_BY_ADMIN','BOOKING_REJECT'], color: '#ef4444' },
    { title: 'Profile Changes', icon: '✏️', keywords: ['PROFILE_UPDATED'], color: '#f59e0b' },
  ],
  caregiver: [
    { title: 'Account Activity', icon: '🔐', keywords: ['USER_LOGIN','USER_LOGOUT','USER_REGISTERED'], color: '#6366f1' },
    { title: 'Bookings Accepted', icon: '🤝', keywords: ['BOOKING_ACCEPTED'], color: '#10b981' },
    { title: 'Bookings Rejected', icon: '🚫', keywords: ['BOOKING_REJECTED'], color: '#ef4444' },
    { title: 'Bookings Completed', icon: '🏁', keywords: ['BOOKING_COMPLETED'], color: '#8b5cf6' },
    { title: 'Profile & Approvals', icon: '🏅', keywords: ['PROFILE_UPDATED','PROFILE_APPROVED'], color: '#f59e0b' },
  ],
  admin: [
    { title: 'System Logins', icon: '🔐', keywords: ['USER_LOGIN','USER_LOGOUT'], color: '#6366f1' },
    { title: 'Caregiver Approvals', icon: '✅', keywords: ['CAREGIVER_APPROVED'], color: '#10b981' },
    { title: 'Booking Decisions', icon: '⚖️', keywords: ['BOOKING_APPROVE','BOOKING_REJECT'], color: '#3b82f6' },
    { title: 'User Management', icon: '🗑️', keywords: ['USER_DELETED'], color: '#ef4444' },
    { title: 'Complaint Replies', icon: '💬', keywords: ['COMPLAINT_REPLIED'], color: '#f59e0b' },
  ],
  Unknown: [
    { title: 'All Recorded Activity', icon: '📂', keywords: [''], color: '#6366f1' },
  ],
};

const ACTION_COLORS: Record<string, string> = {
  USER_LOGIN: '#6366f1', USER_LOGOUT: '#8b5cf6', USER_REGISTERED: '#3b82f6',
  BOOKING_CREATED: '#3b82f6', BOOKING_ACCEPTED: '#10b981', BOOKING_REJECTED: '#ef4444',
  BOOKING_COMPLETED: '#8b5cf6', BOOKING_APPROVE: '#10b981', BOOKING_REJECT: '#ef4444',
  BOOKING_APPROVED_BY_ADMIN: '#10b981', BOOKING_REJECTED_BY_ADMIN: '#ef4444',
  CAREGIVER_APPROVED: '#10b981', PROFILE_UPDATED: '#f59e0b', PROFILE_APPROVED: '#10b981',
  USER_DELETED: '#ef4444', COMPLAINT_REPLIED: '#f59e0b',
};

export default function AuditDashboard({ users, auditLogs }: Props) {
  const [level, setLevel] = useState<1|2|3>(1);
  const [selectedCategory, setSelectedCategory] = useState<string|null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string|null>(null);
  const [selectedEntityRole, setSelectedEntityRole] = useState<string>('client');
  const [filterPhone, setFilterPhone] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [expandedSection, setExpandedSection] = useState<string|null>(null);

  const deletedEntities = useMemo(() => {
    const activeIds = new Set(users.map(u => u.userId));
    const map = new Map<string, any>();
    auditLogs.forEach(log => {
      if (log.userId && !activeIds.has(log.userId) && !map.has(log.userId)) {
        map.set(log.userId, {
          userId: log.userId, email: log.user?.email || 'Unknown',
          role: log.user?.role || 'Unknown', firstName: 'Deleted', lastName: 'User',
          lastSeen: log.timestamp, phone: null,
        });
      }
      if (log.action === 'USER_DELETED') {
        const em = (log.details||'').match(/user:\s*([^\s(]+)/)?.[1];
        const id = (log.details||'').match(/\(ID:\s*([^)]+)\)/)?.[1] || `del-${log.id}`;
        if (!map.has(id)) map.set(id, {
          userId: id, email: em || 'Unknown', role: (log.details||'').toLowerCase().includes('caregiver') ? 'caregiver' : 'client',
          firstName: 'Deleted', lastName: 'Profile', lastSeen: log.timestamp, phone: null,
        });
      }
    });
    return Array.from(map.values());
  }, [users, auditLogs]);

  const categories = useMemo(() => ({
    'Users': users.filter(u => u.role === 'client'),
    'Admins': users.filter(u => u.role === 'admin'),
    'Caregivers': users.filter(u => u.role === 'caregiver'),
    'Deleted Users': deletedEntities.filter(e => e.role === 'client' || e.role === 'Unknown'),
    'Deleted Caregivers': deletedEntities.filter(e => e.role === 'caregiver'),
  }), [users, deletedEntities]);

  const getEntityLogs = (entityId: string | null) => {
    const email = deletedEntities.find(e => e.userId === entityId)?.email;
    return auditLogs.filter(l => {
      if (l.userId === entityId) return true;
      if (!l.userId && email) {
        const d = (l.details || '').toLowerCase();
        if (d.includes(email.toLowerCase())) return true;
      }
      return false;
    });
  };

  const filterByKeywords = (logs: AuditLog[], keywords: string[]) => {
    if (keywords.includes('')) return logs;
    return logs.filter(l => keywords.some(k => l.action.toUpperCase().includes(k) || (l.details||'').toUpperCase().includes(k)));
  };

  const goBack = () => {
    if (level === 3) setLevel(2);
    else { setLevel(1); setSelectedCategory(null); setFilterPhone(''); setFilterDate(''); setExpandedSection(null); }
  };

  // ─── LEVEL 1: Main Dashboard ───────────────────────────────────────────────
  const renderLevel1 = () => {
    const cards = [
      { key: 'Users', icon: '👥', color: '#6366f1', gradient: 'linear-gradient(135deg,#6366f1,#4f46e5)' },
      { key: 'Caregivers', icon: '🩺', color: '#10b981', gradient: 'linear-gradient(135deg,#10b981,#059669)' },
      { key: 'Admins', icon: '🛡️', color: '#8b5cf6', gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
      { key: 'Deleted Users', icon: '🗑️', color: '#6b7280', gradient: 'linear-gradient(135deg,#374151,#1f2937)' },
      { key: 'Deleted Caregivers', icon: '🚫', color: '#9ca3af', gradient: 'linear-gradient(135deg,#4b5563,#374151)' },
    ];
    return (
      <div style={{ animation: 'fadeScale 0.5s ease-out' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Identity Forensic Node</h1>
          <p style={{ color: '#94a3b8', fontSize: 15 }}>Select a category to investigate activity history.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 40 }}>
          {cards.map(card => {
            const count = categories[card.key as keyof typeof categories]?.length || 0;
            return (
              <div key={card.key} onClick={() => { setSelectedCategory(card.key); setLevel(2); }}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, cursor: 'pointer', transition: 'all 0.25s', position: 'relative', overflow: 'hidden' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 20px 40px ${card.color}33`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: card.color, borderRadius: '50%', opacity: 0.1 }} />
                <div style={{ fontSize: 28, marginBottom: 12 }}>{card.icon}</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: card.color, lineHeight: 1 }}>{count}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginTop: 8 }}>{card.key}</div>
              </div>
            );
          })}
        </div>

        {/* Traffic Summary */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>🌐</span> Recent System Activity
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
            {auditLogs.slice(0, 15).map(log => (
              <div key={log.id} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: ACTION_COLORS[log.action] || '#6366f1', flexShrink: 0 }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: ACTION_COLORS[log.action] || '#6366f1', textTransform: 'uppercase', minWidth: 160, letterSpacing: 0.5 }}>{log.action}</span>
                <span style={{ fontSize: 12, color: '#94a3b8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.details}</span>
                <span style={{ fontSize: 11, color: '#475569', flexShrink: 0 }}>{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ─── LEVEL 2: Entity Directory ─────────────────────────────────────────────
  const renderLevel2 = () => {
    let list = selectedCategory ? [...(categories[selectedCategory as keyof typeof categories] || [])] : [];
    if (filterPhone) list = list.filter(e => e.phone?.includes(filterPhone));
    if (filterDate) list = list.filter(e => e.createdAt?.startsWith(filterDate));

    const roleMap: Record<string, string> = { 'Users': 'client', 'Admins': 'admin', 'Caregivers': 'caregiver', 'Deleted Users': 'client', 'Deleted Caregivers': 'caregiver' };
    const role = roleMap[selectedCategory || ''] || 'client';

    return (
      <div style={{ animation: 'slideLeft 0.4s ease-out' }}>
        <button onClick={goBack} style={{ marginBottom: 24, padding: '8px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>← Back</button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: 0 }}>{selectedCategory}</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <input type="text" placeholder="📱 Filter by phone..." value={filterPhone} onChange={e => setFilterPhone(e.target.value)}
              style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', fontSize: 13 }} />
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
              style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', fontSize: 13 }} />
            {(filterPhone || filterDate) && (
              <button onClick={() => { setFilterPhone(''); setFilterDate(''); }} style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', cursor: 'pointer', fontSize: 13 }}>Clear</button>
            )}
          </div>
        </div>

        {list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p style={{ fontSize: 16 }}>No records found.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {list.map(entity => {
              const logCount = getEntityLogs(entity.userId).length;
              return (
                <div key={entity.userId} onClick={() => { setSelectedEntityId(entity.userId); setSelectedEntityRole(entity.role || role); setLevel(3); }}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                    {(entity.firstName.charAt(0) || entity.email.charAt(0)).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entity.firstName} {entity.lastName}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entity.email}</div>
                    {entity.phone && <div style={{ fontSize: 11, color: '#6366f1', marginTop: 2 }}>📞 {entity.phone}</div>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#6366f1' }}>{logCount}</div>
                    <div style={{ fontSize: 10, color: '#475569' }}>logs</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ─── LEVEL 3: Individual Profile + Role-Based Sections ─────────────────────
  const renderLevel3 = () => {
    const allEntities = selectedCategory ? categories[selectedCategory as keyof typeof categories] : [];
    const entity = allEntities.find(e => e.userId === selectedEntityId);
    const entityLogs = getEntityLogs(selectedEntityId);
    const role = selectedEntityRole in ROLE_SECTIONS ? selectedEntityRole : 'Unknown';
    const sections = ROLE_SECTIONS[role] || ROLE_SECTIONS['Unknown'];

    const headerColors: Record<string, string> = {
      client: 'linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)',
      caregiver: 'linear-gradient(135deg,#10b981 0%,#059669 100%)',
      admin: 'linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%)',
      Unknown: 'linear-gradient(135deg,#374151 0%,#1f2937 100%)',
    };

    return (
      <div style={{ animation: 'fadeScale 0.4s ease-out' }}>
        <button onClick={goBack} style={{ marginBottom: 24, padding: '8px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>← Back to Directory</button>

        {/* Profile Header */}
        <div style={{ background: headerColors[role] || headerColors.Unknown, borderRadius: 24, padding: '36px 44px', marginBottom: 36, position: 'relative', overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.3)' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 240, height: 240, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', padding: '4px 14px', borderRadius: 20, fontSize: 10, fontWeight: 800, letterSpacing: 2, color: '#fff', marginBottom: 16 }}>
            {role.toUpperCase()} FORENSIC NODE
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 900, color: '#fff', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '-1px' }}>
            {entity ? `${entity.firstName} ${entity.lastName}` : 'DELETED ENTITY'}
          </h1>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {entity?.email && <span>✉️ {entity.email}</span>}
            {entity?.phone && <span>📞 {entity.phone}</span>}
            {entity?.createdAt && <span>📅 Joined {new Date(entity.createdAt).toLocaleDateString()}</span>}
            <span style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 10px', borderRadius: 10 }}>
              {entityLogs.length} Total Logs
            </span>
          </div>
        </div>

        {/* Role-Based Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sections.map(sec => {
            const sectionLogs = filterByKeywords(entityLogs, sec.keywords);
            const isOpen = expandedSection === sec.title;
            return (
              <div key={sec.title} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${isOpen ? sec.color + '55' : 'rgba(255,255,255,0.06)'}`, borderRadius: 18, overflow: 'hidden', transition: 'all 0.3s' }}>
                {/* Section Header */}
                <div onClick={() => setExpandedSection(isOpen ? null : sec.title)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: sec.color + '22', border: `1px solid ${sec.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{sec.icon}</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{sec.title}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{sectionLogs.length} event{sectionLogs.length !== 1 ? 's' : ''} recorded</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: sec.color + '22', color: sec.color, padding: '3px 12px', borderRadius: 20, fontSize: 13, fontWeight: 800 }}>{sectionLogs.length}</div>
                    <div style={{ color: '#475569', transition: 'transform 0.3s', transform: isOpen ? 'rotate(180deg)' : 'none', fontSize: 16 }}>▼</div>
                  </div>
                </div>

                {/* Section Body */}
                {isOpen && (
                  <div style={{ padding: '0 24px 24px' }}>
                    {sectionLogs.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px 0', color: '#475569' }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                        <p style={{ fontSize: 14 }}>No activity in this category.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                        {sectionLogs.map(log => (
                          <div key={log.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, borderLeft: `3px solid ${ACTION_COLORS[log.action] || sec.color}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: ACTION_COLORS[log.action] || sec.color, background: (ACTION_COLORS[log.action] || sec.color) + '22', padding: '3px 8px', borderRadius: 6 }}>{log.action}</span>
                              <span style={{ fontSize: 11, color: '#475569' }}>{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                            <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>{log.details || 'System event recorded.'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Full Timeline Sidebar */}
        {entityLogs.length > 0 && (
          <div style={{ marginTop: 32, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 28 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, color: '#fff', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⏱️</span> Full Provenance Timeline
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {entityLogs.map((log, i) => (
                <div key={log.id} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                  {i < entityLogs.length - 1 && <div style={{ position: 'absolute', left: 5, top: 14, bottom: -16, width: 2, background: 'rgba(255,255,255,0.06)' }} />}
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: ACTION_COLORS[log.action] || '#6366f1', flexShrink: 0, marginTop: 4, boxShadow: `0 0 8px ${ACTION_COLORS[log.action] || '#6366f1'}` }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: ACTION_COLORS[log.action] || '#6366f1', background: (ACTION_COLORS[log.action] || '#6366f1') + '22', padding: '2px 8px', borderRadius: 4 }}>{log.action}</span>
                      <span style={{ fontSize: 11, color: '#475569' }}>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>{log.details || 'Event recorded.'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
