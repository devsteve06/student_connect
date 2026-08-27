import { useState } from 'react';
import { Users, Search } from 'lucide-react';
import Card from '../../../components/common/Card';
import StatusPill from '../../../components/common/StatusPill';
import EmptyState from '../../../components/common/EmptyState';
import { roleChip } from '../../../config/roleTheme';

// TODO(real-api): replace mock dataset with firmService.getApplicants()
// See docs/PROGRESS.md "Data Source Status".
export default function FirmApplicants() {
  const [searchQuery, setSearchQuery] = useState('');
  const [candidates] = useState([
    { id: 'app-501', name: 'Sarah Jenkins', role: 'Cloud Architecture Intern', school: 'Stanford University', match: '98%', status: 'Awaiting screening' },
    { id: 'app-502', name: 'Amara Okafor', role: 'AI / ML Research Intern', school: 'Carnegie Mellon', match: '91%', status: 'Interview scheduled' }
  ]);

  const filtered = candidates.filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return `${c.name} ${c.role} ${c.school}`.toLowerCase().includes(q);
  });

  const eyebrow = roleChip('firm');

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 pb-6">
        <p className={eyebrow.classes}>{eyebrow.label}</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Applicants</h1>
        <p className="mt-1 text-sm text-slate-500">Review the students who've applied to your openings.</p>
      </div>

      <div className="relative w-full sm:w-80">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, role, or school…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/10"
        />
      </div>

      <Card title="All applicants" eyebrow={`${filtered.length} total`} bodyClassName="p-2">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No applicants found"
            description="No applicants match your search."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((cand) => (
              <li key={cand.id} className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900">{cand.name}</h3>
                  <p className="truncate text-sm text-slate-500">
                    {cand.school} · <span className="font-semibold text-amber-700">{cand.match} match</span>
                  </p>
                </div>
                <div className="flex items-center justify-between gap-6 sm:justify-end">
                  <p className="text-sm font-semibold text-slate-700">{cand.role}</p>
                  <StatusPill status={cand.status} className="shrink-0" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}