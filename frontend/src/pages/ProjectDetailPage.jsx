import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { format, isPast, parseISO } from 'date-fns';

const STATUSES = ['todo','in_progress','review','done'];
const STATUS_LABELS = { todo:'To Do', in_progress:'In Progress', review:'Review', done:'Done' };
const PRIORITIES = ['low','medium','high'];

function TaskModal({ onClose, onSave, initial, members, myRole }) {
  const [form, setForm] = useState(initial || { title:'', description:'', priority:'medium', status:'todo', assigneeId:'', dueDate:'' });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast('Title required', 'error');
    setLoading(true);
    try {
      const payload = { ...form, assigneeId: form.assigneeId || null, dueDate: form.dueDate || null };
      await onSave(payload); onClose();
    } catch (err) { toast(err.response?.data?.error || 'Failed', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth:520 }}>
        <div className="modal-header">
          <h2>{initial ? 'Edit Task' : 'New Task'}</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="form-group">
            <label>Title *</label>
            <input placeholder="Task title" value={form.title} onChange={e => setForm({...form, title:e.target.value})} autoFocus />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={3} placeholder="Optional details..." value={form.description} onChange={e => setForm({...form, description:e.target.value})} style={{resize:'vertical'}} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Priority</label>
              <select value={form.priority} onChange={e => setForm({...form, priority:e.target.value})}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm({...form, status:e.target.value})}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Assignee</label>
              <select value={form.assigneeId} onChange={e => setForm({...form, assigneeId:e.target.value})}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.userId} value={m.userId}>{m.user?.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input type="date" value={form.dueDate ? form.dueDate.split('T')[0] : ''} onChange={e => setForm({...form, dueDate:e.target.value ? new Date(e.target.value).toISOString() : ''})} />
            </div>
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <span className="spinner"/> : (initial ? 'Save' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MemberModal({ onClose, onAdd }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try { await onAdd(email, role); onClose(); }
    catch (err) { toast(err.response?.data?.error || 'User not found', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth:400 }}>
        <div className="modal-header">
          <h2>Add Member</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="member@example.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <span className="spinner"/> : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete, members, myRole, userId }) {
  const isOverdue = task.dueDate && isPast(parseISO(task.dueDate)) && task.status !== 'done';
  const assignee = members.find(m => m.userId === task.assigneeId);
  const canEdit = myRole === 'admin' || task.createdBy === userId || task.assigneeId === userId;

  return (
    <div style={{
      background:'var(--bg3)', border:'1px solid var(--border)',
      borderRadius:10, padding:14, transition:'border-color 0.15s',
      borderLeft: isOverdue ? '3px solid var(--red)' : undefined,
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor='var(--border2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor=isOverdue?'var(--red)':'var(--border)'}>
      
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
        <h4 style={{ fontSize:14, fontWeight:600, lineHeight:1.3, flex:1, marginRight:8 }}>{task.title}</h4>
        <div style={{ display:'flex', gap:2, flexShrink:0 }}>
          {canEdit && <button className="btn-icon" style={{ fontSize:12 }} onClick={() => onEdit(task)}>✏️</button>}
          {(myRole === 'admin' || task.createdBy === userId) && <button className="btn-icon" style={{ fontSize:12 }} onClick={() => onDelete(task._id)}>🗑️</button>}
        </div>
      </div>

      {task.description && <p style={{ fontSize:12, color:'var(--text2)', marginBottom:10, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{task.description}</p>}

      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
        {isOverdue && <span className="badge" style={{ background:'rgba(239,68,68,0.15)', color:'var(--red)' }}>Overdue</span>}
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, color:'var(--text3)' }}>
        <span>{assignee ? `👤 ${assignee.user?.name}` : '👤 Unassigned'}</span>
        {task.dueDate && <span style={{ color: isOverdue ? 'var(--red)' : 'var(--text3)' }}>📅 {format(parseISO(task.dueDate), 'MMM d')}</span>}
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [activeTab, setActiveTab] = useState('board');
  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate();
  const toast = useToast();

  const load = async () => {
    try {
      const [pr, tr] = await Promise.all([
        API.get(`/projects/${id}`),
        API.get(`/projects/${id}/tasks`)
      ]);
      setProject(pr.data);
      setTasks(tr.data);
    } catch (err) {
      if (err.response?.status === 403) { toast('Access denied', 'error'); navigate('/projects'); }
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const myRole = project?.myRole;
  const members = project?.members || [];

  const handleCreateTask = async (form) => {
    const r = await API.post(`/projects/${id}/tasks`, form);
    setTasks(t => [...t, r.data]);
    toast('Task created!');
  };

  const handleEditTask = async (form) => {
    const r = await API.put(`/projects/${id}/tasks/${editTask._id}`, form);
    setTasks(t => t.map(x => x._id === r.data._id ? r.data : x));
    setEditTask(null);
    toast('Task updated!');
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    await API.delete(`/projects/${id}/tasks/${taskId}`);
    setTasks(t => t.filter(x => x._id !== taskId));
    toast('Task deleted');
  };

  const handleAddMember = async (email, role) => {
    const r = await API.post(`/projects/${id}/members`, { email, role });
    await load();
    toast(`${r.data.user.name} added!`);
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    await API.delete(`/projects/${id}/members/${userId}`);
    await load();
    toast('Member removed');
  };

  const filteredTasks = useMemo(() => 
    filterStatus === 'all' ? tasks : tasks.filter(t => t.status === filterStatus),
    [tasks, filterStatus]
  );

  const tasksByStatus = useMemo(() =>
    STATUSES.reduce((acc, s) => {
      acc[s] = filteredTasks.filter(t => t.status === s);
      return acc;
    }, {}),
    [filteredTasks]
  );

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', flex:1, height:'100%' }}>
      <div className="spinner" style={{ width:32, height:32 }} />
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'24px 32px 0', borderBottom:'1px solid var(--border)', background:'var(--bg)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, maxWidth:1200 }}>
          <div>
            <button onClick={() => navigate('/projects')} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:13, marginBottom:6, padding:0 }}>
              ← Projects
            </button>
            <h1 style={{ fontSize:24, marginBottom:4 }}>{project.name}</h1>
            {project.description && <p style={{ color:'var(--text2)', fontSize:14 }}>{project.description}</p>}
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {myRole === 'admin' && (
              <button className="btn-ghost" onClick={() => setShowMemberModal(true)} style={{ fontSize:13 }}>
                👥 Add Member
              </button>
            )}
            <button className="btn-primary" onClick={() => setShowTaskModal(true)} style={{ fontSize:13 }}>
              + New Task
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:0 }}>
          {['board','list','members'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background:'none', border:'none', padding:'10px 16px', fontSize:14,
              color: activeTab === tab ? 'var(--accent2)' : 'var(--text2)',
              borderBottom: `2px solid ${activeTab === tab ? 'var(--accent)' : 'transparent'}`,
              cursor:'pointer', textTransform:'capitalize', fontFamily:'var(--font-body)',
            }}>
              {tab === 'board' ? '📋 Board' : tab === 'list' ? '📄 List' : '👥 Members'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:'auto', padding:'24px 32px' }}>
        {activeTab === 'board' && (
          <div style={{ display:'flex', gap:16, minHeight:400, alignItems:'flex-start' }}>
            {STATUSES.map(status => (
              <div key={status} style={{ width:260, flexShrink:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <h3 style={{ fontSize:13, fontFamily:'var(--font-display)', fontWeight:600, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                    {STATUS_LABELS[status]}
                  </h3>
                  <span style={{ fontSize:12, background:'var(--bg3)', padding:'2px 8px', borderRadius:100, color:'var(--text3)' }}>
                    {tasksByStatus[status].length}
                  </span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, minHeight:60 }}>
                  {tasksByStatus[status].map(task => (
                    <TaskCard key={task._id} task={task} onEdit={setEditTask} onDelete={handleDeleteTask} members={members} myRole={myRole} userId={user.id} />
                  ))}
                  {tasksByStatus[status].length === 0 && (
                    <div style={{ border:'1px dashed var(--border)', borderRadius:10, padding:'20px', textAlign:'center', color:'var(--text3)', fontSize:12 }}>
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'list' && (
          <div>
            {/* Filter */}
            <div style={{ display:'flex', gap:8, marginBottom:20 }}>
              {['all',...STATUSES].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)} style={{
                  background: filterStatus===s ? 'var(--accent)' : 'var(--bg3)',
                  color: filterStatus===s ? 'white' : 'var(--text2)',
                  border: `1px solid ${filterStatus===s ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius:100, padding:'5px 14px', fontSize:13,
                  cursor:'pointer', fontFamily:'var(--font-body)',
                }}>
                  {s === 'all' ? 'All' : STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid var(--border)' }}>
                    {['Title','Status','Priority','Assignee','Due Date',''].map(h => (
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', color:'var(--text2)', fontSize:12, fontFamily:'var(--font-display)', fontWeight:600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task, i) => {
                    const assignee = members.find(m => m.userId === task.assigneeId);
                    const isOverdue = task.dueDate && isPast(parseISO(task.dueDate)) && task.status !== 'done';
                    const canEdit = myRole==='admin' || task.createdBy===user.id || task.assigneeId===user.id;
                    return (
                      <tr key={task._id} style={{ borderBottom: i < filteredTasks.length-1 ? '1px solid var(--border)' : 'none', background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                        <td style={{ padding:'12px 16px', fontWeight:500 }}>{task.title}</td>
                        <td style={{ padding:'12px 16px' }}><span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span></td>
                        <td style={{ padding:'12px 16px' }}><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                        <td style={{ padding:'12px 16px', color:'var(--text2)', fontSize:13 }}>{assignee?.user?.name || '—'}</td>
                        <td style={{ padding:'12px 16px', fontSize:13, color:isOverdue?'var(--red)':'var(--text2)' }}>
                          {task.dueDate ? format(parseISO(task.dueDate), 'MMM d, yyyy') : '—'}
                        </td>
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ display:'flex', gap:4 }}>
                            {canEdit && <button className="btn-icon" style={{ fontSize:12 }} onClick={() => setEditTask(task)}>✏️</button>}
                            {(myRole==='admin'||task.createdBy===user.id) && <button className="btn-icon" style={{ fontSize:12 }} onClick={() => handleDeleteTask(task._id)}>🗑️</button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTasks.length === 0 && (
                    <tr><td colSpan={6} style={{ padding:'40px', textAlign:'center', color:'var(--text3)' }}>No tasks found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div style={{ maxWidth:600 }}>
            {members.map(m => (
              <div key={m.userId} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'14px 0', borderBottom:'1px solid var(--border)'
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{
                    width:38, height:38, borderRadius:'50%',
                    background:'linear-gradient(135deg, var(--accent), #a78bfa)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:'var(--font-display)', fontWeight:700, color:'white', fontSize:15
                  }}>
                    {m.user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight:500 }}>{m.user?.name} {m.userId === user.id && <span style={{ fontSize:11, color:'var(--text3)' }}>(you)</span>}</div>
                    <div style={{ fontSize:13, color:'var(--text2)' }}>{m.user?.email}</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span className={`badge badge-${m.role}`}>{m.role}</span>
                  {myRole === 'admin' && m.userId !== user.id && (
                    <button className="btn-danger" style={{ fontSize:12, padding:'4px 10px' }} onClick={() => handleRemoveMember(m.userId)}>Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showTaskModal && <TaskModal onClose={() => setShowTaskModal(false)} onSave={handleCreateTask} members={members} myRole={myRole} />}
      {editTask && <TaskModal initial={editTask} onClose={() => setEditTask(null)} onSave={handleEditTask} members={members} myRole={myRole} />}
      {showMemberModal && <MemberModal onClose={() => setShowMemberModal(false)} onAdd={handleAddMember} />}
    </div>
  );
}
