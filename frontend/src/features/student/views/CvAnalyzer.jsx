import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, FileText, Sparkles } from 'lucide-react';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import { studentService } from '../../../service/studentService';
import { cvService } from '../../../service/cvService';

// Phase 4 — job analyzer. Past runs are stored by the backend in cv_analyses
// and this view lists them; a fresh run is triggered by picking a placement or
// pasting a job title / description.
const SECTION_LABELS = {
  personal: 'Personal details',
  summary: 'Professional summary',
  education: 'Education',
  experience: 'Experience',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications'
};

export default function CvAnalyzer() {
  const navigate = useNavigate();
  const [placements, setPlacements] = useState([]);
  const [placementsLoading, setPlacementsLoading] = useState(true);
  const [placementId, setPlacementId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [pastAnalyses, setPastAnalyses] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [placementResults, past] = await Promise.all([
          studentService.getPlacements(),
          cvService.getAnalyses()
        ]);
        if (!active) return;
        setPlacements(Array.isArray(placementResults) ? placementResults : []);
        setPastAnalyses(Array.isArray(past) ? past : []);
      } catch {
        if (active) {
          setError('Could not load the job listings or past analyses. Refresh and try again.');
        }
      } finally {
        if (active) setPlacementsLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const runAnalysis = async () => {
    setAnalyzing(true);
    setError('');
    try {
      const result = placementId
        ? await cvService.analyzeCv({ placementId: Number(placementId) })
        : await cvService.analyzeCv({
            jobTitle: jobTitle.trim() || undefined,
            jobDescription: jobDescription.trim() || undefined
          });
      setAnalysis(result);
      const past = await cvService.getAnalyses();
      setPastAnalyses(Array.isArray(past) ? past : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'The analysis could not be run. Refresh and try again.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const pickPlacement = (id) => {
    setPlacementId(id);
  };

  const scoreTone =
    analysis === null
      ? 'text-ink'
      : analysis.matchScore >= 70
        ? 'text-brand-600'
        : analysis.matchScore >= 40
          ? 'text-amber-600'
          : 'text-rose-600';

  const missingKeywords = Array.isArray(analysis?.keywordMatch?.missing)
    ? analysis.keywordMatch.missing
    : [];

  const matchedKeywords = Array.isArray(analysis?.keywordMatch?.matched)
    ? analysis.keywordMatch.matched
    : [];

  const sectionEntries = Object.entries(analysis?.sectionScores ?? {});

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-ink">Job analyzer</h1>
        <p className="max-w-2xl text-sm text-ink-4">
          Score your CV against a job description — keyword overlap, gaps, and
          per-section coverage.
        </p>
        <div className="mt-2">
          <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/students/cv-builder')}>
            Back to the CV builder
          </Button>
        </div>
      </header>

      <Card>
        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-base font-bold text-ink">1 · Pick a job</h3>
            {placementsLoading ? (
              <p className="text-sm text-ink-4">Loading job listings…</p>
            ) : placements.length === 0 ? (
              <p className="text-sm text-ink-4">No job listings are available right now.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {placements.map((placement) => (
                  <button
                    key={placement.id}
                    type="button"
                    onClick={() => pickPlacement(String(placement.id))}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      placementId === String(placement.id)
                        ? 'border-brand-600 bg-brand-50'
                        : 'border-line bg-surface hover:bg-surface-2'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <Building2 className="h-4 w-4 text-brand-600" />
                      {placement.companyName || placement.company || 'Company'}
                    </span>
                    <span className="mt-1 block text-sm text-ink-2">{placement.role}</span>
                    <span className="mt-1 block text-xs text-ink-4">{placement.location}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-bold text-ink">2 · Or paste a job description</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={jobTitle}
                onChange={(event) => setJobTitle(event.target.value)}
                placeholder="Job title (optional)"
                className="h-10 rounded-xl border border-line bg-surface px-4 text-sm text-ink"
              />
              <textarea
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste the job description…"
                rows={5}
                className="rounded-xl border border-line bg-surface px-4 py-2 text-sm text-ink"
              />
            </div>
          </section>

          <footer className="flex justify-end border-t border-line pt-4">
            <Button icon={Sparkles} disabled={analyzing} onClick={() => void runAnalysis()}>
              {analyzing ? 'Analyzing…' : 'Run analysis'}
            </Button>
          </footer>
        </div>
      </Card>

      {error && (
        <p className="rounded-xl border border-rose-600/40 bg-rose-50 px-4 py-2 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}

      {analysis ? (
        <Card>
          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-base font-bold text-ink">Match score</h3>
              <div className="flex flex-col items-center gap-2">
                <p className={`text-5xl font-bold ${scoreTone}`}>{analysis.matchScore}</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-4">
                  out of 100
                </p>
                <div className="h-2 w-full max-w-md rounded-full bg-surface-2">
                  <div
                    className="h-2 rounded-full bg-brand-600"
                    style={{ width: `${Math.min(analysis.matchScore ?? 0, 100)}%` }}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-ink">Keyword coverage</h3>
              <div className="flex flex-wrap gap-2">
                {matchedKeywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full border border-brand-600/40 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
                  >
                    ✓ {keyword}
                  </span>
                ))}
                {missingKeywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full border border-rose-600/40 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                  >
                    ✗ {keyword}
                  </span>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-ink">Gaps & suggestions</h3>
              <p className="whitespace-pre-line text-sm text-ink-2">{analysis.gapAnalysis}</p>
            </section>

            {sectionEntries.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-base font-bold text-ink">Per-section coverage</h3>
                <ul className="space-y-2">
                  {sectionEntries.map(([key, score]) => (
                    <li key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-ink-2">{SECTION_LABELS[key] ?? key}</span>
                        <span className="font-semibold text-ink">{score}</span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-2">
                        <div
                          className="h-2 rounded-full bg-brand-600"
                          style={{ width: `${Math.min(score ?? 0, 100)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </Card>
      ) : (
        <Card>
          <div className="space-y-3">
            <FileText className="h-5 w-5 text-ink-4" />
            <p className="text-sm text-ink-4">
              No analysis yet. Pick a job above and run the analyzer — or head back to the
              builder to prepare your CV first.
            </p>
          </div>
        </Card>
      )}

      {pastAnalyses.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-ink">Past analyses</h2>
          <ul className="space-y-2">
            {pastAnalyses.map((past) => (
              <li key={past.id}>
                <button
                  type="button"
                  onClick={() => setAnalysis(past)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4 text-left transition-all hover:bg-surface-2"
                >
                  <span className="space-y-1">
                    <span className="block text-sm font-semibold text-ink">
                      {past.jobTitle || 'Untitled analysis'}
                    </span>
                    <span className="block text-xs text-ink-4">
                      {past.createdAt ? new Date(past.createdAt).toLocaleString() : ''}
                    </span>
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      past.matchScore >= 70
                        ? 'bg-brand-50 text-brand-700'
                        : past.matchScore >= 40
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {past.matchScore}/100
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
