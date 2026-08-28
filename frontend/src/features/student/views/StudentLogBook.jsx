import { useState, useEffect } from 'react';
import { Plus, CalendarRange } from 'lucide-react';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Textarea from '../../../components/common/Textarea';
import Modal from '../../../components/common/Modal';
import Card from '../../../components/common/Card';
import StatusPill from '../../../components/common/StatusPill';
import EmptyState from '../../../components/common/EmptyState';
import Skeleton from '../../../components/common/Skeleton';
import { roleChip } from '../../../config/roleTheme';

// TODO(real-api): replace the mock seed with logbook endpoints on
// studentService (e.g. studentService.getLogbooks() once it exists).
// See docs/PROGRESS.md "Data Source Status".
export default function StudentLogbook() {
  const [logbooks, setLogbooks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const emptyEntry = {
    weekNumber: '',
    startDate: '',
    endDate: '',
    activities: '',
    competencies: '',
    challenges: ''
  };

  const [newEntry, setNewEntry] = useState({ ...emptyEntry });

  useEffect(() => {
    const mockLogbooks = [
      {
        id: 'log-01',
        weekNumber: 1,
        dateRange: 'May 11 – May 15, 2026',
        activities:
          'Completed corporate onboarding and configured local Kubernetes development pods. Moved authentication middleware up to production standards.',
        competencies: 'Docker, container orchestration, IAM policies',
        status: 'Approved',
        supervisorComment: 'Excellent start to the attachment cycle. Code quality met expectations.'
      },
      {
        id: 'log-02',
        weekNumber: 2,
        dateRange: 'May 18 – May 22, 2026',
        activities:
          'Patched critical database pools and built parameterized queries to neutralise injection risks.',
        competencies: 'Database tuning, secure coding, SQL optimisation',
        status: 'Pending review',
        supervisorComment: null
      }
    ];

    const timer = setTimeout(() => {
      setLogbooks(mockLogbooks);
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEntry((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedEntry = {
      id: `log-${Date.now()}`,
      weekNumber: parseInt(newEntry.weekNumber, 10),
      dateRange: `${newEntry.startDate} to ${newEntry.endDate}`,
      activities: newEntry.activities,
      competencies: newEntry.competencies,
      status: 'Pending review',
      supervisorComment: null
    };
    setLogbooks((prev) => [formattedEntry, ...prev]);
    setIsModalOpen(false);
    setNewEntry({ ...emptyEntry });
  };

  const eyebrow = roleChip('student');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-line-2 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={eyebrow.classes}>{eyebrow.label}</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Industrial training logbook
          </h1>
          <p className="mt-1 text-sm text-ink-4">Log weekly activities and competencies for supervisor sign-off.</p>
        </div>
        <Button icon={Plus} onClick={() => setIsModalOpen(true)} className="self-start sm:self-center">
          Add weekly entry
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} lines={4} />
          ))}
        </div>
      ) : logbooks.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarRange}
            title="No entries yet"
            description="Add your first weekly milestone to start building your logbook."
            action={<Button icon={Plus} onClick={() => setIsModalOpen(true)}>Add weekly entry</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {logbooks.map((log) => (
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
                    <p className="text-xs text-ink-5">{log.dateRange}</p>
                  </div>
                </div>
                <StatusPill status={log.status} />
              </div>

              <div className="flex-1 space-y-4 py-4 text-sm">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-5">What I did</p>
                  <p className="leading-relaxed text-ink-3">{log.activities}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-5">Skills gained</p>
                  <p className="font-medium text-ink">{log.competencies}</p>
                </div>
              </div>

              {log.supervisorComment && (
                <div className="rounded-xl bg-surface-2 px-4 py-3 text-sm">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-5">Supervisor note</p>
                  <p className="italic text-ink-3">"{log.supervisorComment}"</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Add entry modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add weekly entry"
        subtitle="Describe what you worked on this week"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="logbook-form">
              Save entry
            </Button>
          </>
        }
      >
        <form id="logbook-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Week number"
              name="weekNumber"
              type="number"
              min="1"
              required
              placeholder="e.g. 3"
              value={newEntry.weekNumber}
              onChange={handleInputChange}
            />
            <Input
              label="Start date"
              name="startDate"
              type="date"
              required
              value={newEntry.startDate}
              onChange={handleInputChange}
            />
            <Input
              label="End date"
              name="endDate"
              type="date"
              required
              value={newEntry.endDate}
              onChange={handleInputChange}
            />
          </div>

          <Textarea
            label="What did you do this week?"
            name="activities"
            rows={4}
            required
            placeholder="Describe the tasks you completed…"
            value={newEntry.activities}
            onChange={handleInputChange}
          />

          <Input
            label="Skills gained (comma separated)"
            name="competencies"
            required
            placeholder="e.g. CI/CD pipelines, GraphQL, unit testing"
            value={newEntry.competencies}
            onChange={handleInputChange}
          />

          <Input
            label="Challenges faced (optional)"
            name="challenges"
            placeholder="e.g. Network latency, missing dependencies"
            value={newEntry.challenges}
            onChange={handleInputChange}
          />
        </form>
      </Modal>
    </div>
  );
}