import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Button from '../components/common/Button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-2 px-4 text-center">
      <img src="/favicon.svg" alt="Student Connect" className="mb-6 h-14 w-14 rounded-2xl shadow-lifted" />
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Compass className="h-7 w-7" />
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-ink-5">Error 404</p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">This page doesn't exist</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-4">
        The page you're looking for may have moved, or the link might be out of date.
      </p>
      <Button className="mt-6" onClick={() => navigate('/')}>
        Back to Student Connect
      </Button>
    </div>
  );
}