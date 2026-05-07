import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const icons = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  projects: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  logout: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  menu: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/auth'); };

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, flexShrink: 0, background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        transition: 'transform 0.3s',
        position: 'relative', zIndex: 50,
      }} className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:34, height:34, background:'var(--accent)',
              borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 16px var(--accent-glow)'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:18, letterSpacing:'-0.02em' }}>TaskFlow</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'16px 12px', display:'flex', flexDirection:'column', gap:4 }}>
          {[
            { to:'/dashboard', label:'Dashboard', icon:icons.dashboard },
            { to:'/projects', label:'Projects', icon:icons.projects },
          ].map(({ to, label, icon }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:10,
              padding:'10px 12px', borderRadius:10, textDecoration:'none',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--accent2)' : 'var(--text2)',
              background: isActive ? 'rgba(108,99,255,0.12)' : 'transparent',
              transition:'all 0.15s',
            })}>
              {icon}{label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding:'16px 16px 20px', borderTop:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <div style={{
              width:34, height:34, borderRadius:'50%',
              background:'linear-gradient(135deg, var(--accent), #a78bfa)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, color:'white', flexShrink:0
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ overflow:'hidden' }}>
              <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize:11, color:'var(--text3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-ghost" style={{ width:'100%', display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}>
            {icons.logout} Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, overflow:'auto', display:'flex', flexDirection:'column' }}>
        <Outlet />
      </main>

      <style>{`
        @media (max-width: 768px) {
          .sidebar { position:fixed; left:0; top:0; height:100%; transform:translateX(-100%); }
          .sidebar.open { transform:translateX(0); }
        }
      `}</style>
    </div>
  );
}
