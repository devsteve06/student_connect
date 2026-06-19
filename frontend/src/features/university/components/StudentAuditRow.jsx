import Button from '../../../components/common/Button';

export default function StudentAuditRow({ student }) {
  return (
    <tr className="hover:bg-[#F7F6F3]/70 transition-colors duration-150 border-b border-[#F0EDE8] last:border-0 text-sm group">
      <td className="px-6 py-4 font-bold text-[#0D1B2A] group-hover:text-[#1E4D8C] transition-colors duration-150 font-['ui-sans-serif',_system-ui,_sans-serif]">
        {student.name}
      </td>
      <td className="px-6 py-4 text-slate-400 tabular-nums font-['ui-sans-serif',_system-ui,_sans-serif]">
        {student.regNumber}
      </td>
      <td className="px-6 py-4">
        {student.assignedFirm ? (
          <div>
            <div className="font-semibold text-[#0D1B2A] text-xs font-['ui-sans-serif',_system-ui,_sans-serif]">{student.assignedFirm}</div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-['ui-sans-serif',_system-ui,_sans-serif]">{student.role}</div>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold text-[9px] uppercase tracking-[0.14em] bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 font-['ui-sans-serif',_system-ui,_sans-serif]">
            <span className="w-1 h-1 rounded-full bg-amber-400" />
            Unattached
          </span>
        )}
      </td>
      <td className="px-6 py-4 font-['ui-sans-serif',_system-ui,_sans-serif]">
        {student.academicAdvisor ? (
          <span className="text-slate-500 text-xs">{student.academicAdvisor}</span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400 bg-[#F7F6F3] border border-[#E2DDD8] px-2.5 py-1 rounded-full">
            <span className="w-1 h-1 rounded-full bg-[#E2DDD8]" />
            Unassigned
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-right">
        <Button
          variant="outline"
          size="sm"
          className="text-[11px] font-semibold border border-[#E2DDD8] text-slate-500 hover:border-[#1E4D8C] hover:text-[#1E4D8C] bg-white rounded-2xl px-3.5 py-1.5 transition-all duration-150 font-['ui-sans-serif',_system-ui,_sans-serif]"
        >
          View Dossier
        </Button>
      </td>
    </tr>
  );
}
