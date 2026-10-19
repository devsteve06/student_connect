import { useState, useEffect } from 'react';
import { MapPin, Clock, ArrowUpRight, Lock, ChevronDown, Check } from 'lucide-react';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import PageBanner from '../../../components/common/PageBanner';
import Skeleton from '../../../components/common/Skeleton';
import EmptyState from '../../../components/common/EmptyState';
import StatusPill from '../../../components/common/StatusPill';
import { roleChip } from '../../../config/roleTheme';
import { studentService } from '../../../service/studentService';

// Roughly how much description fits in the three clamped lines — past this a
// "Read more" toggle earns its place.
const CLAMP_THRESHOLD = 140;

// Data source: already wired to the real API — studentService.getPlacements()
export default function StudentMarketplace() {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submittingId, setSubmittingId] = useState(null);
  const [notice, setNotice] = useState(null);
  // One card open at a time keeps the grid scannable.
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchMarketplace = async () => {
      try {
        const data = await studentService.getPlacements();
        setPlacements(data || []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Could not load placements. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchMarketplace();
  }, []);

  const toggleExpanded = (id) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const handleApply = async (placement) => {
    // Defensive: the button is hidden for closed postings, but the API is the
    // real gate (it answers 409) — this just avoids a pointless round-trip.
    if (placement.status === 'Closed') {
      setNotice({ type: 'error', text: 'This posting has been closed and is no longer accepting applications.' });
      return;
    }
    if (placement.applied) {
      setNotice({ type: 'error', text: `You have already applied for "${placement.role}".` });
      return;
    }
    setSubmittingId(placement.id);
    setNotice(null);
    // No status here: the application always lands as 'Pending Review' and
    // only the firm can move it on, so the server owns that field.
    const payload = {
      companyName: placement.companyName,
      role: placement.role,
      appliedDate: new Date().toISOString().split('T')[0]
    };
    try {
      await studentService.applyForPlacement(payload);
      // Lock the card so it cannot be applied to twice without a reload. Keyed
      // on the firm + role pair, matching how the server flags `applied`.
      setPlacements((prev) =>
        prev.map((p) =>
          p.companyName === placement.companyName && p.role === placement.role ? { ...p, applied: true } : p
        )
      );
      setNotice({ type: 'success', text: `Applied to ${placement.role} at ${placement.companyName || 'the firm'}.` });
    } catch (err) {
      setNotice({ type: 'error', text: err?.response?.data?.message || 'Could not submit your application. Please try again.' });
    } finally {
      setSubmittingId(null);
    }
  };

  const eyebrow = roleChip('student');

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <p className={eyebrow.classes}>{eyebrow.label}</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">Attachment marketplace</h1>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} lines={4} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBanner role="student">
        <p className={eyebrow.classes}>{eyebrow.label}</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          Attachment marketplace
        </h1>
        <p className="mt-1 text-sm text-ink-4">
          Browse placements from trusted partner firms and apply in a click. Tap a role to read the full brief.
        </p>
      </PageBanner>

      {notice && (
        <div
          className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm font-semibold ${
            notice.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} className="font-bold hover:opacity-70">
            Dismiss
          </button>
        </div>
      )}

      {error ? (
        <Card>
          <EmptyState
            title="Something went wrong"
            description={error}
            action={
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Try again
              </Button>
            }
          />
        </Card>
      ) : placements.length === 0 ? (
        <Card>
          <EmptyState
            title="No placements right now"
            description="New placements from partner firms appear here. Check back soon."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
          {placements.map((job) => {
            const isClosed = job.status === 'Closed';
            const isExpanded = expandedId === job.id;
            const description =
              job.description || 'Join our engineering teams to design, build, and ship production software.';
            const canExpand = description.length > CLAMP_THRESHOLD;
            const descriptionId = `placement-description-${job.id}`;

            return (
              <article
                key={job.id}
                className={`group relative flex flex-col justify-between rounded-2xl border bg-surface p-6 shadow-soft transition-all ${
                  isExpanded
                    ? 'border-brand-200 shadow-lifted ring-1 ring-brand-100'
                    : 'border-line/80 hover:-translate-y-0.5 hover:shadow-lifted'
                } ${isClosed ? 'opacity-70' : ''}`}
              >
                <div className="space-y-4">
                  {/* The role (and firm) is the expand toggle. */}
                  <button
                    type="button"
                    onClick={() => toggleExpanded(job.id)}
                    aria-expanded={isExpanded}
                    aria-controls={descriptionId}
                    className="flex w-full items-start justify-between gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-bold text-ink group-hover:text-brand-700">
                          {job.role}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-ink-5 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-ink-4">{job.companyName}</span>
                    </span>
                    {isClosed ? (
                      <StatusPill status="Closed" className="shrink-0" />
                    ) : (
                      <span className="shrink-0 rounded-full bg-surface-3 px-2.5 py-0.5 text-xs font-semibold text-ink-3">
                        {job.duration || '3 Months'}
                      </span>
                    )}
                  </button>

                  <p
                    id={descriptionId}
                    className={`text-sm leading-relaxed text-ink-3 ${
                      isExpanded ? 'whitespace-pre-line' : 'line-clamp-3'
                    }`}
                  >
                    {description}
                  </p>

                  {canExpand && (
                    <button
                      type="button"
                      onClick={() => toggleExpanded(job.id)}
                      className="text-xs font-bold text-brand-700 transition-colors hover:text-brand-800"
                    >
                      {isExpanded ? 'Show less' : 'Read full description'}
                    </button>
                  )}

                  {/* Only real tags are rendered — the API does not send any yet. */}
                  {Array.isArray(job.tags) && job.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {job.tags.map((tag) => (
                        <span key={tag} className="rounded-md bg-surface-3 px-2 py-0.5 text-xs font-semibold text-ink-3">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Slots only matter once the card is open (and it stays
                      relevant for closed postings). */}
                  {isExpanded && (
                    <dl className="grid grid-cols-2 gap-3 rounded-xl bg-surface-2 p-3 text-xs">
                      <div>
                        <dt className="font-semibold uppercase tracking-wider text-ink-5">Slots</dt>
                        <dd className="mt-0.5 font-semibold text-ink-2">
                          {job.slots == null ? '—' : `${job.slots} ${job.slots === 1 ? 'opening' : 'openings'}`}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold uppercase tracking-wider text-ink-5">Duration</dt>
                        <dd className="mt-0.5 font-semibold text-ink-2">{job.duration || '—'}</dd>
                      </div>
                    </dl>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-line-2 pt-5">
                  <div className="flex items-center gap-3 text-xs text-ink-4">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {job.location || 'Nairobi, KE'}
                    </span>
                    {job.posted && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {job.posted}
                      </span>
                    )}
                  </div>
                  {isClosed ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-5">
                      <Lock className="h-3.5 w-3.5" />
                      Closed
                    </span>
                  ) : job.applied ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                      <Check className="h-3.5 w-3.5" />
                      Applied
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      icon={ArrowUpRight}
                      onClick={() => handleApply(job)}
                      disabled={submittingId === job.id}
                    >
                      {submittingId === job.id ? 'Applying…' : 'Apply'}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
