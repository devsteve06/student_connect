// Maps the status strings used across the app to a consistent Badge variant.
import Badge from './Badge';

const map = {
  approved: { variant: 'success', label: 'Approved' },
  placed: { variant: 'success', label: 'Placed' },
  hired: { variant: 'success', label: 'Placed' },
  verified: { variant: 'success', label: 'Verified' },
  shortlisted: { variant: 'info', label: 'Shortlisted' },
  interviewing: { variant: 'info', label: 'Interviewing' },
  'interview scheduled': { variant: 'info', label: 'Interview scheduled' },
  pending: { variant: 'warning', label: 'Pending' },
  'pending review': { variant: 'warning', label: 'Pending review' },
  'pending verification': { variant: 'warning', label: 'Pending verification' },
  'under review': { variant: 'warning', label: 'Under review' },
  'awaiting screening': { variant: 'warning', label: 'Awaiting screening' },
  'in review': { variant: 'warning', label: 'In review' },
  rejected: { variant: 'danger', label: 'Not selected' },
  unassigned: { variant: 'neutral', label: 'Unassigned' },
  'offer received': { variant: 'success', label: 'Offer received' },
  'offer extended': { variant: 'success', label: 'Offer extended' },
};

export default function StatusPill({ status, className = '' }) {
  const key = String(status || '').trim().toLowerCase();
  const resolved = map[key] || { variant: 'neutral', label: status || '—' };
  return <Badge variant={resolved.variant} dot className={className}>{resolved.label}</Badge>;
}