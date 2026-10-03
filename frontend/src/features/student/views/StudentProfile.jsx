import { useEffect, useState } from 'react';
import { Building2, GraduationCap, Hash, Phone, Save, User } from 'lucide-react';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import Skeleton from '../../../components/common/Skeleton';
import { roleChip } from '../../../config/roleTheme';
import { studentService } from '../../../service/studentService';
import sessionStore from '../../../service/sessionStore';
import { useAuth } from '../../../context/useAuth';

const PHONE_RE = /^(\+?254|0)[17]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function StudentProfile() {
  const { refreshUser } = useAuth();
  const eyebrow = roleChip('student');

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ fullName: '', phone: '', email: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let active = true;
    studentService
      .getProfile()
      .then((data) => {
        if (!active) return;
        setProfile(data);
        setForm({ fullName: data.fullName || '', phone: data.phone || '', email: data.email || '' });
      })
      .catch(() => {
        if (active) setNotice({ type: 'error', text: 'Could not load your profile. Refresh and try again.' });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const setField = (key) => (value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setNotice(null);
  };

  const validate = () => {
    const next = {};
    if (form.fullName.trim().length < 2) next.fullName = 'Name must be at least 2 characters.';
    if (form.phone.trim() && !PHONE_RE.test(form.phone.trim())) {
      next.phone = 'Use a valid Kenyan number, e.g. 0712345678 or +254712345678.';
    }
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email address.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setNotice(null);
    try {
      const updated = await studentService.updateProfile({
        fullName: form.fullName,
        phone: form.phone,
        email: form.email
      });
      setProfile(updated);
      setNotice({ type: 'success', text: 'Profile saved successfully.' });

      const stored = sessionStore.getProfile();
      if (stored) {
        sessionStore.save({
          ...stored,
          token: sessionStore.getToken(),
          _id: stored.id,
          name: updated.fullName,
          email: updated.email
        });
        refreshUser();
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        (error.message && error.message !== 'Request failed with status code 400' ? error.message : null) ||
        'Could not save changes. Try again.';
      setNotice({ type: 'error', text: message });
    } finally {
      setSaving(false);
    }
  };

  const identityRows = profile
    ? [
        { icon: Hash, label: 'Registration number', value: profile.regNumber },
        { icon: GraduationCap, label: 'Course', value: profile.course },
        { icon: Building2, label: 'University', value: profile.university },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-line-2 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <span className={eyebrow.classes}>{eyebrow.label}</span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Profile
          </h1>
          <p className="mt-1 text-sm text-ink-4">
            Keep your personal details up to date so firms can reach you.
          </p>
        </div>
      </div>

      {loading ? (
        <Skeleton variant="card" lines={5} className="max-w-2xl" />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Identity snapshot (read-only) */}
          <Card title="Identity" eyebrow="Enrolled record" className="h-fit">
            <dl className="space-y-4">
              {identityRows.map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-[11px] font-bold uppercase tracking-wider text-ink-5">
                        {row.label}
                      </dt>
                      <dd className="truncate text-sm font-semibold text-ink">{row.value}</dd>
                    </div>
                  </div>
                );
              })}
            </dl>
          </Card>

          {/* Editable personal details */}
          <Card
            title="Personal details"
            eyebrow="Editable"
            className="lg:col-span-2"
            bodyClassName="space-y-5"
          >
            <form onSubmit={handleSave} className="space-y-5" noValidate>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input
                  label="Full name"
                  icon={User}
                  value={form.fullName}
                  onChange={(e) => setField('fullName')(e.target.value)}
                  placeholder="Your full name"
                  error={errors.fullName}
                />
                <Input
                  label="Phone number"
                  icon={Phone}
                  value={form.phone}
                  onChange={(e) => setField('phone')(e.target.value)}
                  placeholder="e.g. 0712345678"
                  error={errors.phone}
                />
              </div>
              <Input
                label="Email address"
                value={form.email}
                onChange={(e) => setField('email')(e.target.value)}
                placeholder="you@example.com"
                error={errors.email}
              />

              {notice && (
                <p
                  role="status"
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                    notice.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-rose-200 bg-rose-50 text-rose-700'
                  }`}
                >
                  {notice.text}
                </p>
              )}

              <div className="flex items-center gap-3 border-t border-line-2 pt-5">
                <Button type="submit" icon={Save} disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
                {profile && (
                  <p className="text-xs font-semibold text-ink-5">
                    Profile {profile.profileCompletion} complete
                  </p>
                )}
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}