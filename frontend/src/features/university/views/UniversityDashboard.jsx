import { useState, useMemo } from 'react';
import { GraduationCap, TrendingUp, ClipboardCheck, Star, Download, Search, ExternalLink } from 'lucide-react';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import MetricCard from '../../../components/data-display/MetricCard';
import StatusPill from '../../../components/common/StatusPill';
import EmptyState from '../../../components/common/EmptyState';
import { roleChip } from '../../../config/roleTheme';

// TODO(real-api): replace mock datasets with universityService.getCoordinatorMetrics()
// and universityService.getPendingLogbooks(). See docs/PROGRESS.md.
export default function UniversityDashboard() {
  const [selectedCohort, setSelectedCohort] = useState('2026');
  const [searchQuery, setSearchQuery] = useState('');

  const [students] = useState([
    { id: 'stu-801', name: 'Sarah Jenkins', major: 'Computer Science', firm: 'Apex Cloud Labs', status: 'Approved', auditScore: 98, progress: 85 },
    { id: 'stu-802', name: 'Alex Rivera', major: 'Electrical Engineering', firm: 'Quantum Systems', status: 'Pending verification', auditScore: 92, progress: 40 },
    { id: 'stu-803', name: 'Amara Okafor', major: 'Data Science', firm: 'Neural Corp AI', status: 'Approved', auditScore: 96, progress: 100 },
    { id: 'stu-804', name: 'Liam Chen', major: 'Software Engineering', firm: 'Awaiting match', status: 'Unassigned', auditScore: 0, progress: 0 }
  ]);

  const stats = useMemo(() => {
    const assigned = students.filter((s) => s.status !== 'Unassigned').length;
    return {
      totalCount: students.length,
      placementRate: Math.round((assigned / students.length) * 100),
      pendingAudits: students.filter((s) => s.status === 'Pending verification').length,
      avgAudit: Math.round(students.reduce((acc, s) => acc + s.auditScore, 0) / assigned || 0)
    };
  }, [students]);

  const filteredStudents = useMemo(
    () =>
      students.filter((student) =>
        `${student.name} ${student.major} ${student.firm}`.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [students, searchQuery]
  );

  const majors = [
    { name: 'Computer Science', assigned: 24, total: 30, color: 'bg-cyan-500' },
    { name: 'Data Science', assigned: 12, total: 15, color: 'bg-brand-500' },
    { name: 'Electrical Engineering', assigned: 8, total: 20, color: 'bg-amber-500' }
  ];

  const eyebrow = roleChip('university');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-line-2 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <span className={eyebrow.classes}>{eyebrow.label}</span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Overview</h1>
          <p className="mt-1 text-sm text-ink-4">Monitor attachments, placements, and audit sign-offs.</p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-center">
          <select
            value={selectedCohort}
            onChange={(e) => setSelectedCohort(e.target.value)}
            className="h-10 rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink-2 shadow-soft focus:border-cyan-500 focus:outline-none"
          >
            <option value="2026">Cohort 2026</option>
            <option value="2025">Cohort 2025</option>
          </select>
          <Button variant="secondary" icon={Download}>Export ledger</Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard title="Students on placement" value={stats.totalCount} unit="students" icon={GraduationCap} tone="brand" />
        <MetricCard title="Placement rate" value={`${stats.placementRate}%`} unit="matched" icon={TrendingUp} tone="info" />
        <MetricCard title="Pending sign-offs" value={stats.pendingAudits} unit="audits" icon={ClipboardCheck} tone="warning" />
        <MetricCard title="Average quality score" value={stats.avgAudit} unit="/100" icon={Star} tone="success" />
      </div>

      {/* Audit queue + majors */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          title="Pending audits"
          eyebrow="Needs attention"
          className="lg:col-span-2"
          bodyClassName="p-2"
        >
          <ul className="divide-y divide-line-2">
            {students
              .filter((s) => s.status !== 'Unassigned')
              .map((student) => (
                <li key={student.id} className="flex items-center justify-between gap-4 px-3 py-4 transition-colors hover:bg-surface-2/70">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold text-ink">{student.name}</p>
                      <StatusPill status={student.status} />
                    </div>
                    <p className="truncate text-sm text-ink-4">
                      {student.major} — <span className="text-ink-2">{student.firm}</span>
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs font-bold text-ink-3">
                    {student.auditScore}/100
                  </span>
                </li>
              ))}
          </ul>
        </Card>

        <Card title="Placements by major" eyebrow="Allocation across tracks" bodyClassName="p-5">
          <div className="space-y-5">
            {majors.map((major) => {
              const percent = (major.assigned / major.total) * 100;
              return (
                <div key={major.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink">{major.name}</span>
                    <span className="font-mono text-xs font-bold text-ink-4">
                      {major.assigned}/{major.total}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${major.color}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-4">
          <span className="font-semibold text-ink-2">{filteredStudents.length}</span> students match your search
        </p>
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student, track, or company…"
            className="w-full rounded-xl border border-line bg-surface py-2 pl-10 pr-3 text-sm text-ink placeholder:text-ink-5 focus:border-cyan-500 focus:outline-none focus:ring-4 focus:ring-cyan-500/10"
          />
        </div>
      </div>

      {/* Student registry */}
      {filteredStudents.length === 0 ? (
        <Card>
          <EmptyState
            icon={GraduationCap}
            title="No students found"
            description="No students match your current search."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredStudents.map((student) => (
            <article
              key={student.id}
              className="flex flex-col gap-5 rounded-2xl border border-line/80 bg-surface p-5 shadow-soft transition-shadow hover:shadow-lifted lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex min-w-0 items-center gap-4 lg:w-64">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-xs font-bold text-cyan-700">
                  {student.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-extrabold text-ink">{student.name}</h3>
                  <p className="truncate text-xs text-ink-4">{student.major}</p>
                </div>
              </div>

              <div className="min-w-0 lg:w-52">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-5">Placed at</p>
                <p className="truncate text-sm font-semibold text-ink-2">{student.firm}</p>
              </div>

              <div className="lg:w-48">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-5">Progress</p>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-3">
                    <div className="h-full rounded-full bg-cyan-500" style={{ width: `${student.progress}%` }} />
                  </div>
                  <span className="font-mono text-xs font-bold text-ink">{student.progress}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-line-2 pt-4 lg:border-t-0 lg:pt-0">
                <StatusPill status={student.status} />
                <Button size="sm" variant="secondary" icon={ExternalLink}>
                  Review log
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}