import { useEffect, useMemo, useState } from 'react';
import { Users, ClipboardList, Award, ClipboardCheck, Download, Search, ShieldAlert, RefreshCw } from 'lucide-react';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import MetricCard from '../../../components/data-display/MetricCard';
import StatusPill from '../../../components/common/StatusPill';
import EmptyState from '../../../components/common/EmptyState';
import Skeleton, { MetricSkeleton } from '../../../components/common/Skeleton';
import { roleChip } from '../../../config/roleTheme';
import { firmService } from '../../../service/firmService';

const PENDING_STATUS = 'Pending Review';
const PLACED_STATUSES = ['Approved', 'Hired'];

const initials = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0] || '?').slice(0, 2).toUpperCase();
};

const shapeApplicant = (row) => ({
  id: row.id,
  candidate: row.studentName,
  university: row.university,
  role: row.role,
  appliedDate: row.appliedDate,
  status: row.status,
  avatar: initials(row.studentName)
});

const PIPELINE_COLORS = {
  'Pending Review': 'bg-amber-500',
  'Interviewing': 'bg-cyan-500',
  'Approved': 'bg-emerald-500',
  'Hired': 'bg-emerald-600',
  'Rejected': 'bg-rose-400'
};

export default function FirmDashboard() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [applicants, setApplicants] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [overview, rows] = await Promise.all([
          firmService.getFirmMetrics(),
          firmService.getApplicants()
        ]);
        setMetrics(overview);
        setApplicants(rows.map(shapeApplicant));
      } catch (err) {
        setError(err?.response?.data?.message || 'This dashboard could not be loaded.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [reloadKey]);

  const retry = () => {
    setLoading(true);
    setError('');
    setReloadKey((key) => key + 1);
  };

  const handleStatusChange = async (id, newStatus) => {
    const previous = applicants;
    setApplicants((cur) => cur.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
    setSaveError('');
    try {
      const updated = await firmService.updateApplicantStatus(id, newStatus);
      setApplicants((cur) => cur.map((a) => (a.id === updated.id ? { ...a, status: updated.status } : a)));
    } catch (err) {
      setApplicants(previous);
      setSaveError(err?.response?.data?.message || 'The status could not be updated.');
    }
  };

  const totals = useMemo(() => {
    const total = applicants.length;
    const pending = applicants.filter((a) => a.status === PENDING_STATUS).length;
    const placed = applicants.filter((a) => PLACED_STATUSES.includes(a.status)).length;
    return { total, pending, placed };
  }, [applicants]);

  const filteredApplicants = useMemo(
    () =>
      applicants.filter((app) => {
        const matchesTab =
          activeTab === 'all' ||
          (activeTab === 'pending' && app.status === PENDING_STATUS) ||
          (activeTab === 'placed' && PLACED_STATUSES.includes(app.status));
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !q ||
          app.candidate.toLowerCase().includes(q) ||
          app.role.toLowerCase().includes(q) ||
          app.university.toLowerCase().includes(q);
        return matchesTab && matchesSearch;
      }),
    [applicants, activeTab, searchQuery]
  );

  const recentApplicants = applicants.slice(0, 3);

  const pipeline = useMemo(() => {
    const counts = {};
    applicants.forEach((a) => {
      counts[a.status] = (counts[a.status] || 0) + 1;
    });
    return ['Pending Review', 'Interviewing', 'Approved', 'Hired', 'Rejected']
      .filter((s) => counts[s])
      .map((s) => ({ status: s, count: counts[s] }));
  }, [applicants]);

  const exportCsv = () => {
    const cells = [
      ['Applicant', 'University', 'Role', 'Applied', 'Status'],
      ...applicants.map((a) => [a.candidate, a.university, a.role, a.appliedDate, a.status])
    ];
    const csv = cells
      .map((row) => row.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'firm-applicants.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { key: 'all', label: `All (${totals.total})` },
    { key: 'pending', label: `To review (${totals.pending})` },
    { key: 'placed', label: `Placed (${totals.placed})` }
  ];

  const eyebrow = roleChip('firm');

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="h-4 w-28 animate-pulse rounded-full bg-surface-4" />
          <div className="h-8 w-52 animate-pulse rounded-lg bg-surface-4" />
        </div>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricSkeleton key={i} />
          ))}
        </div>
        <Skeleton lines={5} />
        <Skeleton lines={3} />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <EmptyState
          icon={ShieldAlert}
          title="Could not load the dashboard"
          description={error}
          action={<Button icon={RefreshCw} onClick={retry}>Try again</Button>}
        />
      </Card>
    );
  }

  const metricCards = [
    { title: 'New applications', value: metrics.newApplications, unit: 'to review', icon: Users, tone: 'brand' },
    { title: 'Interviews pending', value: metrics.interviewsPending, unit: 'scheduled', icon: ClipboardList, tone: 'warning' },
    { title: 'Active interns', value: metrics.activeInterns, unit: 'placed', icon: Award, tone: 'success' },
    { title: 'Logbooks to verify', value: metrics.unverifiedLogbooks, unit: 'pending', icon: ClipboardCheck, tone: 'neutral' }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-line-2 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <span className={eyebrow.classes}>{eyebrow.label}</span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Overview</h1>
          <p className="mt-1 text-sm text-ink-4">A live view of your applicants and placement pipeline.</p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-center">
          <Button variant="secondary" icon={Download} onClick={exportCsv}>Export roster</Button>
        </div>
      </div>

      {/* Error banner for failed status updates */}
      {saveError && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <span>{saveError}</span>
          <button onClick={() => setSaveError('')} className="font-bold hover:text-rose-900">Dismiss</button>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {metricCards.map((card) => (
          <MetricCard key={card.title} {...card} />
        ))}
      </div>

      {/* Recent + pipeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Recent applicants" eyebrow="Latest first" className="lg:col-span-2" bodyClassName="p-2">
          {recentApplicants.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={Users}
                title="No applicants yet"
                description="Applications will appear here as students apply to your openings."
              />
            </div>
          ) : (
            <ul className="divide-y divide-line-2">
              {recentApplicants.map((app) => (
                <li key={app.id} className="flex items-center justify-between gap-4 px-3 py-4 transition-colors hover:bg-surface-2/70">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-ink">{app.candidate}</p>
                      <span className="text-xs text-ink-5">· {app.appliedDate}</span>
                    </div>
                    <p className="truncate text-sm text-ink-4">
                      {app.university} — <span className="text-ink-2">{app.role}</span>
                    </p>
                  </div>
                  <StatusPill status={app.status} className="shrink-0" />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Pipeline breakdown" eyebrow="By stage" bodyClassName="p-5">
          {pipeline.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nothing in the pipeline"
              description="Once students apply, their stage appears here."
            />
          ) : (
            <div className="space-y-4">
              {pipeline.map(({ status, count }) => {
                const percent = Math.round((count / applicants.length) * 100);
                return (
                  <div key={status} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-ink-2">{status}</span>
                      <span className="font-mono text-xs font-bold text-ink-4">{count} · {percent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${PIPELINE_COLORS[status] || 'bg-ink-4'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-xl border border-line/80 bg-surface p-3 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-surface-3 p-1 text-sm font-semibold">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                activeTab === tab.key ? 'bg-surface text-ink shadow-soft' : 'text-ink-4 hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by candidate, role, or university…"
            className="w-full rounded-xl border border-line bg-surface py-2 pl-10 pr-3 text-sm text-ink placeholder:text-ink-5 focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/10"
          />
        </div>
      </div>

      {/* Applicant cards */}
      {filteredApplicants.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No applicants match your search"
            description="Try adjusting the filters or search terms."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApplicants.map((app) => (
            <article
              key={app.id}
              className="flex flex-col gap-5 rounded-2xl border border-line/80 bg-surface p-5 shadow-soft transition-shadow hover:shadow-lifted lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex min-w-0 items-center gap-4 lg:w-72">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 font-mono text-xs font-bold text-brand-700">
                  {app.avatar}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-extrabold text-ink">{app.candidate}</h3>
                  <p className="truncate text-xs text-ink-4">{app.university}</p>
                </div>
              </div>

              <div className="min-w-0 lg:w-56">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-5">Applied for</p>
                <p className="truncate text-sm font-semibold text-ink-2">{app.role}</p>
              </div>

              <div className="min-w-0 lg:w-44">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-5">Applied</p>
                <p className="truncate text-sm font-semibold text-ink-2">{app.appliedDate}</p>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-line-2 pt-4 lg:justify-end lg:border-t-0 lg:pt-0">
                <StatusPill status={app.status} />
                {app.status === PENDING_STATUS ? (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleStatusChange(app.id, 'Rejected')}>
                      Pass
                    </Button>
                    <Button size="sm" onClick={() => handleStatusChange(app.id, 'Interviewing')}>
                      Shortlist
                    </Button>
                  </div>
                ) : app.status === 'Interviewing' ? (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleStatusChange(app.id, 'Rejected')}>
                      Pass
                    </Button>
                    <Button size="sm" onClick={() => handleStatusChange(app.id, 'Hired')}>
                      Place
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-ink-5">No action needed</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}