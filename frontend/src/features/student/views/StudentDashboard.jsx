import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CalendarCheck, Clock, Target, BookOpen, Users, ShieldAlert, RefreshCw } from 'lucide-react';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import PageBanner from '../../../components/common/PageBanner';
import MetricCard from '../../../components/data-display/MetricCard';
import StatusPill from '../../../components/common/StatusPill';
import EmptyState from '../../../components/common/EmptyState';
import NotificationCenter from '../../../components/common/NotificationCenter';
import Skeleton, { MetricSkeleton } from '../../../components/common/Skeleton';
import { roleChip } from '../../../config/roleTheme';
import { studentService } from '../../../service/studentService';
import { cvService } from '../../../service/cvService';

const PIPELINE_COLORS = {
  'Pending Review': 'bg-amber-500',
  'Interviewing': 'bg-cyan-500',
  'Approved': 'bg-emerald-500',
  'Hired': 'bg-emerald-600',
  'Rejected': 'bg-rose-400'
};

export default function StudentDashboard() {
  const [applications, setApplications] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [cvs, setCvs] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [overview, rows, studentCvs] = await Promise.all([
          studentService.getMetrics(),
          studentService.getApplications(),
          cvService.listCvs()
        ]);
        setMetrics(overview);
        setApplications(rows || []);
        setCvs(Array.isArray(studentCvs) ? studentCvs : []);
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

  const summaryMetrics = useMemo(
    () => ({
      totalApplications: metrics?.totalApplications ?? 0,
      interviewsScheduled: metrics?.interviewsScheduled ?? 0,
      pendingReview: metrics?.pendingReview ?? 0,
      profileCompletion: metrics?.profileCompletion ?? '50%'
    }),
    [metrics]
  );

  const pipeline = useMemo(() => {
    const counts = {};
    applications.forEach((app) => {
      counts[app.status] = (counts[app.status] || 0) + 1;
    });
    return ['Pending Review', 'Interviewing', 'Approved', 'Hired', 'Rejected']
      .filter((s) => counts[s])
      .map((s) => ({ status: s, count: counts[s] }));
  }, [applications]);

  const eyebrow = roleChip('student');

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
    { title: 'Active applications', value: summaryMetrics.totalApplications, unit: 'placements', icon: FileText, tone: 'brand' },
    { title: 'Interviews scheduled', value: summaryMetrics.interviewsScheduled, unit: 'scheduled', icon: CalendarCheck, tone: 'warning' },
    { title: 'Pending review', value: summaryMetrics.pendingReview, unit: 'applications', icon: Clock, tone: 'neutral' },
    { title: 'Profile completed', value: summaryMetrics.profileCompletion, unit: '', icon: Target, tone: 'success' }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageBanner role="student">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span className={eyebrow.classes}>{eyebrow.label}</span>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Overview</h1>
            <p className="mt-1 text-sm text-ink-4">
              Track your applications and profile at a glance.
            </p>
          </div>
        </div>
      </PageBanner>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {metricCards.map((card) => (
          <MetricCard key={card.title} {...card} />
        ))}
      </div>

      {/* Dashboard notification counter (the spec's "increments the
          notification counter on the students dashboard") */}
      <NotificationCenter
        role="student"
        emptyHint="New postings from firms at your university and updates on your applications will appear here."
      />

      {/* Applications + pipeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Applications" eyebrow="Placement applications" className="lg:col-span-2" bodyClassName="p-2">
          {applications.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={Users}
                title="No applications yet"
                description="Browse the marketplace to find a placement that fits you."
              />
            </div>
          ) : (
            <ul className="divide-y divide-line-2">
              {applications.map((app) => (
                <li key={app.id} className="flex items-center justify-between gap-4 px-3 py-4 transition-colors hover:bg-surface-2/70">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold text-ink">{app.role}</p>
                      <StatusPill status={app.status} />
                    </div>
                    <p className="truncate text-sm text-ink-4">
                      <span className="font-semibold text-ink-2">{app.companyName}</span>
                      <span className="mx-1.5 text-ink-5">·</span>
                      {app.appliedDate}
                    </p>
                  </div>
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
              description="Once you apply, your application stage appears here."
            />
          ) : (
            <div className="space-y-4">
              {pipeline.map(({ status, count }) => {
                const percent = Math.round((count / applications.length) * 100);
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

      {/* Logbook */}
      <Card
        title="Logbook"
        eyebrow="Weekly attachment entries"
        action={
          <Link to="/students/logbook" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
            Open logbook
          </Link>
        }
        bodyClassName="p-5"
      >
        <EmptyState
          icon={BookOpen}
          title="No logbook entries yet"
          description="Submit weekly entries from the logbook — they'll appear here for review."
        />
      </Card>

      {/* CV Builder */}
      <Card
        title="CV Builder"
        eyebrow="Create, preview, and analyze your CV"
        action={
          <Link
            to="/students/cv-builder"
            className="text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            Build CV
          </Link>
        }
        bodyClassName="p-5"
      >
        <div className="space-y-3">
          {cvs.length > 0 ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-2">Primary CV: {cvs.find((c) => c.isPrimary)?.title ?? cvs[0]?.title ?? 'Untitled'}</span>
                <Link
                  to={`/students/cv/${cvs.find((c) => c.isPrimary)?.id ?? cvs[0]?.id}/view`}
                  className="text-brand-700 hover:text-brand-800 text-xs font-semibold"
                >
                  View CV
                </Link>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-2">Score your CV against a job description</span>
                <Link
                  to="/students/cv-analyzer"
                  className="text-brand-700 hover:text-brand-800 text-xs font-semibold"
                >
                  Analyze CV
                </Link>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-ink-4">
                You haven't created a CV yet. Build one from your profile and get an ATS score against any job.
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-2">Create your first CV</span>
                <Link
                  to="/students/cv-builder"
                  className="text-brand-700 hover:text-brand-800 text-xs font-semibold"
                >
                  Build CV
                </Link>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}