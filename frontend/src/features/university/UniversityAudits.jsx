import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, ShieldAlert, Search, RefreshCw } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import StatusPill from '../../components/common/StatusPill';
import EmptyState from '../../components/common/EmptyState';
import Input from '../../components/common/Input';
import Skeleton from '../../components/common/Skeleton';
import { roleChip } from '../../config/roleTheme';
import { universityService } from '../../service/universityService';

export default function UniversityAudits() {
  const [audits, setAudits] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const fetchAudits = async () => {
      try {
        const rows = await universityService.getAuditLog();
        setAudits(rows || []);
      } catch (err) {
        setError(err?.response?.data?.message || 'The audit ledger could not be loaded.');
      } finally {
        setLoading(false);
      }
    };
    fetchAudits();
  }, [reloadKey]);

  const retry = () => {
    setLoading(true);
    setError('');
    setReloadKey((key) => key + 1);
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return audits;
    return audits.filter(
      (item) =>
        `${item.studentName} ${item.regNumber} ${item.companyName || ''} ${item.facultySignOff} ${item.firmStatus}`
          .toLowerCase()
          .includes(q)
    );
  }, [audits, searchQuery]);

  const eyebrow = roleChip('university');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-28 animate-pulse rounded-full bg-surface-4" />
          <div className="h-8 w-52 animate-pulse rounded-lg bg-surface-4" />
        </div>
        <Skeleton lines={6} />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <EmptyState
          icon={ShieldAlert}
          title="Could not load the audit ledger"
          description={error}
          action={<Button icon={RefreshCw} onClick={retry}>Try again</Button>}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-line-2 pb-6">
        <p className={eyebrow.classes}>{eyebrow.label}</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Compliance audits</h1>
        <p className="mt-1 text-sm text-ink-4">Complete logbook ledger for your students' attachment records.</p>
      </div>

      <Input
        icon={Search}
        placeholder="Search by student, firm, or status…"
        className="sm:w-80"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <Card title="Audit records" eyebrow={`${filtered.length} total`} bodyClassName="p-0">
        {filtered.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No audit records found"
            description={audits.length === 0 ? 'Logbook entries will appear here once students submit them.' : 'No records match your current search.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line-2 bg-surface-2/60 text-xs font-bold uppercase tracking-wider text-ink-5">
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Firm</th>
                  <th className="px-5 py-3">Week</th>
                  <th className="px-5 py-3">Firm status</th>
                  <th className="px-5 py-3">Faculty status</th>
                  <th className="px-5 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-2">
                {filtered.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-surface-2/60">
                    <td className="px-5 py-4">
                      <p className="font-bold text-ink">{item.studentName}</p>
                      <p className="text-xs text-ink-5">{item.regNumber}</p>
                    </td>
                    <td className="px-5 py-4 text-ink-3">{item.companyName || '—'}</td>
                    <td className="px-5 py-4 font-mono text-xs font-bold text-ink-3">W{item.weekNumber}</td>
                    <td className="px-5 py-4">
                      <StatusPill status={item.firmStatus} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={item.facultySignOff} />
                    </td>
                    <td className="px-5 py-4 text-ink-5">{item.submittedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}