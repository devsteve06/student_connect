import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, ShieldCheck, GraduationCap, Building2, Briefcase,
  KeyRound, Trash2, UserPlus, Search, RefreshCw, LogIn, LayoutGrid
} from 'lucide-react';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Modal from '../../../components/common/Modal';
import Badge from '../../../components/common/Badge';
import EmptyState from '../../../components/common/EmptyState';
import PageBanner from '../../../components/common/PageBanner';
import {
  adminService
} from '../../../service/adminService';
import { authService } from '../../../service/authService';
import { previewAccountEmail, normalizeDomain } from '../../../config/identity';
import { useAuth } from '../../../context/useAuth';
import { roleChip } from '../../../config/roleTheme';

// Data source: wired to real API — adminService.getUsers(), createUser(),
// resetPassword(), deleteUser().
const ROLE_META = {
  admin: { label: 'Admin', badge: 'danger', icon: ShieldCheck },
  student: { label: 'Student', badge: 'success', icon: GraduationCap },
  firm: { label: 'Firm', badge: 'warning', icon: Building2 },
  university: { label: 'University', badge: 'info', icon: Briefcase }
};

// Cross-portal hand-off. An admin session cannot open another role's area —
// ProtectedRoute bounces it home — and a live session would also bounce the
// visitor off the sign-in screen (GuestRoute). So each entry points at that
// portal's *login*, and jumping ends the admin session first.
const CROSS_PORTALS = [
  { role: 'student', label: 'Student hub', loginPath: '/login/students' },
  { role: 'firm', label: 'Corporate gate', loginPath: '/login/firms' },
  { role: 'university', label: 'Faculty console', loginPath: '/login/universities' }
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
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
        logout();
        navigate('/login/admin');
        return;
      }
      setError(err.response?.data?.message || 'Failed to load accounts.');
    } finally {
      setLoading(false);
    }
  }, [navigate, logout]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login/admin');
      return;
    }
    const timer = setTimeout(loadUsers, 0);
    return () => clearTimeout(timer);
  }, [loadUsers, navigate, isAuthenticated]);

  const counts = useMemo(() => {
    const base = { admin: 0, student: 0, firm: 0, university: 0 };
    users.forEach((u) => {
      base[u.role] = (base[u.role] || 0) + 1;
    });
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
    { key: 'all', label: 'Total accounts', value: users.length, icon: Users, accent: 'text-ink', tone: 'neutral' },
    { key: 'admin', label: 'Administrators', value: counts.admin, icon: ShieldCheck, accent: 'text-rose-600', tone: 'danger' },
    { key: 'student', label: 'Students', value: counts.student, icon: GraduationCap, accent: 'text-emerald-600', tone: 'success' },
    { key: 'firm', label: 'Firms', value: counts.firm, icon: Building2, accent: 'text-amber-600', tone: 'warning' },
    { key: 'university', label: 'Universities', value: counts.university, icon: Briefcase, accent: 'text-cyan-600', tone: 'info' }
  ];

  const toneClass = {
    neutral: 'text-ink-3 bg-surface-3',
    danger: 'text-rose-600 bg-rose-50',
    success: 'text-emerald-600 bg-emerald-50',
    warning: 'text-amber-600 bg-amber-50',
    info: 'text-cyan-600 bg-cyan-50'
  };

  const eyebrow = roleChip('admin');

  // Sign the admin out, then land on the chosen portal's sign-in screen. Without
  // the logout both routers would bounce the request straight back to /admin.
  const handlePortalJump = (loginPath) => {
    logout();
    navigate(loginPath, { replace: true });
  };

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div
          role="status"
          className={`fixed right-6 top-6 z-[60] animate-scale-in rounded-xl border px-4 py-3 text-sm font-semibold shadow-pop ${
            toast.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <PageBanner role="admin">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span className={eyebrow.classes}>{eyebrow.label}</span>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Admin overview</h1>
            <p className="mt-1 text-sm text-ink-4">Manage accounts across every portal.</p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-center">
            <Button variant="secondary" icon={RefreshCw} onClick={loadUsers}>
              Refresh
            </Button>
            <Button icon={UserPlus} onClick={() => setCreateOpen(true)}>
              Create account
            </Button>
          </div>
        </div>
      </PageBanner>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {metricCards.map((m) => {
          const Icon = m.icon;
          const active = activeRole === m.key;
          return (
            <button
              key={m.key}
              onClick={() => setActiveRole(m.key)}
              className={`text-left rounded-2xl border bg-surface p-5 shadow-soft transition-all hover:shadow-lifted ${
                active ? 'border-brand-300 ring-2 ring-brand-500/20' : 'border-line/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-5">{m.label}</span>
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneClass[m.tone]}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <span className="mt-3 block text-3xl font-extrabold tracking-tight text-ink">{m.value}</span>
            </button>
          );
        })}
      </div>

      {/* Cross-portal quick access */}
      <section className="rounded-2xl border border-line/80 bg-slate-950 p-6 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-rose-300" />
          <h2 className="text-sm font-extrabold tracking-tight text-white">Jump into any portal</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CROSS_PORTALS.map((p) => (
            <button
              key={p.role}
              onClick={() => handlePortalJump(p.loginPath)}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10"
            >
              <span>{p.label}</span>
              <LogIn className="h-4 w-4 opacity-60" />
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-5">
          Each portal has its own sign-in. Jumping ends the admin session and opens that portal&apos;s
          login screen.
        </p>
      </section>

      {/* Controls */}
      <div className="flex flex-col gap-4 rounded-xl border border-line/80 bg-surface p-3 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-surface-3 p-1 text-sm font-semibold">
          {['all', 'admin', 'student', 'firm', 'university'].map((r) => (
            <button
              key={r}
              onClick={() => setActiveRole(r)}
              className={`rounded-lg px-3 py-1.5 capitalize transition-colors ${
                activeRole === r ? 'bg-surface text-ink shadow-soft' : 'text-ink-4 hover:text-ink'
              }`}
            >
              {r === 'all' ? 'All accounts' : `${r}s`}
            </button>
          ))}
        </div>
        <Input
          icon={Search}
          placeholder="Search name, email, or reg number…"
          className="sm:w-72"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <section className="overflow-hidden rounded-2xl border border-line/80 bg-surface shadow-soft">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex items-center gap-3 text-sm font-semibold text-ink-5">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading accounts…
            </div>
          </div>
        ) : error ? (
          <EmptyState
            title="Could not load accounts"
            description={error}
            action={
              <Button variant="secondary" onClick={loadUsers}>
                Try again
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No accounts found"
            description="No accounts match your current filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line-2 bg-surface-2/60 text-xs font-bold uppercase tracking-wider text-ink-5">
                  <th className="px-5 py-3">Account</th>
                  <th className="px-5 py-3">Username / email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-2">
                {filtered.map((u) => {
                  const meta = ROLE_META[u.role] || ROLE_META.student;
                  const Icon = meta.icon;
                  return (
                    <tr key={`${u.role}-${u.id}`} className="transition-colors hover:bg-surface-2/60">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-ink-4">
                            <Icon className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="font-bold text-ink">{u.name || '—'}</p>
                            {u.regNumber && <p className="text-xs text-ink-5">{u.regNumber}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-ink-3">{u.username || u.email || '—'}</td>
                      <td className="px-5 py-4">
                        <Badge variant={meta.badge}>{meta.label}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={KeyRound}
                            onClick={() => setResetTarget(u)}
                          >
                            Reset
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            icon={Trash2}
                            onClick={() => setDeleteTarget(u)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modals */}
      {resetTarget && (
        <ResetPasswordModal
          target={resetTarget}
          onClose={() => setResetTarget(null)}
          onDone={(msg) => {
            setResetTarget(null);
            flash('success', msg);
          }}
          onError={(msg) => flash('error', msg)}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          target={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDone={(msg) => {
            setDeleteTarget(null);
            flash('success', msg);
            loadUsers();
          }}
          onError={(msg) => flash('error', msg)}
        />
      )}
      {createOpen && (
        <CreateUserModal
          onClose={() => setCreateOpen(false)}
          onDone={(msg) => {
            setCreateOpen(false);
            flash('success', msg);
            loadUsers();
          }}
          onError={(msg) => flash('error', msg)}
        />
      )}
    </div>
  );
}

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
    <Modal
      isOpen
      onClose={onClose}
      title="Reset password"
      subtitle={`${target.role} · ${target.username || target.email}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="reset-form" disabled={busy}>
            {busy ? 'Resetting…' : 'Reset password'}
          </Button>
        </>
      }
    >
      <form id="reset-form" onSubmit={submit} className="space-y-4">
        <Input
          label="New password"
          type="text"
          autoComplete="off"
          minLength={4}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Set a new password"
          hint="The account holder will sign in with this new password right away."
        />
      </form>
    </Modal>
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
    <Modal
      isOpen
      onClose={onClose}
      title="Delete account"
      subtitle={`${target.role} · ${target.username || target.email}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={submit} disabled={busy}>
            {busy ? 'Deleting…' : 'Delete account'}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-ink-3">
        You're about to permanently remove <span className="font-bold text-ink">{target.name}</span>. This also
        removes any linked applications and logbooks. This can't be undone.
      </p>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Create user
// ---------------------------------------------------------------------------
function CreateUserModal({ onClose, onDone, onError }) {
  const [form, setForm] = useState({
    role: 'student',
    name: '',
    email: '',
    username: '',
    universityId: '',
    domain: '',
    course: '',
    password: ''
  });
  const [universities, setUniversities] = useState([]);
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));
  const isAdmin = form.role === 'admin';

  // Students and firms are affiliated to an existing institution; a university
  // supplies its own domain. Either way the admin never types the address — the
  // API derives it, exactly like self-signup (config/identity.js mirrors the
  // server's rules), and it is read-only from then on.
  useEffect(() => {
    if (isAdmin) return undefined;
    let active = true;
    authService
      .listUniversities()
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        setUniversities(list);
        if (list[0]?.id) {
          setForm((prev) => (prev.universityId ? prev : { ...prev, universityId: String(list[0].id) }));
        }
      })
      .catch(() => {
        if (active) setUniversities([]);
      });
    return () => {
      active = false;
    };
  }, [isAdmin]);

  const selectedUniversity = universities.find((u) => String(u.id) === String(form.universityId));
  const domain = form.role === 'university' ? normalizeDomain(form.domain) : selectedUniversity?.domain;
  const derivedEmail = previewAccountEmail({ role: form.role, name: form.name, domain });

  const nameLabel =
    form.role === 'firm' ? 'Company name' : form.role === 'university' ? 'Institution name' : 'Full name';
  const namePlaceholder =
    form.role === 'firm'
      ? 'e.g. Nexus Labs'
      : form.role === 'university'
        ? 'e.g. University of Eldoret'
        : 'e.g. Alex Kamau';

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
        if (form.role === 'university') {
          payload.domain = domain;
        } else {
          payload.universityId = form.universityId;
          if (form.role === 'firm') payload.companyName = form.name;
          if (form.role === 'student') payload.course = form.course;
        }
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
    <Modal
      isOpen
      onClose={onClose}
      title="Create account"
      subtitle="Add an account in any role"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="create-form" disabled={busy}>
            {busy ? 'Creating…' : 'Create account'}
          </Button>
        </>
      }
    >
      <form id="create-form" onSubmit={submit} className="space-y-4">
        <Select label="Role" value={form.role} onChange={(e) => set('role', e.target.value)}>
          <option value="student">Student</option>
          <option value="firm">Firm</option>
          <option value="university">University</option>
          <option value="admin">Administrator</option>
        </Select>

        <Input
          label={nameLabel}
          required
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder={namePlaceholder}
        />

        {isAdmin ? (
          <>
            <Input
              label="Username"
              required
              value={form.username}
              onChange={(e) => set('username', e.target.value)}
              placeholder="e.g. ops-admin"
            />
            <Input
              label="Email (optional)"
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="name@example.com"
            />
          </>
        ) : form.role === 'university' ? (
          <Input
            label="Institution email domain"
            required
            value={form.domain}
            onChange={(e) => set('domain', e.target.value)}
            placeholder="strathmore.edu"
            hint="The registrar address is derived from it and shown below."
          />
        ) : (
          <Select
            label="University"
            required
            value={form.universityId}
            onChange={(e) => set('universityId', e.target.value)}
          >
            {universities.length === 0 && <option value="">Loading universities…</option>}
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        )}

        {form.role === 'student' && (
          <Input
            label="Course"
            required
            value={form.course}
            onChange={(e) => set('course', e.target.value)}
            placeholder="e.g. BBIT"
            hint="Used to assign the admission number."
          />
        )}

        {!isAdmin && (
          <p className="rounded-xl border border-line bg-surface px-4 py-3 text-xs text-ink-4">
            {derivedEmail ? (
              <>
                The account is created with the read-only address{' '}
                <span className="font-semibold text-ink-2">{derivedEmail}</span>.
              </>
            ) : (
              'Complete the name and institution above to preview the address the API will assign.'
            )}
          </p>
        )}

        <Input
          label="Temporary password"
          minLength={4}
          required
          value={form.password}
          onChange={(e) => set('password', e.target.value)}
          placeholder="Set a temporary password"
          hint="The account holder should change this after first sign-in."
        />
      </form>
    </Modal>
  );
}