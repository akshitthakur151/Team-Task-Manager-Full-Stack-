import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDistanceToNow, parseISO } from 'date-fns';

function ProjectModal({ onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || { name:'', description:'' });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast('Project name is required', 'error');
    setLoading(true);
    try { await onSave(form); onClose(); }
    catch (err) { toast(err.response?.data?.error || 'Failed to save', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{initial ? 'Edit Project' : 'New Project'}</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="form-group">
            <label>Project Name *</label>
            <input placeholder="e.g. Website Redesign" value={form.name} onChange={e => setForm({...form, name:e.target.value})} autoFocus />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={3} placeholder="What's this project about?" value={form.description} onChange={e => setForm({...form, description:e.target.value})} style={{resize:'vertical'}} />
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <span className="spinner"/> : (initial ? 'Save Changes' : 'Create Project')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  const load = () => API.get('/projects').then(r => setProjects(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async (form) => {
    const r = await API.post('/projects', form);
    setProjects(p => [...p, r.data]);
    toast('Project created!');
  };

  const handleEdit = async (form) => {
    const r = await API.put(`/projects/${editProject._id}`, form);
    setProjects(p => p.map(x => x._id === r.data._id ? {...x,...r.data} : x));
    setEditProject(null);
    toast('Project updated!');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    await API.delete(`/projects/${id}`);
    setProjects(p => p.filter(x => x._id !== id));
    toast('Project deleted');
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', flex:1, height:'100%' }}>
      <div className="spinner" style={{ width:32, height:32 }} />
    </div>
  );

  return (
    <div style={{ padding:'32px', maxWidth:1100, margin:'0 auto', width:'100%' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:32 }}>
        <div>
          <h1 style={{ fontSize:28, marginBottom:4 }}>Projects</h1>
          <p style={{ color:'var(--text2)' }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span>+</span> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 20px', background:'var(--bg2)', borderRadius:16, border:'1px dashed var(--border2)' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📁</div>
          <h3 style={{ marginBottom:8 }}>No projects yet</h3>
          <p style={{ color:'var(--text2)', marginBottom:20 }}>Create your first project to start organizing tasks.</p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>Create Project</button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
          {projects.map(p => {
            const pct = p.taskCount ? Math.round((p.completedCount/p.taskCount)*100) : 0;
            return (
              <div key={p._id} className="card" style={{ cursor:'pointer', transition:'all 0.2s', position:'relative' }}
                onClick={() => navigate(`/projects/${p._id}`)}
                onMouseEnter={e => e.currentTarget.style.borderColor='var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
                
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div style={{ flex:1, overflow:'hidden', marginRight:8 }}>
                    <h3 style={{ fontSize:17, marginBottom:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</h3>
                    <p style={{ fontSize:13, color:'var(--text2)', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                      {p.description || 'No description'}
                    </p>
                  </div>
                  <span className={`badge badge-${p.myRole}`}>{p.myRole}</span>
                </div>

                {/* Progress */}
                <div style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:12, color:'var(--text2)' }}>
                    <span>Progress</span>
                    <span>{pct}%</span>
                  </div>
                  <div style={{ height:5, background:'var(--bg3)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:'var(--accent)', borderRadius:3, transition:'width 0.5s' }}/>
                  </div>
                </div>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ display:'flex', gap:12, fontSize:13, color:'var(--text2)' }}>
                    <span>👥 {p.memberCount}</span>
                    <span>📋 {p.taskCount} tasks</span>
                  </div>
                  {p.myRole === 'admin' && (
                    <div style={{ display:'flex', gap:4 }} onClick={e => e.stopPropagation()}>
                      <button className="btn-icon" onClick={() => setEditProject(p)} title="Edit">✏️</button>
                      <button className="btn-icon" onClick={() => handleDelete(p._id)} title="Delete">🗑️</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && <ProjectModal onClose={() => setShowModal(false)} onSave={handleCreate} />}
      {editProject && <ProjectModal initial={editProject} onClose={() => setEditProject(null)} onSave={handleEdit} />}
    </div>
  );
}
