import { useState, useEffect } from 'react';
import { MapPin, Clock, ArrowUpRight } from 'lucide-react';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import Skeleton from '../../../components/common/Skeleton';
import EmptyState from '../../../components/common/EmptyState';
import { roleChip } from '../../../config/roleTheme';
import { studentService } from '../../../service/studentService';

// Data source: already wired to the real API — studentService.getPlacements()
export default function StudentMarketplace() {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submittingId, setSubmittingId] = useState(null);

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

  const handleApply = async (placement) => {
    setSubmittingId(placement.id);
    // TODO(real-api): use the authenticated student's id from sessionStore
    // (sessionStore.getProfile()) instead of the hard-coded "std-01".
    const payload = {
      studentId: 'std-01',
      companyName: placement.company,
      role: placement.role,
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'Pending review'
    };
    try {
      await studentService.applyForPlacement(payload);
    } catch (err) {
      console.error('Failed to submit application:', err);
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
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">Attachment marketplace</h1>
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
      <div className="border-b border-slate-100 pb-6">
        <p className={eyebrow.classes}>{eyebrow.label}</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Attachment marketplace
        </h1>
        <p className="mt-1 text-sm text-slate-500">Browse placements from trusted partner firms and apply in a click.</p>
      </div>

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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {placements.map((job) => (
            <article
              key={job.id}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lifted"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-slate-900 group-hover:text-brand-700">
                      {job.role}
                    </h3>
                    <p className="truncate text-sm text-slate-500">{job.company}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    {job.duration || '3 Months'}
                  </span>
                </div>

                <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
                  {job.description || 'Join our engineering teams to design, build, and ship production software.'}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {(job.tags || ['Engineering', 'On-site', 'Mentorship']).map((tag, idx) => (
                    <span key={idx} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                <div className="flex items-center gap-3 text-xs text-slate-500">
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
                <Button
                  size="sm"
                  icon={ArrowUpRight}
                  onClick={() => handleApply(job)}
                  disabled={submittingId === job.id}
                >
                  {submittingId === job.id ? 'Applying…' : 'Apply'}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}