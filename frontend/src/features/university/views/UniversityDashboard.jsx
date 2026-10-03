import { useEffect, useMemo, useState } from 'react';
import { GraduationCap, TrendingUp, Users, ClipboardCheck, Check, ShieldAlert, RefreshCw } from 'lucide-react';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import MetricCard from '../../../components/data-display/MetricCard';
import StatusPill from '../../../components/common/StatusPill';
import EmptyState from '../../../components/common/EmptyState';
import Skeleton, { MetricSkeleton } from '../../../components/common/Skeleton';
import { roleChip } from '../../../config/roleTheme';
import { universityService } from '../../../service/universityService';

const STAGE_COLORS = {
  'Not Started': 'bg-ink-4',
  'Pending Review': 'bg-amber-500',
  Approved: 'bg-emerald-500'
};

export default function UniversityDashboard() {
  const [logbooks, setLogbooks] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [overview, rows] = await Promise.all([
          universityService.getCoordinatorMetrics(),
          universityService.getPendingLogbooks()
        ]);
        setMetrics(overview);
        setLogbooks(rows || []);
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
    setSaveError('');
    setReloadKey((key) => key + 1);
  };

  const approveLogbook = async (id) => {
    setSaveError('');
    try {
      await universityService.signOffLogbook(id, 'Approved');
      setLogbooks((cur) => cur.filter((l) => l.id !== id));
    } catch (err) {
      setSaveError(err?.response?.data?.message || 'The sign-off could not be processed.');
    }
  };

  const summaryMetrics = useMemo(
    () => ({
      totalEnrolled: metrics?.totalEnrolled ?? 0,
      placedInterns: metrics?.placedInterns ?? 0,
      unplacedStudents: metrics?.unplacedStudents ?? 0,
      actionRequiredLogs: metrics?.actionRequiredLogs ?? 0
    }),
    [metrics]
  );

  const reviewBreakdown = useMemo(() => {
    const counts = {};
    logbooks.forEach((log) => {
      counts[log.facultySignOff] = (counts[log.facultySignOff] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({ status, count }));
  }, [logbooks]);

  const eyebrow = roleChip('university');

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
    { title: 'Students enrolled', value: summaryMetrics.totalEnrolled, unit: 'students', icon: GraduationCap, tone: 'brand' },
    { title: 'On placement', value: summaryMetrics.placedInterns, unit: 'placed', icon: TrendingUp, tone: 'success' },
    { title: 'Awaiting placement', value: summaryMetrics.unplacedStudents, unit: 'students', icon: Users, tone: 'neutral' },
    { title: 'Sign-offs pending', value: summaryMetrics.actionRequiredLogs, unit: 'logbooks', icon: ClipboardCheck, tone: 'warning' }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-line-2 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <span className={eyebrow.classes}>{eyebrow.label}</span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Overview</h1>
          <p className="mt-1 text-sm text-ink-4">
            Monitor placements and sign off weekly logbook entries.
          </p>
        </div>
      </div>

      {/* Error banner for failed sign-offs */}
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

      {/* Review queue + breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Sign-offs pending" eyebrow="Awaiting faculty approval" className="lg:col-span-2" bodyClassName="p-2">
          {logbooks.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={ClipboardCheck}
                title="All caught up"
                description="No logbook entries are waiting on your sign-off right now."
              />
            </div>
          ) : (
            <ul className="divide-y divide-line-2">
              {logbooks.map((log) => (
                <li key={log.id} className="flex items-center justify-between gap-4 px-3 py-4 transition-colors hover:bg-surface-2/70">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold text-ink">{log.studentName}</p>
                      <StatusPill status={log.facultySignOff} />
                    </div>
                    <p className="truncate text-sm text-ink-4">
                      {log.regNumber} · <span className="text-ink-2">{log.companyName || '—'}</span> · Week {log.weekNumber}
                    </p>
                  </div>
                  <Button size="sm" icon={Check} onClick={() => approveLogbook(log.id)}>
                    Approve
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Review queue" eyebrow="By stage" bodyClassName="p-5">
          {reviewBreakdown.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="Nothing to review"
              description="Entries that need your attention will appear here."
            />
          ) : (
            <div className="space-y-4">
              {reviewBreakdown.map(({ status, count }) => {
                const percent = Math.round((count / logbooks.length) * 100);
                return (
                  <div key={status} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-ink-2">{status}</span>
                      <span className="font-mono text-xs font-bold text-ink-4">{count} · {percent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${STAGE_COLORS[status] || 'bg-cyan-500'}`}
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
    </div>
  );
}