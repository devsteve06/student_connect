// features/firm/views/FirmPostings.jsx
// The firm's job postings (JOB_POSTING_PLAN.md Phase 3): publish, edit and
// manually close placements. Applicants count is live; closed postings are
// frozen (the API answers 409 on edit, and students can no longer apply).
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Briefcase,
  Clock,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Users,
  XCircle
} from 'lucide-react';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import Modal from '../../../components/common/Modal';
import EmptyState from '../../../components/common/EmptyState';
import PageBanner from '../../../components/common/PageBanner';
import Skeleton from '../../../components/common/Skeleton';
import StatusPill from '../../../components/common/StatusPill';
import Textarea from '../../../components/common/Textarea';
import { roleChip } from '../../../config/roleTheme';
import { firmService } from '../../../service/firmService';

const EMPTY_FORM = { role: '', location: '', duration: '', slots: '1', description: '' };

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
};

export default function FirmPostings() {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Create/edit dialog. The dashboard's "New posting" quick action navigates
  // here with { state: { openCreate: true } } — seeding the initial state
  // opens the dialog on mount without an effect, and a plain reload (which
  // drops router state) simply lands on the normal page.
  const location = useLocation();
  const [formOpen, setFormOpen] = useState(() => Boolean(location.state?.openCreate));
  const [editing, setEditing] = useState(null); // null = create mode
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Close-confirmation dialog
  const [closing, setClosing] = useState(null);

  useEffect(() => {
    const fetchPlacements = async () => {
      try {
        setPlacements(await firmService.listPlacements());
      } catch (err) {
        setError(err?.response?.data?.message || 'Your postings could not be loaded.');
      } finally {
        setLoading(false);
      }
    };
    fetchPlacements();
  }, [reloadKey]);

  const retry = () => {
    setLoading(true);
    setError('');
    setReloadKey((key) => key + 1);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setSaveError('');
    setFormOpen(true);
  };

  const openEdit = (placement) => {
    setEditing(placement);
    setForm({
      role: placement.role,
      location: placement.location,
      duration: placement.duration,
      slots: String(placement.slots),
      description: placement.description
    });
    setFormErrors({});
    setSaveError('');
    setFormOpen(true);
  };

  const setField = (field) => (event) => {
    setForm((cur) => ({ ...cur, [field]: event.target.value }));
    setFormErrors((cur) => ({ ...cur, [field]: undefined }));
  };

  const validate = () => {
    const errors = {};
    for (const field of ['role', 'location', 'duration', 'description']) {
      if (!form[field].trim()) errors[field] = 'This field is required.';
    }
    const slots = Number(form.slots);
    if (!Number.isInteger(slots) || slots < 1) {
      errors.slots = 'Slots must be a whole number of at least 1.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submitForm = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      role: form.role.trim(),
      location: form.location.trim(),
      duration: form.duration.trim(),
      slots: Number(form.slots),
      description: form.description.trim()
    };

    setSubmitting(true);
    setSaveError('');
    try {
      if (editing) {
        await firmService.updatePlacement(editing.id, payload);
        setNotice(`"${payload.role}" updated.`);
      } else {
        await firmService.createPlacement(payload);
        setNotice(`"${payload.role}" is now live in the marketplace.`);
      }
      setFormOpen(false);
      setReloadKey((key) => key + 1);
    } catch (err) {
      setSaveError(err?.response?.data?.message || 'The posting could not be saved.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmClose = async () => {
    if (!closing) return;
    setSubmitting(true);
    setSaveError('');
    try {
      await firmService.closePlacement(closing.id);
      setNotice(`"${closing.role}" is closed — no further applications.`);
      setClosing(null);
      setReloadKey((key) => key + 1);
    } catch (err) {
      setSaveError(err?.response?.data?.message || 'The posting could not be closed.');
      setClosing(null);
    } finally {
      setSubmitting(false);
    }
  };

  // Reopening a closed posting puts it back in the marketplace: students at the
  // firm's university are notified, and editing/close become available again.
  const handleReopen = async (placement) => {
    setSubmitting(true);
    setSaveError('');
    try {
      await firmService.reopenPlacement(placement.id);
      setNotice(`"${placement.role}" is open again — students can apply.`);
      setReloadKey((key) => key + 1);
    } catch (err) {
      setSaveError(err?.response?.data?.message || 'The posting could not be reopened.');
    } finally {
      setSubmitting(false);
    }
  };

  const eyebrow = roleChip('firm');

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="h-4 w-28 animate-pulse rounded-full bg-surface-4" />
          <div className="h-8 w-52 animate-pulse rounded-lg bg-surface-4" />
        </div>
        <Skeleton lines={4} />
        <Skeleton lines={4} />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <EmptyState
          icon={ShieldAlert}
          title="Could not load your postings"
          description={error}
          action={<Button icon={RefreshCw} onClick={retry}>Try again</Button>}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageBanner role="firm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span className={eyebrow.classes}>{eyebrow.label}</span>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Postings</h1>
            <p className="mt-1 text-sm text-ink-4">
              Publish internship openings, track applicants, and close a posting once a candidate is approved.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-center">
            <Button icon={Plus} onClick={openCreate}>New posting</Button>
          </div>
        </div>
      </PageBanner>

      {/* Error banner for failed actions */}
      {saveError && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <span>{saveError}</span>
          <button onClick={() => setSaveError('')} className="font-bold hover:text-rose-900">Dismiss</button>
        </div>
      )}

      {/* Success notice */}
      {notice && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} className="font-bold hover:text-emerald-900">Dismiss</button>
        </div>
      )}

      {/* Postings */}
      {placements.length === 0 ? (
        <Card>
          <EmptyState
            icon={Briefcase}
            title="No postings yet"
            description="Publish your first opening and students at your partner university will be notified."
            action={<Button icon={Plus} onClick={openCreate}>New posting</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {placements.map((placement) => (
            <article
              key={placement.id}
              className="flex flex-col gap-5 rounded-2xl border border-line/80 bg-surface p-5 shadow-soft transition-shadow hover:shadow-lifted lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0 lg:w-72">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-extrabold text-ink">{placement.role}</h3>
                  <StatusPill status={placement.status} className="shrink-0" />
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-4">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{placement.location}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{placement.duration}</span>
                  <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{placement.slots} slot{placement.slots === 1 ? '' : 's'}</span>
                </p>
              </div>

              <div className="min-w-0 lg:w-64">
                <p className="line-clamp-2 text-sm text-ink-4">{placement.description}</p>
              </div>

              <div className="min-w-0 lg:w-40">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-5">Applicants</p>
                <p className="truncate text-sm font-semibold text-ink-2">
                  {placement.applicantCount} student{placement.applicantCount === 1 ? '' : 's'}
                </p>
                {placement.status === 'Closed' && placement.closedAt && (
                  <p className="mt-0.5 truncate text-xs text-ink-5">Closed {formatDate(placement.closedAt)}</p>
                )}
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-line-2 pt-4 lg:justify-end lg:border-t-0 lg:pt-0">
                {placement.status === 'Open' ? (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" icon={Pencil} onClick={() => openEdit(placement)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" icon={XCircle} onClick={() => setClosing(placement)}>
                      Close posting
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs text-ink-5">Closed — no longer accepting applications</span>
                    <Button
                      size="sm"
                      icon={RotateCcw}
                      disabled={submitting}
                      onClick={() => handleReopen(placement)}
                    >
                      Reopen posting
                    </Button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Create / edit dialog */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit posting' : 'New posting'}
        subtitle={editing ? 'Closed postings can no longer be edited.' : 'It goes live in the marketplace immediately.'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={submitForm} disabled={submitting}>
              {submitting ? 'Saving…' : editing ? 'Save changes' : 'Publish posting'}
            </Button>
          </>
        }
      >
        <form onSubmit={submitForm} className="space-y-4">
          <Input
            label="Role"
            placeholder="e.g. Data Analyst Intern"
            value={form.role}
            onChange={setField('role')}
            error={formErrors.role}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Location"
              placeholder="Nairobi, KE (Hybrid)"
              value={form.location}
              onChange={setField('location')}
              error={formErrors.location}
            />
            <Input
              label="Duration"
              placeholder="3 Months"
              value={form.duration}
              onChange={setField('duration')}
              error={formErrors.duration}
            />
            <Input
              label="Slots"
              type="number"
              min={1}
              value={form.slots}
              onChange={setField('slots')}
              error={formErrors.slots}
            />
          </div>
          <Textarea
            label="Description"
            rows={5}
            placeholder="What will the intern do? What skills are required?"
            value={form.description}
            onChange={setField('description')}
            error={formErrors.description}
          />
          {/* Enter-to-submit guard: the footer carries the visible action. */}
          <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
        </form>
      </Modal>

      {/* Close confirmation dialog */}
      <Modal
        isOpen={Boolean(closing)}
        onClose={() => setClosing(null)}
        title="Close this posting?"
        subtitle="You can reopen it at any time."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setClosing(null)} disabled={submitting}>
              Keep it open
            </Button>
            <Button variant="danger" onClick={confirmClose} disabled={submitting}>
              {submitting ? 'Closing…' : 'Close posting'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-3">
          <span className="font-bold text-ink">{closing?.role}</span> will stop accepting applications, and students
          will see it as closed in the marketplace. Reopen it later from the Postings page if you change your mind.
        </p>
      </Modal>
    </div>
  );
}
