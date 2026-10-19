import { useEffect, useMemo, useState } from 'react';
import { Check, Users, RefreshCw, Search, ShieldAlert, X } from 'lucide-react';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import StatusPill from '../../../components/common/StatusPill';
import EmptyState from '../../../components/common/EmptyState';
import Input from '../../../components/common/Input';
import PageBanner from '../../../components/common/PageBanner';
import Skeleton from '../../../components/common/Skeleton';
import { roleChip } from '../../../config/roleTheme';
import { firmService } from '../../../service/firmService';

// Approved / Hired / Rejected are settled: they need no further decision, and
// approving or placing already closes the posting (firmController Phase 5).
const SETTLED_STATUSES = ['Approved', 'Hired', 'Rejected'];

export default function FirmApplicants() {
  const [searchQuery, setSearchQuery] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState(null);

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

  // Approve / Deny. The row flips immediately, then the server's answer wins —
  // and an approval that auto-closed the posting says so.
  const decide = async (candidate, status) => {
    const previous = candidates;
    setBusyId(candidate.id);
    setSaveError('');
    setNotice('');
    setCandidates((cur) => cur.map((c) => (c.id === candidate.id ? { ...c, status } : c)));
    try {
      const updated = await firmService.updateApplicantStatus(candidate.id, status);
      setCandidates((cur) => cur.map((c) => (c.id === updated.id ? { ...c, status: updated.status } : c)));
      if (updated.postingClosed) {
        setNotice(`${candidate.studentName} approved — the "${updated.role}" posting is now closed.`);
      } else if (status === 'Rejected') {
        setNotice(`${candidate.studentName} was declined. They have been notified.`);
      } else {
        setNotice(`${candidate.studentName} approved. They have been notified.`);
      }
    } catch (err) {
      setCandidates(previous);
      setSaveError(err?.response?.data?.message || 'The application could not be updated.');
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((c) => `${c.studentName} ${c.role} ${c.university}`.toLowerCase().includes(q));
  }, [candidates, searchQuery]);

  const eyebrow = roleChip('firm');

  return (
    <div className="space-y-6">
      <PageBanner role="firm">
        <p className={eyebrow.classes}>{eyebrow.label}</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Applicants</h1>
        <p className="mt-1 text-sm text-ink-4">Review the students who've applied to your openings.</p>
      </PageBanner>

      {/* Outcome of the last approval / rejection */}
      {saveError && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <span>{saveError}</span>
          <button type="button" onClick={() => setSaveError('')} className="font-bold hover:text-rose-900">
            Dismiss
          </button>
        </div>
      )}
      {notice && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} className="font-bold hover:text-emerald-900">
            Dismiss
          </button>
        </div>
      )}

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
              {filtered.map((cand) => {
                const settled = SETTLED_STATUSES.includes(cand.status);
                const busy = busyId === cand.id;
                return (
                  <li
                    key={cand.id}
                    className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-surface-2/70 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-ink">{cand.studentName}</h3>
                      <p className="truncate text-sm text-ink-4">
                        {cand.university} · <span className="font-semibold text-ink-2">{cand.role}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-ink-5">Applied {cand.appliedDate}</p>
                      {cand.status === 'Interviewing' && cand.interviewDate && (
                        <p className="mt-0.5 text-xs font-semibold text-cyan-700">
                          Interview on {cand.interviewDate}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                      <StatusPill status={cand.status} className="shrink-0" />
                      {settled ? (
                        <span className="text-xs text-ink-5">No action needed</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            icon={Check}
                            disabled={busy}
                            onClick={() => decide(cand, 'Approved')}
                          >
                            {busy ? 'Saving…' : 'Approve'}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={X}
                            disabled={busy}
                            onClick={() => decide(cand, 'Rejected')}
                          >
                            Deny
                          </Button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
