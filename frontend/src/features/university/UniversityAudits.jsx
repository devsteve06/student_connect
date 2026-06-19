import  { useState } from 'react';

export default function UniversityAudits() {
  const [audits] = useState([
    { id: 'aud-201', student: 'Sarah Jenkins', firm: 'Apex Cloud Labs', status: 'Verified', date: 'June 02, 2026' },
    { id: 'aud-202', student: 'Alex Rivera', firm: 'Quantum Systems', status: 'Pending Review', date: 'June 05, 2026' },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-bold font-mono uppercase bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded border border-indigo-100">
          Academic Registry Matrix
        </span>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-2">Compliance & Attachment Audits</h1>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider font-mono">
              <th className="p-4">Student Node</th>
              <th className="p-4">Assigned Corporate Firm</th>
              <th className="p-4">Verification State</th>
              <th className="p-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
            {audits.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-bold text-slate-900">{item.student}</td>
                <td className="p-4 text-slate-600">{item.firm}</td>
                <td className="p-4">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                    item.status === 'Verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="p-4 text-slate-400 font-mono">{item.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}