import { Check } from 'lucide-react';
import Card from '../../../components/common/Card';

// The wizard's step order. `review` is the final checklist; the guided form
// never jumps past it, and Phases 3+ (export/preview) plug into the review.
const STEPS = [
  { id: 'personal', label: 'Your details' },
  { id: 'summary', label: 'Summary' },
  { id: 'education', label: 'Education' },
  { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'review', label: 'Review' }
];

// Read-only progress indicator for the wizard. The current step is highlighted
// and completed steps are ticked; the wizard enforces order, so steps cannot
// be jumped to (the back button lives next to the step content instead).
export default function CvStepper({ currentStepId }) {
  const currentIndex = STEPS.findIndex((step) => step.id === currentStepId);

  return (
    <Card className="p-5">
      <ol className="flex flex-wrap items-start gap-x-6 gap-y-3">
        {STEPS.map((step, index) => {
          const done = index < currentIndex;
          const current = index === currentIndex;
          return (
            <li
              key={step.id}
              className={`flex min-w-[7rem] flex-1 flex-col items-start gap-1.5 ${
                current ? '' : 'opacity-60'
              }`}
              aria-current={current ? 'step' : undefined}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${
                  done
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : current
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-line text-ink-4'
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span
                className={`text-sm font-semibold ${current ? 'text-ink' : 'text-ink-4'}`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
