// components/common/NotificationCenter.jsx
// The dashboard-side counter (JOB_POSTING_PLAN.md Phase 6). The Navbar bell
// already carries a live badge; this puts the same unread number — and the
// first few notifications — directly on the Student and Firm dashboards, so
// "publishing a posting increments the counter on the students dashboard" is
// visible where the work happens, not only in the header. Students and firms
// are the only roles with a backend feed; other roles should not render it.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Inbox, RefreshCw, ShieldAlert } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import EmptyState from './EmptyState';
import Skeleton from './Skeleton';
import { notificationService } from '../../service/notificationService';

// Mirrors NotificationBell: there is no realtime channel in this repo, so the
// badge falls back to polling and refreshes on navigation.
const POLL_MS = 60_000;
const PREVIEW_LIMIT = 5;

const formatWhen = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function NotificationCenter({
  role,
  title = 'Notifications',
  eyebrow = 'Dashboard counter',
  emptyHint = 'New postings and application updates will show up here.',
  className = ''
}) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // One loader drives first paint and the 60s refresh; a failed poll keeps the
  // last good snapshot instead of blanking the widget.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [feed, unread] = await Promise.all([
          notificationService.list(role),
          notificationService.unreadCount(role)
        ]);
        if (cancelled) return;
        setItems(Array.isArray(feed) ? feed : []);
        setCount(unread?.count ?? 0);
        setError('');
      } catch (err) {
        if (cancelled) return;
        setError((current) => current || err?.response?.data?.message || 'Notifications could not be loaded.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [role, reloadKey]);

  const retry = () => {
    setLoading(true);
    setError('');
    setReloadKey((key) => key + 1);
  };

  const handleOpen = async (item) => {
    if (!item.isRead) {
      try {
        await notificationService.markRead(role, item.id);
        setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
        setCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Keep the row unread; the next poll resyncs the counter.
        return;
      }
    }
    if (item.link) navigate(item.link);
  };

  const handleMarkAll = async () => {
    setBusy(true);
    try {
      await notificationService.markAllRead(role);
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setCount(0);
    } catch {
      // Counter stays as-is; the user can retry.
    } finally {
      setBusy(false);
    }
  };

  const preview = items.slice(0, PREVIEW_LIMIT);

  return (
    <Card
      title={title}
      eyebrow={eyebrow}
      className={className}
      bodyClassName="p-2"
      action={
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
              count > 0 ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-100' : 'bg-surface-3 text-ink-4 ring-1 ring-line'
            }`}
            aria-label={count > 0 ? `${count} unread notifications` : 'No unread notifications'}
          >
            <Bell className="h-3.5 w-3.5" />
            {count > 99 ? '99+' : count} unread
          </span>
          {count > 0 && (
            <button
              onClick={handleMarkAll}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50 disabled:opacity-60"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {busy ? 'Marking…' : 'Mark all read'}
            </button>
          )}
        </div>
      }
    >
      {loading ? (
        <div className="space-y-3 p-4">
          <Skeleton lines={3} />
        </div>
      ) : error ? (
        <EmptyState
          icon={ShieldAlert}
          title="Notifications unavailable"
          description={error}
          action={<Button size="sm" icon={RefreshCw} onClick={retry}>Try again</Button>}
        />
      ) : items.length === 0 ? (
        <EmptyState icon={Inbox} title="You're all caught up" description={emptyHint} />
      ) : (
        <>
          <ul className="divide-y divide-line-2">
            {preview.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleOpen(item)}
                  className={`flex w-full items-start gap-2.5 px-3 py-3 text-left transition-colors hover:bg-surface-2/70 ${
                    item.isRead ? 'opacity-70' : ''
                  }`}
                >
                  {!item.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" />}
                  <span className={item.isRead ? 'min-w-0 pl-4' : 'min-w-0'}>
                    <span className="block truncate text-sm font-semibold text-ink">{item.title}</span>
                    {item.body && <span className="mt-0.5 block line-clamp-2 text-xs text-ink-4">{item.body}</span>}
                    <span className="mt-1 block text-[10px] font-medium uppercase text-ink-5">
                      {formatWhen(item.createdAt)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {items.length > PREVIEW_LIMIT && (
            <p className="px-4 py-2.5 text-center text-xs text-ink-5">
              Showing {PREVIEW_LIMIT} of {items.length} — the bell in the top bar holds the rest.
            </p>
          )}
        </>
      )}
    </Card>
  );
}
