import { useEffect, useMemo, useState } from 'react';
import { Users, RefreshCw, Search, ShieldAlert } from 'lucide-react';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import StatusPill from '../../../components/common/StatusPill';
import EmptyState from '../../../components/common/EmptyState';
import Input from '../../../components/common/Input';
import Skeleton from '../../../components/common/Skeleton';
import { roleChip } from '../../../config/roleTheme';
import { firmService } from '../../../service/firmService';

export default function FirmApplicants() {
  const [searchQuery, setSearchQuery] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const rows = await firmService.getApplicants();
        setCandidates(rows);
      } catch (err) {
        setError(err?.response?.data?.message || 'The applicant list could not be loaded.');
      } finally {
        setLoading(false);
      }
    };
    fetchApplicants();
  }, [reloadKey]);

  const retry = () => {
    setLoading(true);
    setError('');
    setReloadKey((key) => key + 1);
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((c) => `${c.studentName} ${c.role} ${c.university}`.toLowerCase().includes(q));
  }, [candidates, searchQuery]);

  const eyebrow = roleChip('firm');

  return (
    <div className="space-y-6">
      <div className="border-b border-line-2 pb-6">
        <p className={eyebrow.classes}>{eyebrow.label}</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Applicants</h1>
        <p className="mt-1 text-sm text-ink-4">Review the students who've applied to your openings.</p>
      </div>

      <Input
        icon={Search}
        placeholder="Search by name, role, or university…"
        className="sm:w-80"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {error ? (
        <Card>
          <EmptyState
            icon={ShieldAlert}
            title="Could not load applicants"
            description={error}
            action={<Button icon={RefreshCw} onClick={retry}>Try again</Button>}
          />
        </Card>
      ) : (
        <Card title="All applicants" eyebrow={`${filtered.length} total`} bodyClassName="p-2">
          {loading ? (
            <div className="space-y-4 p-4">
              <Skeleton lines={3} />
              <Skeleton lines={3} />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No applicants found"
              description={
                searchQuery ? 'No applicants match your search.' : 'Applications will appear here as students apply to your openings.'
              }
            />
          ) : (
            <ul className="divide-y divide-line-2">
              {filtered.map((cand) => (
                <li
                  key={cand.id}
                  className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-surface-2/70 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-ink">{cand.studentName}</h3>
                    <p className="truncate text-sm text-ink-4">
                      {cand.university} · <span className="font-semibold text-ink-2">Applied {cand.appliedDate}</span>
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-6 sm:justify-end">
                    <p className="text-sm font-semibold text-ink-2">{cand.role}</p>
                    <StatusPill status={cand.status} className="shrink-0" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}