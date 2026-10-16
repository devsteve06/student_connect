import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import { cvService } from '../../../service/cvService';
import apiClient from '../../../service/apiClient';

// Phase 3 — read-only CV preview + PDF export trigger. The PDF itself is
// generated server-side (Phase 3 backend, pdfkit); this view asks for it and
// saves the returned blob to disk.
function PreviewSection({ heading, entries }) {
  const present = entries.filter(([, value]) => Boolean(value));
  if (present.length === 0) return null;
  return (
    <section className="space-y-2">
      <h3 className="text-base font-bold text-ink">{heading}</h3>
      <dl className="space-y-1 rounded-xl border border-line bg-surface p-4">
        {present.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5">
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-4">
              {label}
            </dt>
            <dd className="text-sm text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function cvEntries(rows, makeEntry) {
  const present = (Array.isArray(rows) ? rows : [])
    .map((row) => makeEntry(row))
    .filter((entry) => entry && entry.value);
  return present.map((entry) => [entry.label, entry.value]);
}

export default function CvPreview() {
  const { cvId } = useParams();
  const navigate = useNavigate();
  const [cv, setCv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let active = true;
    if (cvId) {
      cvService
        .getCv(cvId)
        .then((data) => {
          if (!active) return;
          setCv(data);
        })
        .catch(() => {
          if (active) setError('Could not load this CV. Refresh and try again.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [cvId]);

  const exportPdf = async () => {
    if (!cvId || exporting) return;
    setExporting(true);
    try {
      const response = await apiClient.get(`/api/v1/students/cv/${cvId}/export`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${(cv?.title ?? 'cv').replace(/[^\w]+/g, '-')}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // Phase 3 has no user-facing error surface for a failed export yet —
      // Phase 5 owns that UX polish.
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-8">
        <p className="text-ink-4">Loading your CV…</p>
      </Card>
    );
  }

  if (error || !cv) {
    return (
      <Card className="p-8">
        <p className="text-rose-600">{error || 'Could not load this CV. Refresh and try again.'}</p>
        <div className="mt-4">
          <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/students/cv-builder')}>
            Back to the CV builder
          </Button>
        </div>
      </Card>
    );
  }

  const personal = [
    ['Name', cv.personalInfo?.name],
    ['Email', cv.personalInfo?.email],
    ['Phone', cv.personalInfo?.phone],
    ['Location', cv.personalInfo?.location],
    ['Website / LinkedIn', cv.personalInfo?.links]
  ].filter(([label, value]) => label && value);

  const education = cvEntries(cv.education, (row) => ({
    label: row?.school ?? 'Qualification',
    value: [row?.degree, row?.year].filter(Boolean).join(' — ')
  }));
  const experience = cvEntries(cv.experience, (row) => ({
    label: row?.company ?? 'Experience',
    value:
      [row?.role, row?.start && row?.end && row.start !== row.end ? `${row.start} – ${row.end}` : row?.start]
        .filter(Boolean)
        .join(' — ') || row?.description
  }));
  const skills = cvEntries(cv.skills, (row) => ({
    label: row?.category,
    value: row?.items
  }));
  const projects = cvEntries(cv.projects, (row) => ({
    label: row?.name ?? 'Project',
    value: row?.link ?? row?.description
  }));
  const certifications = cvEntries(cv.certifications, (row) => ({
    label: row?.title ?? 'Certification',
    value: row?.issuer ?? row?.year
  }));

  const hasAnyContent =
    personal.length > 0 ||
    cv.professionalSummary ||
    education.length > 0 ||
    experience.length > 0 ||
    skills.length > 0 ||
    projects.length > 0 ||
    certifications.length > 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-ink">{cv.title || 'Your CV'}</h1>
          <p className="text-sm text-ink-4">Read-only preview of the saved CV.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/students/cv-builder')}>
            Back to the builder
          </Button>
          <Button icon={Download} disabled={exporting} onClick={() => void exportPdf()}>
            {exporting ? 'Exporting…' : 'Export PDF'}
          </Button>
        </div>
      </header>

      <Card>
        <div className="space-y-6">
          {!hasAnyContent && (
            <p className="text-sm text-ink-4">
              This CV has no content yet — go back to the builder and answer the guided steps.
            </p>
          )}
          <PreviewSection heading="Personal details" entries={personal} />
          {cv.professionalSummary && (
            <PreviewSection heading="Professional summary" entries={[['Summary', cv.professionalSummary]]} />
          )}
          <PreviewSection heading="Education" entries={education} />
          <PreviewSection heading="Experience" entries={experience} />
          <PreviewSection heading="Skills" entries={skills} />
          <PreviewSection heading="Projects" entries={projects} />
          <PreviewSection heading="Certifications" entries={certifications} />
        </div>
      </Card>

      <p className="flex items-center gap-2 text-sm text-ink-4">
        <FileText className="h-4 w-4" />
        Preview is a faithful read of the saved values; the PDF is generated server-side from the same data.
      </p>
    </div>
  );
}
