import { useState, useMemo } from 'react';
import { FileText, BookOpen, Target, CalendarCheck, Download, Search } from 'lucide-react';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import MetricCard from '../../../components/data-display/MetricCard';
import StatusPill from '../../../components/common/StatusPill';
import EmptyState from '../../../components/common/EmptyState';
import { roleChip } from '../../../config/roleTheme';

// TODO(real-api): replace mock datasets with studentService.getApplications()
// and studentService.getMetrics(). See docs/PROGRESS.md "Data Source Status".
export default function StudentDashboard() {
  const [selectedTerm, setSelectedTerm] = useState('May-Aug 2026');

  const placementApplications = useMemo(
    () => [
      { id: 'app-01', firm: 'Apex Cloud Labs', role: 'Cloud Architecture Intern', status: 'Interviewing', date: 'Applied 4 days ago', match: 98 },
      { id: 'app-02', firm: 'Quantum Systems', role: 'Backend Systems Engineer', status: 'Under review', date: 'Applied 1 week ago', match: 94 },
      { id: 'app-03', firm: 'Neural Corp AI', role: 'AI / ML Research Intern', status: 'Offer received', date: 'Updated 2 hours ago', match: 91 }
    ],
    []
  );

  const recentLogs = useMemo(
    () => [
      { week: 2, range: 'May 18 – May 22', status: 'Pending review', activities: 'Patched critical database pools and optimised standard query payloads.' },
      { week: 1, range: 'May 11 – May 15', status: 'Approved', activities: 'Completed corporate onboarding and configured local Kubernetes development pods.' }
    ],
    []
  );

  const summaryMetrics = useMemo(
    () => ({
      activeApplications: placementApplications.length,
      loggedWeeks: recentLogs.length,
      targetWeeks: 12,
      highestMatch: Math.max(...placementApplications.map((a) => a.match)),
      completionPercentage: Math.round((recentLogs.filter((l) => l.status === 'Approved').length / 12) * 100)
    }),
    [placementApplications, recentLogs]
  );

  const skills = [
    { framework: 'Containerization (Docker)', items: 3, goal: 4 },
    { framework: 'CI/CD pipelines', items: 1, goal: 3 },
    { framework: 'Database optimisation', items: 2, goal: 2 }
  ];

  const eyebrow = roleChip('student');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-line-2 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <span className={eyebrow.classes}>{eyebrow.label}</span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Overview
          </h1>
          <p className="mt-1 text-sm text-ink-4">
            Track your applications and logbook at a glance.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-center">
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="h-10 rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink-2 shadow-soft focus:border-brand-500 focus:outline-none"
          >
            <option value="May-Aug 2026">May – Aug 2026</option>
            <option value="Jan-Apr 2026">Jan – Apr 2026</option>
          </select>
          <Button variant="secondary" size="md" icon={Download}>Export</Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard title="Active applications" value={summaryMetrics.activeApplications} unit="placements" icon={FileText} tone="brand" />
        <MetricCard
          title="Logbook progress"
          value={`${summaryMetrics.loggedWeeks}/${summaryMetrics.targetWeeks}`}
          unit="weeks"
          icon={BookOpen}
          tone="info"
          change={`${summaryMetrics.completionPercentage}% completed`}
        />
        <MetricCard title="Top match" value={`${summaryMetrics.highestMatch}%`} unit="fit" icon={Target} tone="warning" />
        <MetricCard title="Hours validated" value={`${summaryMetrics.completionPercentage}%`} unit="verified" icon={CalendarCheck} tone="success" />
      </div>

      {/* Applications + skills */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          title="Applications"
          eyebrow="Placement applications"
          className="lg:col-span-2"
          bodyClassName="p-2"
        >
          {placementApplications.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No applications yet"
              description="Browse the marketplace to find a placement that fits you."
            />
          ) : (
            <ul className="divide-y divide-line-2">
              {placementApplications.map((app) => (
                <li key={app.id} className="flex items-center justify-between gap-4 px-3 py-4 transition-colors hover:bg-surface-2/70">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold text-ink">{app.role}</p>
                      <StatusPill status={app.status} />
                    </div>
                    <p className="truncate text-sm text-ink-4">
                      <span className="font-semibold text-ink-2">{app.firm}</span>
                      <span className="mx-1.5 text-slate-300">·</span>
                      {app.date}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-brand-50 px-2.5 py-1 font-mono text-xs font-bold text-brand-700">
                    {app.match}% match
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Skills in progress" eyebrow="Your growth track">
          <div className="space-y-5">
            {skills.map((skill) => {
              const percentage = (skill.items / skill.goal) * 100;
              const met = skill.items === skill.goal;
              return (
                <div key={skill.framework} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink">{skill.framework}</span>
                    <span className="font-mono text-xs font-bold text-ink-4">
                      {skill.items}/{skill.goal}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${met ? 'bg-emerald-500' : 'bg-brand-500'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Recent logbook entries */}
      <Card
        title="Recent logbook entries"
        eyebrow="Submitted recently"
        action={
          <a href="/student/logbook" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
            Open logbook
          </a>
        }
        bodyClassName="p-2"
      >
        <ul className="divide-y divide-line-2">
          {recentLogs.map((log) => (
            <li key={log.week} className="flex items-center justify-between gap-4 px-3 py-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-3 font-mono text-xs font-bold text-ink-3">
                  W{log.week}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{log.range}</p>
                  <p className="truncate text-sm text-ink-4">{log.activities}</p>
                </div>
              </div>
              <StatusPill status={log.status} className="shrink-0" />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}