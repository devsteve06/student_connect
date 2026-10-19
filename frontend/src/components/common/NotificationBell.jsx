// components/common/NotificationBell.jsx
// The Navbar's bell, made real (JOB_POSTING_PLAN.md Phase 2): live unread
// badge, dropdown feed, per-item and read-all dismissal. Students and firms
// are the only roles with a backend feed; other roles render nothing.
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { notificationService } from '../../service/notificationService';

const POLL_MS = 60_000;
const SUPPORTED_ROLES = new Set(['student', 'firm']);

function formatWhen(createdAt) {
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
}

export default function NotificationBell({ role }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  // Initial badge + a polling fallback (the API has no realtime channel), and
  // a refresh on every navigation so arriving on a page reflects its events.
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const data = await notificationService.unreadCount(role);
        if (!cancelled) setCount(data.count);
      } catch {
        // A dropped poll must never break the header; the next tick retries.
      }
    };
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [role, location.pathname]);

  // Close the dropdown on any click outside it.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next && items.length === 0) {
      setLoading(true);
      try {
        setItems(await notificationService.list(role));
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleItemClick = async (item) => {
    if (!item.isRead) {
      try {
        await notificationService.markRead(role, item.id);
        setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
        setCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Keep the row unread; the next poll resyncs the badge.
        return;
      }
    }
    setOpen(false);
    if (item.link) navigate(item.link);
  };

  const handleMarkAll = async () => {
    try {
      await notificationService.markAllRead(role);
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setCount(0);
    } catch {
      // Badge stays as-is; user can retry.
    }
  };

  if (!SUPPORTED_ROLES.has(role)) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={toggleOpen}
        aria-label={count > 0 ? `Notifications (${count} unread)` : 'Notifications'}
        aria-expanded={open}
        className="relative rounded-full p-2 text-ink-5 transition-colors hover:bg-surface-3 hover:text-ink-3"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-0.5 text-[9px] font-bold leading-none text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-30 w-80 overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
          <div className="flex items-center justify-between border-b border-line/80 px-3 py-2">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-4">Notifications</span>
            {count > 0 && (
              <button
                onClick={handleMarkAll}
                className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && <p className="px-4 py-6 text-center text-sm text-ink-4">Loading…</p>}

            {!loading && items.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <Inbox className="h-6 w-6 text-ink-4" />
                <p className="text-sm font-semibold text-ink-2">Nothing yet</p>
                <p className="text-xs text-ink-4">
                  New postings and application updates will show up here.
                </p>
              </div>
            )}

            {!loading &&
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`flex w-full items-start gap-2.5 border-b border-line/60 px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-surface-2 ${
                    item.isRead ? 'opacity-70' : ''
                  }`}
                >
                  {!item.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" />}
                  <span className={item.isRead ? 'ml-4.5' : 'min-w-0'}>
                    <span className="block truncate text-sm font-semibold text-ink">{item.title}</span>
                    {item.body && <span className="mt-0.5 block line-clamp-2 text-xs text-ink-4">{item.body}</span>}
                    <span className="mt-1 block text-[10px] font-medium uppercase text-ink-5">
                      {formatWhen(item.createdAt)}
                    </span>
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
