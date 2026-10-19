import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileUp,
  Save,
  TriangleAlert
} from 'lucide-react';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import CvSectionForm from '../components/CvSectionForm';
import CvStepper from '../components/CvStepper';
import { studentService } from '../../../service/studentService';
import { cvService } from '../../../service/cvService';

// One entry per wizard step. The wizard never skips past the review step, and
// the guided form keeps every step's answers while the user moves between
// them. Phases 3+ plug export/preview into the review step.
const STEP_CONFIGS = [
  {
    id: 'personal',
    title: 'Your details',
    hint: 'These details are pre-filled from your student profile. The email address is the one your account signs in with, so it stays read-only.',
    fields: [
      {
        key: 'title',
        label: 'CV title',
        kind: 'input',
        placeholder: 'e.g. Jane Doe — Industrial Attachment CV'
      },
      {
        key: 'phone',
        label: 'Phone',
        kind: 'input',
        placeholder: '0712345678'
      },
      {
        key: 'location',
        label: 'Location',
        kind: 'input',
        placeholder: 'City / campus'
      },
      {
        key: 'links',
        label: 'Personal site / LinkedIn',
        kind: 'input',
        placeholder: 'https://…'
      }
    ]
  },
  {
    id: 'summary',
    title: 'Professional summary',
    hint: 'Two or three sentences summarising your skills and what you are looking for.',
    fields: [
      {
        key: 'professionalSummary',
        label: 'Summary',
        kind: 'textarea',
        rows: 6,
        placeholder: 'I am a … student seeking …'
      }
    ]
  },
  {
    id: 'education',
    title: 'Education',
    hint: 'Qualifications completed or in progress, newest first.',
    fields: [
      {
        key: 'education',
        label: 'Education',
        kind: 'list',
        addLabel: 'Add education',
        emptyLabel: 'No qualifications yet — add your degree or course.',
        rows: [
          { key: 'school', label: 'School / institution', kind: 'input' },
          { key: 'degree', label: 'Degree', kind: 'input', placeholder: 'BSc' },
          { key: 'year', label: 'Year', kind: 'input', placeholder: '2021' },
          { key: 'description', label: 'Notes', kind: 'textarea' }
        ]
      }
    ]
  },
  {
    id: 'experience',
    title: 'Experience',
    hint: 'Internships, attachments or part-time work, newest first.',
    fields: [
      {
        key: 'experience',
        label: 'Experience',
        kind: 'list',
        addLabel: 'Add experience',
        emptyLabel: 'No experience yet — add your internship or attachment.',
        rows: [
          { key: 'company', label: 'Company / organisation', kind: 'input' },
          {
            key: 'role',
            label: 'Role',
            kind: 'input',
            placeholder: 'Industrial attaché'
          },
          { key: 'start', label: 'Starts', kind: 'input', placeholder: '2026' },
          { key: 'end', label: 'Ends', kind: 'input', placeholder: '2026' },
          { key: 'description', label: 'What you did', kind: 'textarea' }
        ]
      }
    ]
  },
  {
    id: 'skills',
    title: 'Skills',
    hint: 'Group your skills by category; each list holds the individual skills.',
    fields: [
      {
        key: 'skills',
        label: 'Skills',
        kind: 'list',
        addLabel: 'Add skills',
        emptyLabel: 'No skills yet — add any you can demonstrate in an interview.',
        rows: [
          {
            key: 'category',
            label: 'Category',
            kind: 'input',
            placeholder: 'Languages'
          },
          {
            key: 'items',
            label: 'Skills',
            kind: 'textarea',
            placeholder: 'one per line'
          }
        ]
      }
    ]
  },
  {
    id: 'projects',
    title: 'Projects',
    hint: 'Significant projects, portfolios or open-source work.',
    fields: [
      {
        key: 'projects',
        label: 'Projects',
        kind: 'list',
        addLabel: 'Add project',
        emptyLabel: 'No projects yet — add a significant project.',
        rows: [
          {
            key: 'name',
            label: 'Project',
            kind: 'input',
            placeholder: 'Final-year project'
          },
          { key: 'link', label: 'Link', kind: 'input', placeholder: 'https://…' },
          { key: 'description', label: 'What you did', kind: 'textarea' }
        ]
      }
    ]
  },
  {
    id: 'certifications',
    title: 'Certifications',
    hint: 'Certificates, licences and professional memberships.',
    fields: [
      {
        key: 'certifications',
        label: 'Certifications',
        kind: 'list',
        addLabel: 'Add certification',
        emptyLabel: 'No certifications yet.',
        rows: [
          { key: 'title', label: 'Certificate', kind: 'input' },
          { key: 'issuer', label: 'Issued by', kind: 'input' },
          { key: 'year', label: 'Year', kind: 'input', placeholder: '2021' },
          { key: 'description', label: 'Notes', kind: 'textarea' }
        ]
      }
    ]
  },
  {
    id: 'review',
    title: 'Review',
    hint:
      'Check the CV reads well before you save it. Everything here is generated from the answers above — nothing is scored yet (that arrives with the job analyzer).'
  }
];

// The personal-info payload reuses the student's profile as its starting point,
// but the login email is read-only so it can never break the current session.
function personalInfoFromProfile(profile) {
  return {
    name: profile?.fullName ?? '',
    email: profile?.email ?? '',
    phone: profile?.phone ?? '',
    location: '',
    links: ''
  };
}

// The review checklist is deliberately lightweight: Phase 2 ships guidance,
// while Phase 4 adds the real keyword overlap scoring.
function buildReviewChecklist(values) {
  const education = Array.isArray(values.education) ? values.education.length > 0 : false;
  const experience =
    Array.isArray(values.experience) ? values.experience.length > 0 : false;
  const skills = Array.isArray(values.skills) ? values.skills.length > 0 : false;
  const projects =
    Array.isArray(values.projects) ? values.projects.length > 0 : false;
  const certifications =
    Array.isArray(values.certifications) ? values.certifications.length > 0 : false;

  return [
    {
      id: 'title',
      label: 'A clear CV title is present',
      met: Boolean((values.title ?? '').trim())
    },
    {
      id: 'summary',
      label: 'A professional summary is present',
      met: Boolean((values.professionalSummary ?? '').trim())
    },
    { id: 'education', label: 'At least one education entry', met: education },
    { id: 'experience', label: 'At least one experience entry', met: experience },
    { id: 'skills', label: 'At least one skill category', met: skills },
    {
      id: 'projects-or-certifications',
      label: 'Projects or certifications',
      met: projects || certifications
    }
  ];
}

export default function CvBuilderWizard() {
  const [currentStepId, setCurrentStepId] = useState(STEP_CONFIGS[0].id);
  const { cvId: routeCvId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const cvId = routeCvId !== undefined ? routeCvId : null;
  const [exists, setExists] = useState(false);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Uploading redirects to /students/cv-builder/:id with the source filename in
  // router state, so the confirmation survives that navigation.
  const [notice, setNotice] = useState(
    location.state?.importedFrom
      ? { type: 'success', text: `Imported from ${location.state.importedFrom}. Review the parsed details, then save.` }
      : null
  );
  const [loadError, setLoadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    let active = true;
    const loadExisting = async () => {
      try {
        if (cvId === null) {
          const profile = await studentService.getProfile();
          if (!active) return;
          setValues({
            title: '',
            personalInfo: personalInfoFromProfile(profile),
            professionalSummary: '',
            education: [],
            experience: [],
            skills: [],
            projects: [],
            certifications: []
          });
        } else {
          const cv = await cvService.getCv(cvId);
          if (!active) return;
          setValues({
            isPrimary: Boolean(cv.isPrimary),
            uploadSource: cv.uploadSource ?? null,
            sourceFilename: cv.originalFilename ?? '',
            title: cv.title ?? '',
            personalInfo: {
              name: cv.personalInfo?.name ?? '',
              email: cv.personalInfo?.email ?? '',
              phone: cv.personalInfo?.phone ?? '',
              location: cv.personalInfo?.location ?? '',
              links: cv.personalInfo?.links ?? ''
            },
            professionalSummary: cv.professionalSummary ?? '',
            education: cv.education ?? [],
            experience: cv.experience ?? [],
            skills: cv.skills ?? [],
            projects: cv.projects ?? [],
            certifications: cv.certifications ?? []
          });
          setExists(true);
          setCurrentStepId('review');
        }
      } catch {
        if (active) {
          setLoadError('Could not load your CV. Refresh and try again.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    loadExisting();
    return () => {
      active = false;
    };
  }, [cvId]);

  const updateValues = (key, nextSection) => {
    setValues((prev) => ({ ...prev, [key]: nextSection[key] }));
  };

  const stepConfig = (id) => STEP_CONFIGS.find((step) => step.id === id);
  const currentStep = stepConfig(currentStepId);
  const currentIndex = STEP_CONFIGS.findIndex((step) => step.id === currentStepId);
  const isLastStep = currentIndex === STEP_CONFIGS.length - 1;

  const goToPrevious = () => {
    const previous = STEP_CONFIGS[currentIndex - 1];
    if (previous) setCurrentStepId(previous.id);
  };

  const goToNext = () => {
    const next = STEP_CONFIGS[currentIndex + 1];
    if (next) setCurrentStepId(next.id);
  };

  const save = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const payload = {
        title: values.title ?? '',
        personalInfo: values.personalInfo,
        professionalSummary: values.professionalSummary ?? '',
        education: values.education ?? [],
        experience: values.experience ?? [],
        skills: values.skills ?? [],
        projects: values.projects ?? [],
        certifications: values.certifications ?? []
      };
      const saved =
        cvId !== null
          ? await cvService.updateCv(cvId, payload)
          : await cvService.createCv(payload);
      setNotice({
        type: 'success',
        text: exists ? 'Your CV was updated.' : 'Your CV was created.'
      });
      if (saved) setValues((prev) => ({ ...prev, ...saved }));
    } catch (error) {
      setNotice({
        type: 'error',
        text:
          error?.response?.data?.message ||
          'Your CV could not be saved. Refresh and try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    setUploadError('');
    try {
      // The upload already creates the CV, so open it: the wizard loads the
      // parsed draft, and Save then updates that same row instead of adding a
      // second copy.
      const imported = await cvService.uploadCv(file);
      navigate(`/students/cv-builder/${imported.id}`, {
        state: { importedFrom: imported.originalFilename || file.name }
      });
    } catch (err) {
      setUploadError(err?.response?.data?.message || 'Could not upload or parse that CV.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-8">
        <p className="text-ink-4">Loading your CV…</p>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card className="p-8">
        <p className="text-rose-600">{loadError}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-ink">
          {cvId !== null ? 'Edit your CV' : 'Build your CV'}
        </h1>
        <p className="max-w-2xl text-sm text-ink-4">
          A guided, ATS-friendly CV — answers save as you move between the
          steps, and only you can see this.
        </p>
        {values.uploadSource === 'upload' && values.sourceFilename && (
          <p className="flex items-center gap-1 text-sm text-brand-700">
            <FileUp className="h-4 w-4" /> Imported from {values.sourceFilename}
          </p>
        )}
        {cvId === null && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink-2 hover:bg-surface-2 cursor-pointer">
              <input
                type="file"
                accept=".pdf,.txt,text/plain,application/pdf,application/x-pdf"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
              {uploading ? 'Uploading…' : 'Upload an existing CV (PDF/Text)'}
            </label>
            {uploadError && <span className="text-sm text-rose-600">{uploadError}</span>}
          </div>
        )}
        {notice && (
          <p
            className={`mt-2 inline-block rounded-xl border px-4 py-2 text-sm ${
              notice.type === 'success'
                ? 'border-brand-600/40 bg-brand-50 text-brand-700'
                : 'border-rose-600/40 bg-rose-50 text-rose-700'
            }`}
            role={notice.type === 'success' ? 'status' : 'alert'}
          >
            {notice.text}
          </p>
        )}
      </header>

      <CvStepper currentStepId={currentStepId} />

      <Card>
        <div className="space-y-6">
          {currentStep.id === 'review' ? (
            <ReviewStep
              checklist={buildReviewChecklist(values)}
              isEditing={exists}
              isPrimary={Boolean(values.isPrimary)}
              onMakePrimary={(event) => {
                if (event.target.checked && cvId !== null) {
                  void cvService.setPrimaryCv(cvId);
                }
              }}
            />
          ) : (
            <CvSectionForm
              title={currentStep.title}
              hint={currentStep.hint}
              fields={currentStep.fields ?? []}
              values={values}
              errors={{}}
              onChange={updateValues}
            />
          )}

          <footer className="flex items-center justify-between gap-3 border-t border-line pt-4">
            <Button
              variant="ghost"
              icon={ArrowLeft}
              disabled={currentIndex === 0}
              onClick={goToPrevious}
            >
              Back
            </Button>
            {isLastStep ? (
              <Button icon={Save} disabled={saving} onClick={save}>
                {saving ? 'Saving…' : 'Save my CV'}
              </Button>
            ) : (
              <Button icon={ArrowRight} onClick={goToNext}>
                Continue
              </Button>
            )}
          </footer>
        </div>
      </Card>
    </div>
  );
}

function ReviewStep({ checklist, isEditing, isPrimary, onMakePrimary }) {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-base font-bold text-ink">Does your CV cover itself?</h3>
        <ul className="space-y-2">
          {checklist.map((item) => (
            <li key={item.id} className="flex items-start gap-2 text-sm">
              {item.met ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              ) : (
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              )}
              <span className={item.met ? 'text-ink' : 'text-ink-4'}>{item.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-ink">Versions</h3>
        <p className="text-sm text-ink-4">
          {isEditing
            ? 'Saving changes keeps every other version of your CV, and you can mark one version as your primary.'
            : 'Only one version of your CV can be your primary.'}
        </p>
        {isEditing && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(event) => onMakePrimary(event)}
            />
            This is my primary CV
          </label>
        )}
      </section>
    </div>
  );
}