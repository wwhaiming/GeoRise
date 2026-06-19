/* EcoRise — Home / Dashboard page */
import { useState } from 'react';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import { Streak } from '../components/UI';

export default function Home({ ctx }) {
  const { user, members, bump, notifications, unreadCount, markNotificationsRead } = ctx;
  const [notifOpen, setNotifOpen] = useState(false);
  const you = members.find(m => m.isYou) || { points: 0, rank: members.length || 1, streak: 0 };

  const nextRankPts = you.rank > 1 ? (members[you.rank - 2]?.points || 0) : you.points;
  const gap = Math.max(0, nextRankPts - (you.points || 0));
  const prog = you.rank > 1 && nextRankPts > 0 ? Math.min(100, ((you.points || 0) / nextRankPts) * 100) : 100;

  return (
    <div className="screen-in">
      {/* header */}
      <div style={{ padding: '16px 18px 6px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar src={user.avatar} name={user.name} size={46} ring="var(--green)" />
        <div style={{ flex: 1 }}>
          <div className="dim" style={{ fontWeight: 700, fontSize: 13 }}>Good morning,</div>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 19, lineHeight: 1 }}>{user.name || 'Eco Champion'}</div>
        </div>
        <div style={{ position: 'relative' }}>
          <button className="btn btn-secondary btn-sm" style={{ padding: 10, position: 'relative' }} aria-label="Notifications" aria-expanded={notifOpen}
            onClick={() => { const opening = !notifOpen; setNotifOpen(opening); if (opening) markNotificationsRead?.(); }}>
            <Icon name="bell" size={20} />
            {unreadCount > 0 && <span style={{ position: 'absolute', top: 7, right: 8, width: 8, height: 8, borderRadius: '50%', background: 'var(--coral)', boxShadow: '0 4px 8px rgba(111,77,52,.22)' }} />}
          </button>
          {notifOpen && (
            <div role="menu" aria-label="Notifications" style={{ position: 'absolute', top: 46, right: 0, zIndex: 30, width: 260, maxHeight: 320, overflowY: 'auto', background: 'var(--navy-800)', border: '1px solid rgba(45,91,57,.12)', borderRadius: 16, padding: 8, boxShadow: '0 16px 40px rgba(30,91,57,.18)' }}>
              {(!notifications || notifications.length === 0) ? (
                <div className="dim" style={{ fontWeight: 700, fontSize: 13, padding: 14, textAlign: 'center' }}>No notifications yet</div>
              ) : notifications.map(n => (
                <div key={n.id} style={{ padding: '10px 12px', borderRadius: 11, marginBottom: 2, background: n.read ? 'transparent' : 'rgba(46,125,79,.08)', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{n.message}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* hero stat card */}
      <div style={{ padding: '8px 16px 0' }}>
        <div className="card card-glow" style={{ padding: 18, background: 'radial-gradient(200px 120px at 85% -20%, rgba(117,183,123,.20), transparent), linear-gradient(180deg,var(--navy-800),var(--navy-700))' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div className="eyebrow" style={{ color: 'var(--green)', marginBottom: 4 }}>Your points</div>
              <div className={bump === 'you' ? 'count-flash' : ''} style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 46, lineHeight: 1, letterSpacing: 0 }}>
                {(you.points || 0).toLocaleString()}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.06)', padding: '6px 12px', borderRadius: 9999 }}>
                <Icon name="trophy" size={16} color="var(--yellow)" />
                <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16 }}>#{you.rank}</span>
              </div>
              <Streak n={you.streak || 0} />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
              <span className="muted" style={{ fontSize: 13, fontWeight: 700 }}>{gap > 0 ? `${gap} pts to rank #${you.rank - 1}` : 'You’re #1 — defend it!'}</span>
              <span className="dim" style={{ fontSize: 13, fontWeight: 700 }}>{Math.round(prog)}%</span>
            </div>
            <div className="bar"><i style={{ width: prog + '%' }} /></div>
          </div>
        </div>
      </div>

      <div style={{ height: 110 }} />
    </div>
  );
}
