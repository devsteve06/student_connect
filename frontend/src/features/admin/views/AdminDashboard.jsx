import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, ShieldCheck, GraduationCap, Building2, Briefcase,
  KeyRound, Trash2, UserPlus, Search, RefreshCw, ExternalLink, X
} from 'lucide-react';
import Button from '../../../components/common/Button';
import { adminService } from '../../../service/adminService';

const ROLE_META = {
  admin: { label: 'Admin', badge: 'bg-rose-50 text-rose-700 border-rose-200', icon: ShieldCheck },
  student: { label: 'Student', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: GraduationCap },
  firm: { label: 'Firm', badge: 'bg-amber-50 text-amber-700 border-amber-200', icon: Building2 },
  university: { label: 'University', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Briefcase }
};

const CROSS_PORTALS = [
  { role: 'student', label: 'Student Hub', href: '/student', accent: 'hover:border-emerald-300 hover:text-emerald-700' },
  { role: 'firm', label: 'Corporate Gate', href: '/firm', accent: 'hover:border-amber-300 hover:text-amber-700' },
  { role: 'university', label: 'Faculty Console', href: '/university', accent: 'hover:border-indigo-300 hover:text-indigo-700' }
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const [search, setSearch] = useState('');
  const [activeRole, setActiveRole] = useState('all');

  const [resetTarget, setResetTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const flash = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getUsers();
      setUsers(data || []);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        adminService.logout();
        navigate('/login/admin');
        return;
      }
      setError(err.response?.data?.message || 'Failed to load accounts.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!adminService.isAuthenticated()) {
      navigate('/login/admin');
      return;
    }
    loadUsers();
  }, [loadUsers, navigate]);

  const counts = useMemo(() => {
    const base = { admin: 0, student: 0, firm: 0, university: 0 };
    users.forEach((u) => { base[u.role] = (base[u.role] || 0) + 1; });
    return base;
  }, [users]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesRole = activeRole === 'all' || u.role === activeRole;
      const haystack = `${u.name || ''} ${u.email || ''} ${u.username || ''} ${u.regNumber || ''}`.toLowerCase();
      return matchesRole && (q === '' || haystack.includes(q));
    });
  }, [users, search, activeRole]);

  const metricCards = [
    { key: 'all', label: 'Total Accounts', value: users.length, icon: Users, accent: 'text-slate-900', ring: '' },
    { key: 'admin', label: 'Administrators', value: counts.admin, icon: ShieldCheck, accent: 'text-rose-600', ring: 'border-l-2 border-l-rose-500' },
    { key: 'student', label: 'Students', value: counts.student, icon: GraduationCap, accent: 'text-emerald-600', ring: 'border-l-2 border-l-emerald-500' },
    { key: 'firm', label: 'Firms', value: counts.firm, icon: Building2, accent: 'text-amber-600', ring: 'border-l-2 border-l-amber-500' },
    { key: 'university', label: 'Universities', value: counts.university, icon: Briefcase, accent: 'text-indigo-600', ring: 'border-l-2 border-l-indigo-500' }
  ];

  return (
    <div className="space-y-8">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[60] px-4 py-3 rounded-xl text-xs font-bold shadow-lg border ${
          toast.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          {toast.message}
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest text-rose-700 bg-rose-50 border border-rose-100 font-mono">
            Root Control Plane / Node 2026
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-2">System Administration Console</h1>
        </div>
        <div className="flex items-center gap-3 self-start md:self-center">
          <Button variant="secondary" onClick={loadUsers} className="h-10 px-4 rounded-xl text-xs font-bold border-slate-200 flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button onClick={() => setCreateOpen(true)} className="h-10 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <UserPlus className="h-3.5 w-3.5" /> Provision Account
          </Button>
        </div>
      </div>

      {/* METRIC GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {metricCards.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.key}
              onClick={() => setActiveRole(m.key)}
              className={`text-left bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-4 transition-all hover:shadow-md ${m.ring} ${
                activeRole === m.key ? 'ring-2 ring-slate-900/10' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">{m.label}</span>
                <Icon className={`h-4 w-4 ${m.accent} opacity-70`} />
              </div>
              <span className={`text-3xl font-black tracking-tight ${m.accent}`}>{m.value}</span>
            </button>
          );
        })}
      </div>

      {/* CROSS-PORTAL QUICK ACCESS */}
      <div className="bg-slate-950 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider font-mono block">Impersonation Gateways</span>
            <h2 className="text-sm font-extrabold text-white tracking-tight">Jump Into Any Portal</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CROSS_PORTALS.map((p) => (
            <button
              key={p.role}
              onClick={() => navigate(p.href)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold transition-all ${p.accent}`}
            >
              <span>{p.label}</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </button>
          ))}
        </div>
      </div>

      {/* CONTROLS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
        <div className="flex items-center gap-1 w-full sm:w-auto bg-slate-200/60 p-1 rounded-lg text-xs font-bold overflow-x-auto">
          {['all', 'admin', 'student', 'firm', 'university'].map((r) => (
            <button
              key={r}
              onClick={() => setActiveRole(r)}
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap capitalize ${
                activeRole === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {r === 'all' ? 'All Accounts' : `${r}s`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, reg number…"
            className="w-full text-xs border border-slate-200 bg-white pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-slate-400 font-medium placeholder-slate-400 shadow-inner"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center text-xs font-bold text-slate-400 font-mono animate-pulse uppercase tracking-widest">
            Loading account registry…
          </div>
        ) : error ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-xs font-semibold text-rose-600">
            {error}
            <Button variant="secondary" onClick={loadUsers} className="h-8 px-4 rounded-lg text-[11px]">Retry</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-xs text-slate-400 font-medium font-mono">
            No accounts match the current filters.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider font-mono">
                <th className="p-4">Account</th>
                <th className="p-4">Identifier</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-right">Privileged Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((u) => {
                const meta = ROLE_META[u.role] || ROLE_META.student;
                const Icon = meta.icon;
                return (
                  <tr key={`${u.role}-${u.id}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{u.name || '—'}</div>
                          {u.regNumber && <div className="text-[10px] text-slate-400 font-mono">{u.regNumber}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 font-mono">{u.username || u.email || '—'}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${meta.badge}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setResetTarget(u)}
                          className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-[11px] font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all"
                        >
                          <KeyRound className="h-3 w-3" /> Reset
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODALS */}
      {resetTarget && (
        <ResetPasswordModal
          target={resetTarget}
          onClose={() => setResetTarget(null)}
          onDone={(msg) => { setResetTarget(null); flash('success', msg); }}
          onError={(msg) => flash('error', msg)}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          target={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDone={(msg) => { setDeleteTarget(null); flash('success', msg); loadUsers(); }}
          onError={(msg) => flash('error', msg)}
        />
      )}
      {createOpen && (
        <CreateUserModal
          onClose={() => setCreateOpen(false)}
          onDone={(msg) => { setCreateOpen(false); flash('success', msg); loadUsers(); }}
          onError={(msg) => flash('error', msg)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal shell
// ---------------------------------------------------------------------------
function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">{title}</h2>
            {subtitle && <p className="text-[11px] text-slate-400 font-mono mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const fieldClass =
  'w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:outline-none focus:bg-white focus:border-slate-400';

// ---------------------------------------------------------------------------
// Reset password
// ---------------------------------------------------------------------------
function ResetPasswordModal({ target, onClose, onDone, onError }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await adminService.resetPassword(target.role, target.id, password);
      onDone(res.message || 'Password reset.');
    } catch (err) {
      onError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title="Reset Password" subtitle={`${target.role} · ${target.username || target.email}`} onClose={onClose}>
      <form onSubmit={submit} className="p-6 space-y-4">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-700 uppercase">New Password</label>
          <input
            type="text"
            required
            minLength={4}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Set a new password"
            className={fieldClass}
          />
          <p className="text-[10px] text-slate-400">The account holder will sign in with this new password immediately.</p>
        </div>
        <div className="pt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="h-9 px-4 rounded-xl text-[11px]">Cancel</Button>
          <Button type="submit" disabled={busy} className="h-9 px-5 rounded-xl text-[11px]">{busy ? 'Applying…' : 'Reset Password'}</Button>
        </div>
      </form>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------
function DeleteModal({ target, onClose, onDone, onError }) {
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await adminService.deleteUser(target.role, target.id);
      onDone(res.message || 'Account deleted.');
    } catch (err) {
      onError(err.response?.data?.message || 'Failed to delete account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title="Delete Account" subtitle={`${target.role} · ${target.username || target.email}`} onClose={onClose}>
      <div className="p-6 space-y-4">
        <p className="text-xs text-slate-600 leading-relaxed">
          You are about to permanently remove <span className="font-bold text-slate-900">{target.name}</span>. This also
          cascades any linked records (applications, logbooks). This action cannot be undone.
        </p>
        <div className="pt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="h-9 px-4 rounded-xl text-[11px]">Cancel</Button>
          <button
            onClick={submit}
            disabled={busy}
            className="h-9 px-5 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 transition-all"
          >
            {busy ? 'Deleting…' : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Create user
// ---------------------------------------------------------------------------
function CreateUserModal({ onClose, onDone, onError }) {
  const [form, setForm] = useState({ role: 'student', name: '', email: '', username: '', password: '' });
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));
  const isAdmin = form.role === 'admin';

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { role: form.role, password: form.password };
      if (isAdmin) {
        payload.username = form.username;
        payload.name = form.name || 'System Administrator';
        if (form.email) payload.email = form.email;
      } else {
        payload.name = form.name;
        payload.email = form.email;
        if (form.role === 'firm') payload.companyName = form.name;
      }
      const res = await adminService.createUser(payload);
      onDone(`${res.role} account "${res.name}" created.`);
    } catch (err) {
      onError(err.response?.data?.message || 'Failed to create account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title="Provision Account" subtitle="Create an account in any role" onClose={onClose}>
      <form onSubmit={submit} className="p-6 space-y-4">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-700 uppercase">Role</label>
          <select value={form.role} onChange={(e) => set('role', e.target.value)} className={fieldClass}>
            <option value="student">Student</option>
            <option value="firm">Firm</option>
            <option value="university">University</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        {isAdmin ? (
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-700 uppercase">Username</label>
            <input type="text" required value={form.username} onChange={(e) => set('username', e.target.value)} placeholder="e.g. ops-admin" className={fieldClass} />
          </div>
        ) : (
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-700 uppercase">{form.role === 'firm' ? 'Company Name' : 'Full Name'}</label>
            <input type="text" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={form.role === 'firm' ? 'e.g. Nexus Labs' : 'e.g. Alex Kamau'} className={fieldClass} />
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-700 uppercase">Email {isAdmin && <span className="text-slate-400 normal-case font-normal">(optional)</span>}</label>
          <input type="email" required={!isAdmin} value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="name@example.com" className={fieldClass} />
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-700 uppercase">Password</label>
          <input type="text" required minLength={4} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Temporary password" className={fieldClass} />
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="h-9 px-4 rounded-xl text-[11px]">Cancel</Button>
          <Button type="submit" disabled={busy} className="h-9 px-5 rounded-xl text-[11px]">{busy ? 'Creating…' : 'Create Account'}</Button>
        </div>
      </form>
    </ModalShell>
  );
}
