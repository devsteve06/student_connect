import { useEffect, useState } from 'react';
import { Plus, CalendarRange, Pencil, Lock, ShieldAlert, RefreshCw } from 'lucide-react';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Textarea from '../../../components/common/Textarea';
import Modal from '../../../components/common/Modal';
import Card from '../../../components/common/Card';
import StatusPill from '../../../components/common/StatusPill';
import EmptyState from '../../../components/common/EmptyState';
import Skeleton from '../../../components/common/Skeleton';
import { roleChip } from '../../../config/roleTheme';
import { studentService } from '../../../service/studentService';

const DAY_FIELDS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' }
];

const emptyForm = () => ({
  weekNumber: '',
  monday: '',
  tuesday: '',
  wednesday: '',
  thursday: '',
  friday: '',
  weeklyReflection: ''
});

// Student-facing summary of the two sign-off pillars (faculty stamp wins).
function displayStatus(entry) {
  if (entry.facultyStatus === 'Approved') return 'Approved';
  if (entry.firmStatus === 'Approved' || entry.firmStatus === 'Pending Review') return 'Pending review';
  return 'Draft mode';
}

export default function StudentLogbook() {
  const [logbooks, setLogbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm() });

  useEffect(() => {
    let cancelled = false;
    const fetchLogbooks = async () => {
      try {
        const rows = await studentService.getLogbooks();
        if (!cancelled) setLogbooks(rows || []);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || 'Your logbook could not be loaded.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchLogbooks();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Silent refetch after a successful save so the list stays in sync.
  const refreshAfterSave = async () => {
    try {
      const rows = await studentService.getLogbooks();
      setLogbooks(rows || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Your logbook could not be loaded.');
    }
  };

  const retry = () => {
    setLoading(true);
    setError('');
    setSaveError('');
    setReloadKey((key) => key + 1);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm() });
    setSaveError('');
    setIsModalOpen(true);
  };

  const openEdit = (entry) => {
    setEditing(entry);
    setSaveError('');
    setForm({
      weekNumber: String(entry.weekNumber),
      monday: entry.monday || '',
      tuesday: entry.tuesday || '',
      wednesday: entry.wednesday || '',
      thursday: entry.thursday || '',
      friday: entry.friday || '',
      weeklyReflection: entry.weeklyReflection || ''
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError('');
    try {
      await studentService.upsertLogbook({
        weekNumber: Number(form.weekNumber),
        monday: form.monday,
        tuesday: form.tuesday,
        wednesday: form.wednesday,
        thursday: form.thursday,
        friday: form.friday,
        weeklyReflection: form.weeklyReflection
      });
      setIsModalOpen(false);
      await refreshAfterSave();
    } catch (err) {
      setSaveError(err?.response?.data?.message || 'The entry could not be saved.');
    }
  };

  const eyebrow = roleChip('student');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-28 animate-pulse rounded-full bg-surface-4" />
          <div className="h-8 w-52 animate-pulse rounded-lg bg-surface-4" />
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} lines={4} />
          ))}
        </div>
      </div>
    );
  }

  if (error && logbooks.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={ShieldAlert}
          title="Could not load your logbook"
          description={error}
          action={<Button icon={RefreshCw} onClick={retry}>Try again</Button>}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 border-b border-line-2 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={eyebrow.classes}>{eyebrow.label}</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Industrial training logbook
          </h1>
          <p className="mt-1 text-sm text-ink-4">Log weekly activities and competencies for supervisor sign-off.</p>
        </div>
        <Button icon={Plus} onClick={openAdd} className="self-start sm:self-center">
          Add weekly entry
        </Button>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <span>{error}</span>
          <button onClick={() => setError('')} className="font-bold hover:text-rose-900">Dismiss</button>
        </div>
      )}

      {saveError && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <span>{saveError}</span>
          <button onClick={() => setSaveError('')} className="font-bold hover:text-rose-900">Dismiss</button>
        </div>
      )}

      {logbooks.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarRange}
            title="No entries yet"
            description="Add your first weekly milestone to start building your logbook."
            action={<Button icon={Plus} onClick={openAdd}>Add weekly entry</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {logbooks.map((log) => {
            const locked = log.facultyStatus === 'Approved';
            return (
              <article
                key={log.id}
                className="flex flex-col rounded-2xl border border-line/80 bg-surface p-5 shadow-soft"
              >
                <div className="flex items-start justify-between gap-3 border-b border-line-2 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 font-mono text-sm font-bold text-brand-700">
                      W{log.weekNumber}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-ink">Week {log.weekNumber}</h3>
                      <p className="text-xs text-ink-5">
                        {log.companyName ? `${log.companyName} · ` : ''}Submitted {log.submittedAt}
                      </p>
                    </div>
                  </div>
                  <StatusPill status={displayStatus(log)} />
                </div>

                <div className="flex-1 space-y-4 py-4 text-sm">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {DAY_FIELDS.map((day) => (
                      <div key={day.key} className="space-y-0.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-5">{day.label}</p>
                        <p className="leading-relaxed text-ink-3">{log[day.key] || '—'}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-5">Weekly reflection</p>
                    <p className="rounded-xl bg-surface-2 px-4 py-3 font-medium leading-relaxed text-ink">
                      {log.weeklyReflection}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-line-2 pt-4">
                  {locked ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-5">
                      <Lock className="h-3.5 w-3.5" /> Signed off by faculty — locked
                    </span>
                  ) : (
                    <span className="text-xs text-ink-5">Editable until faculty sign-off</span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Pencil}
                    disabled={locked}
                    onClick={() => openEdit(log)}
                  >
                    Edit
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? `Edit week ${editing.weekNumber}` : 'Add weekly entry'}
        subtitle="Log what you worked on each day"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="logbook-form">
              {editing ? 'Save changes' : 'Save entry'}
            </Button>
          </>
        }
      >
        <form id="logbook-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Week number"
            name="weekNumber"
            type="number"
            min="1"
            required
            disabled={Boolean(editing)}
            placeholder="e.g. 3"
            value={form.weekNumber}
            onChange={handleInputChange}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {DAY_FIELDS.map((day) => (
              <Textarea
                key={day.key}
                label={`What did you do on ${day.label}?`}
                name={day.key}
                rows={2}
                placeholder="Describe the tasks you completed…"
                value={form[day.key]}
                onChange={handleInputChange}
              />
            ))}
          </div>

          <Textarea
            label="Weekly reflection"
            name="weeklyReflection"
            rows={4}
            required
            placeholder="Summarise what you learned and notable skills gained this week…"
            value={form.weeklyReflection}
            onChange={handleInputChange}
          />

          {saveError && (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              <span>{saveError}</span>
              <button onClick={() => setSaveError('')} className="font-bold hover:text-rose-900">Dismiss</button>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}