import { Plus, Trash2 } from 'lucide-react';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import Textarea from '../../../components/common/Textarea';

// Field kinds understood by CvSectionForm:
//   'input'    — a single-line text field
//   'textarea' — a multi-line text area
//   'list'     — a repeatable list of objects; `rows` describes each entry.
//               `values` holds the array and `onChange` receives the next one.
// Reusable editor for one wizard section. The wizard supplies, per section:
//   title / hint        — what this section is and why it matters
//   fields             — the scalar + list fields of the section
//   values             — current section values (as produced by the wizard)
//   errors             — field-level validation errors from the wizard
//   onChange(key, nextValues) — the wizard replaces the section's values
// The section itself stays mounted while the user moves between steps, so the
// wizard keeps every step's half-finished answers.
export default function CvSectionForm({
  title,
  hint,
  fields,
  values,
  errors,
  onChange
}) {
  const setScalar = (key) => (value) => {
    const next = { ...values, [key]: value };
    onChange(key, next);
  };

  const setList = (key) => (next) => {
    const merged = { ...values, [key]: next };
    onChange(key, merged);
  };

  const setRow = (key, rowIndex, fieldKey, value) => {
    const rows = values[key].map((row, index) => {
      if (index !== rowIndex) return row;
      return { ...row, [fieldKey]: value };
    });
    setList(key)(rows);
  };

  return (
    <Card>
      <div className="space-y-4">
        <header className="border-b border-line pb-3">
          <h3 className="text-base font-bold text-ink">{title}</h3>
          {hint && <p className="mt-1 text-sm text-ink-4">{hint}</p>}
        </header>

        {fields.map((field) => {
          if (field.kind === 'list') {
            const rows = values[field.key] || [];
            return (
              <section key={field.key} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-ink-2">{field.label}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={Plus}
                    onClick={() =>
                      setList(field.key)([
                        ...rows,
                        Object.fromEntries(
                          field.rows.map((row) => [row.key, ''])
                        )
                      ])
                    }
                  >
                    Add
                  </Button>
                </div>
                {rows.length === 0 && (
                  <p className="text-sm text-ink-4">{field.emptyLabel}</p>
                )}
                {rows.map((row, rowIndex) => (
                  <fieldset
                    key={rowIndex}
                    className="rounded-xl border border-line bg-surface p-4"
                  >
                    <legend className="flex items-center justify-between px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-ink-4">
                      {field.itemLabel(rowIndex)}
                    </legend>
                    <div className="grid gap-3 px-3 pb-3 pt-1 sm:grid-cols-2">
                      {field.rows.map((rowField) => (
                        <label key={rowField.key} className="block">
                          <span className="text-sm font-medium text-ink-3">
                            {rowField.label}
                          </span>
                          {rowField.kind === 'textarea' ? (
                            <Textarea
                              className="mt-1"
                              rows={3}
                              value={row[rowField.key] ?? ''}
                              onChange={(event) =>
                                setRow(
                                  field.key,
                                  rowIndex,
                                  rowField.key,
                                  event.target.value
                                )
                              }
                            />
                          ) : (
                            <Input
                              className="mt-1"
                              value={row[rowField.key] ?? ''}
                              onChange={(event) =>
                                setRow(
                                  field.key,
                                  rowIndex,
                                  rowField.key,
                                  event.target.value
                                )
                              }
                            />
                          )}
                        </label>
                      ))}
                      <div>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          className="mt-1"
                          onClick={() =>
                            setList(field.key)(rows.filter((_, index) => index !== rowIndex))
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </fieldset>
                ))}
              </section>
            );
          }

          const error = errors[field.key];
          return (
            <label key={field.key} className="block">
              <span className="text-sm font-medium text-ink-3">
                {field.label}
                {field.required && <span className="text-rose-600"> *</span>}
              </span>
              {field.kind === 'textarea' ? (
                <Textarea
                  className="mt-1"
                  rows={field.rows ?? 5}
                  placeholder={field.placeholder}
                  value={values[field.key] ?? ''}
                  onChange={(event) =>
                    setScalar(field.key)(event.target.value)
                  }
                />
              ) : (
                <Input
                  className="mt-1"
                  placeholder={field.placeholder}
                  value={values[field.key] ?? ''}
                  onChange={(event) =>
                    setScalar(field.key)(event.target.value)
                  }
                />
              )}
              {error && <span className="mt-1 block text-sm text-rose-600">{error}</span>}
            </label>
          );
        })}
      </div>
    </Card>
  );
}
