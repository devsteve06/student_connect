import { useState, useMemo } from 'react';
import { Users, ClipboardList, Award, Target, Download, Plus, Search } from 'lucide-react';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import MetricCard from '../../../components/data-display/MetricCard';
import StatusPill from '../../../components/common/StatusPill';
import EmptyState from '../../../components/common/EmptyState';
import { roleChip } from '../../../config/roleTheme';

// TODO(real-api): replace mock datasets with firmService.getFirmMetrics()
// and firmService.getApplicants(). Status changes should call
// firmService.updateApplicantStatus(). See docs/PROGRESS.md.
export default function FirmDashboard() {
  const [activeTab, setActiveTab] = useState('all'); // all | pending | placed
  const [searchQuery, setSearchQuery] = useState('');

  const [applicants, setApplicants] = useState([
    {
      id: 'app-101',
      candidate: 'Sarah Jenkins',
      role: 'Cloud Architecture Intern',
      institution: 'Stanford University',
      gpa: '3.92',
      matchScore: 98,
      status: 'Pending review',
      appliedDate: '2 hours ago',
      avatar: 'SJ'
    },
    {
      id: 'app-102',
      candidate: 'Alex Rivera',
      role: 'Backend Systems Engineer',
      institution: 'MIT',
      gpa: '3.85',
      matchScore: 94,
      status: 'Placed',
      appliedDate: 'Yesterday',
      avatar: 'AR'
    },
    {
      id: 'app-103',
      candidate: 'Amara Okafor',
      role: 'AI / ML Research Intern',
      institution: 'Carnegie Mellon',
      gpa: '4.00',
      matchScore: 91,
      status: 'Pending review',
      appliedDate: '3 days ago',
      avatar: 'AO'
    }
  ]);

  const incomingFeed = [
    { name: 'Liam Chen', track: 'DevOps & infrastructure', school: 'UC Berkeley', match: 96, time: '14m ago' },
    { name: 'Sofia Rodriguez', track: 'Frontend engineering', school: 'Georgia Tech', match: 89, time: '1h ago' },
    { name: 'Jordan Taylor', track: 'Data platform security', school: 'UT Austin', match: 92, time: '3h ago' }
  ];

  const vacancies = [
    { role: 'Cloud Architecture', filled: 4, total: 5, color: 'bg-brand-500' },
    { role: 'Backend Systems', filled: 2, total: 6, color: 'bg-slate-400' },
    { role: 'AI / ML Research', filled: 3, total: 3, color: 'bg-emerald-500' }
  ];

  const metrics = useMemo(
    () => ({
      total: applicants.length,
      pending: applicants.filter((a) => a.status === 'Pending review').length,
      placed: applicants.filter((a) => a.status === 'Placed').length,
      avgMatch: Math.round(applicants.reduce((acc, a) => acc + a.matchScore, 0) / applicants.length)
    }),
    [applicants]
  );

  const filteredApplicants = useMemo(
    () =>
      applicants.filter((app) => {
        const matchesTab =
          activeTab === 'all' ||
          (activeTab === 'pending' && app.status === 'Pending review') ||
          (activeTab === 'placed' && app.status === 'Placed');
        const matchesSearch =
          app.candidate.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.institution.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
      }),
    [applicants, activeTab, searchQuery]
  );

  const handleStatusChange = (id, newStatus) => {
    setApplicants((prev) => prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app)));
  };

  const tabs = [
    { key: 'all', label: `All (${metrics.total})` },
    { key: 'pending', label: `To review (${metrics.pending})` },
    { key: 'placed', label: `Placed (${metrics.placed})` }
  ];

  const eyebrow = roleChip('firm');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <span className={eyebrow.classes}>{eyebrow.label}</span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Overview</h1>
          <p className="mt-1 text-sm text-slate-500">A live view of your applicants and open placements.</p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-center">
          <Button variant="secondary" icon={Download}>Export roster</Button>
          <Button icon={Plus}>Post opening</Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard title="Total applicants" value={metrics.total} unit="candidates" icon={Users} tone="brand" />
        <MetricCard title="To review" value={metrics.pending} unit="applications" icon={ClipboardList} tone="warning" />
        <MetricCard title="Placed" value={metrics.placed} unit="onboarded" icon={Award} tone="success" />
        <MetricCard title="Average match" value={`${metrics.avgMatch}%`} unit="fit" icon={Target} tone="neutral" />
      </div>

      {/* Incoming + vacancies */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          title="Incoming applications"
          eyebrow="Most recent"
          className="lg:col-span-2"
          bodyClassName="p-2"
        >
          <ul className="divide-y divide-slate-100">
            {incomingFeed.map((incoming, idx) => (
              <li key={idx} className="flex items-center justify-between gap-4 px-3 py-4 transition-colors hover:bg-slate-50/70">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-slate-900">{incoming.name}</p>
                    <span className="text-xs text-slate-400">· {incoming.time}</span>
                  </div>
                  <p className="truncate text-sm text-slate-500">
                    {incoming.school} — <span className="text-slate-700">{incoming.track}</span>
                  </p>
                </div>
                <span className="shrink-0 rounded-lg bg-amber-50 px-2.5 py-1 font-mono text-xs font-bold text-amber-700">
                  {incoming.match}% match
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Open placements" eyebrow="Vacancy capacity" bodyClassName="p-5">
          <div className="space-y-5">
            {vacancies.map((vacancy) => {
              const percent = (vacancy.filled / vacancy.total) * 100;
              const isFull = vacancy.filled === vacancy.total;
              return (
                <div key={vacancy.role} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-800">{vacancy.role}</span>
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {vacancy.filled}/{vacancy.total} filled
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${vacancy.color}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  {isFull && <p className="text-xs font-semibold text-emerald-600">Fully placed</p>}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-3 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 text-sm font-semibold">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                activeTab === tab.key ? 'bg-white text-slate-900 shadow-soft' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by candidate, role, or school…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/10"
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
              className="flex flex-col gap-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft transition-shadow hover:shadow-lifted lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex min-w-0 items-center gap-4 lg:w-72">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 font-mono text-xs font-bold text-brand-700">
                  {app.avatar}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-extrabold text-slate-900">{app.candidate}</h3>
                  <p className="truncate text-xs text-slate-500">
                    {app.institution} · GPA {app.gpa}
                  </p>
                </div>
              </div>

              <div className="min-w-0 lg:w-56">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Applied for</p>
                <p className="truncate text-sm font-semibold text-slate-700">{app.role}</p>
              </div>

              <div className="lg:w-44">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Match</p>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${app.matchScore}%` }} />
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-800">{app.matchScore}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4 lg:justify-end lg:border-t-0 lg:pt-0">
                <StatusPill status={app.status} />
                {app.status === 'Pending review' ? (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleStatusChange(app.id, 'Not selected')}>
                      Pass
                    </Button>
                    <Button size="sm" onClick={() => handleStatusChange(app.id, 'Placed')}>
                      Place
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">Updated {app.appliedDate}</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}