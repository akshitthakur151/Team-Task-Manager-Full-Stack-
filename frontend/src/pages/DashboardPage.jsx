import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow, isPast, parseISO } from 'date-fns';

const STATUS_LABELS = { todo:'To Do', in_progress:'In Progress', review:'Review', done:'Done' };
const PRIORITY_COLORS = { high:'var(--red)', medium:'var(--yellow)', low:'var(--green)' };

function StatCard({ label, value, icon, color }) {
  return (
    <div className="card" style={{ display:'flex', alignItems:'center', gap:16 }}>
      <div style={{
        width:48, height:48, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center',
        background: `${color}22`, flexShrink:0
      }}>
        <span style={{ fontSize:22 }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontSize:28, fontFamily:'var(--font-display)', fontWeight:800, lineHeight:1 }}>{value}</div>
        <div style={{ fontSize:13, color:'var(--text2)', marginTop:4 }}>{label}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', flex:1, height:'100%' }}>
      <div className="spinner" style={{ width:32, height:32 }} />
    </div>
  );

  const { stats, statusCounts, overdueTasks, recentTasks } = data;

  return (
    <div style={{ padding:'32px', maxWidth:1100, margin:'0 auto', width:'100%' }}>
      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontSize:28, marginBottom:6 }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color:'var(--text2)' }}>Here's what's happening with your tasks today.</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:32 }}>
        <StatCard label="Active Projects" value={stats.totalProjects} icon="📁" color="var(--accent)" />
        <StatCard label="My Tasks" value={stats.totalTasks} icon="📋" color="var(--blue)" />
        <StatCard label="Completed" value={stats.completedTasks} icon="✅" color="var(--green)" />
        <StatCard label="Overdue" value={stats.overdueTasks} icon="⚠️" color="var(--red)" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
        {/* Status breakdown */}
        <div className="card">
          <h3 style={{ marginBottom:20, fontSize:16 }}>Task Status</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {Object.entries(statusCounts).map(([status, count]) => {
              const total = Object.values(statusCounts).reduce((a,b) => a+b, 0) || 1;
              const pct = Math.round((count/total)*100);
              const colors = { todo:'var(--text3)', in_progress:'var(--blue)', review:'var(--yellow)', done:'var(--green)' };
              return (
                <div key={status}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:13 }}>
                    <span style={{ color:'var(--text2)' }}>{STATUS_LABELS[status]}</span>
                    <span style={{ fontWeight:600 }}>{count}</span>
                  </div>
                  <div style={{ height:6, background:'var(--bg3)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:colors[status], borderRadius:3, transition:'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Overdue tasks */}
        <div className="card">
          <h3 style={{ marginBottom:20, fontSize:16 }}>Overdue Tasks</h3>
          {overdueTasks.length === 0 ? (
            <div style={{ textAlign:'center', color:'var(--text3)', padding:'24px 0' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🎉</div>
              <p style={{ fontSize:14 }}>No overdue tasks!</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {overdueTasks.map(t => (
                <div key={t._id} onClick={() => navigate(`/projects/${t.projectId}`)}
                  style={{ padding:'10px 12px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, cursor:'pointer' }}>
                  <div style={{ fontSize:13, fontWeight:500, marginBottom:3 }}>{t.title}</div>
                  <div style={{ fontSize:11, color:'var(--red)' }}>
                    Due {t.dueDate ? formatDistanceToNow(parseISO(t.dueDate), { addSuffix:true }) : '—'} · {t.projectName}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="card" style={{ gridColumn:'1 / -1' }}>
          <h3 style={{ marginBottom:20, fontSize:16 }}>Recent Activity</h3>
          {recentTasks.length === 0 ? (
            <p style={{ color:'var(--text3)', textAlign:'center', padding:'20px 0' }}>No tasks yet. Create a project to get started!</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
              {recentTasks.map((t,i) => (
                <div key={t._id} onClick={() => navigate(`/projects/${t.projectId}`)}
                  style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'12px 0', cursor:'pointer',
                    borderBottom: i < recentTasks.length - 1 ? '1px solid var(--border)' : 'none'
                  }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:PRIORITY_COLORS[t.priority], flexShrink:0 }} />
                    <div>
                      <div style={{ fontSize:14, fontWeight:500 }}>{t.title}</div>
                      <div style={{ fontSize:12, color:'var(--text3)' }}>{t.projectName}</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                    <span className={`badge badge-${t.status}`}>{STATUS_LABELS[t.status]}</span>
                    <span style={{ fontSize:11, color:'var(--text3)' }}>{formatDistanceToNow(parseISO(t.updatedAt), { addSuffix:true })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
