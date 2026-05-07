import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const toast = useToast();

  const validate = () => {
    const e = {};
    if (mode === 'signup' && !form.name.trim()) e.name = 'Name is required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true); setErrors({});
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast('Welcome back!');
      } else {
        await signup(form.name, form.email, form.password);
        toast('Account created! Welcome to TaskFlow.');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Something went wrong';
      toast(msg, 'error');
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'var(--bg)', padding:'20px',
      backgroundImage:'radial-gradient(ellipse at 20% 50%, rgba(108,99,255,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(167,139,250,0.06) 0%, transparent 40%)',
    }}>
      <div style={{ width:'100%', maxWidth:420 }}>
        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{
            width:56, height:56, background:'var(--accent)',
            borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 16px', boxShadow:'0 0 32px var(--accent-glow)'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
          </div>
          <h1 style={{ fontSize:28, marginBottom:8 }}>TaskFlow</h1>
          <p style={{ color:'var(--text2)', fontSize:15 }}>
            {mode === 'login' ? 'Sign in to your workspace' : 'Create your workspace'}
          </p>
        </div>

        <div className="card" style={{ padding:32 }}>
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {mode === 'signup' && (
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text" placeholder="Your name"
                  value={form.name} onChange={e => setForm({...form, name:e.target.value})}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input
                type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({...form, email:e.target.value})}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password" placeholder={mode === 'login' ? '••••••••' : 'Min 6 characters'}
                value={form.password} onChange={e => setForm({...form, password:e.target.value})}
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>
            {errors.form && <div className="error-text" style={{textAlign:'center'}}>{errors.form}</div>}
            <button type="submit" className="btn-primary" disabled={loading}
              style={{ width:'100%', padding:'12px', fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {loading ? <span className="spinner" /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign:'center', color:'var(--text2)', fontSize:14 }}>
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErrors({}); }}
              style={{ background:'none', color:'var(--accent2)', fontWeight:600, fontSize:14, padding:0, border:'none', cursor:'pointer', textDecoration:'underline' }}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        {mode === 'login' && (
          <p style={{ textAlign:'center', color:'var(--text3)', fontSize:12, marginTop:16 }}>
            Demo: demo@taskflow.com / demo123
          </p>
        )}
      </div>
    </div>
  );
}
