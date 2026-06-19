import Button from '../../../components/common/Button';

export default function ApplicantRow({ applicant }) {
  return (
    <tr className="hover:bg-slate-50/70 transition-colors border-b border-portal-border last:border-0">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-firm-light text-firm-primary font-bold text-xs flex items-center justify-center">
            {applicant.studentName.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="text-sm font-semibold text-portal-text">{applicant.studentName}</div>
            <div className="text-xs text-portal-muted">{applicant.university}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-portal-text font-medium">
        {applicant.targetRole}
      </td>
      <td className="px-6 py-4 text-xs text-portal-muted font-medium">
        {applicant.appliedDate}
      </td>
      <td className="px-6 py-4">
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          {applicant.status}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" className="text-xs">Review Base CV</Button>
          <Button variant="primary" size="sm" className="bg-firm-primary hover:bg-emerald-700 text-xs text-white border-0">Process</Button>
        </div>
      </td>
    </tr>
  );
}