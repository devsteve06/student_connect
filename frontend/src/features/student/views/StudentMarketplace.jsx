import { useState, useEffect } from 'react';
import Button from '../../../components/common/Button';
import AssetPlaceholder from '../../../components/common/assetPlaceholder';
import { studentService } from '../../../service/studentService';

export default function StudentMarketplace() {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);

  useEffect(() => {
    const fetchMarketplace = async () => {
      try {
        const data = await studentService.getPlacements();
        setPlacements(data || []);
      } catch (err) {
        console.error("Marketplace fetch failure:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMarketplace();
  }, []);

  const handleApply = async (placement) => {
    setSubmittingId(placement.id);
    const payload = {
      studentId: "std-01",
      companyName: placement.company,
      role: placement.role,
      appliedDate: new Date().toISOString().split('T')[0],
      status: "Pending Review"
    };

    try {
      await studentService.applyForPlacement(payload);
      alert(`Application payload dispatched successfully for ${placement.role}.`);
    } catch (err) {
      console.error("Failed to execute application transaction:", err);
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-xs font-bold text-slate-400 font-mono animate-pulse uppercase tracking-widest">
        Syncing market deployment tracks...
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="border-b border-slate-100 pb-6">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-100 font-mono">
          Global Nodes Available
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-3">Attachment Marketplace</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {placements.map((job) => (
          <div key={job.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md flex flex-col justify-between transition-all group">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <AssetPlaceholder type="avatar" name={job.company} className="h-10 w-10 text-xs font-bold" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{job.role}</h3>
                    <p className="text-xs font-semibold text-slate-400">{job.company}</p>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-100">
                  {job.duration || '3 Months'}
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-3">
                {job.description || "Incorporate into core infrastructure teams running secure operations pipelines and active product sprints."}
              </p>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {(job.tags || ["Enterprise", "Security", "REST APIs"]).map((tag, idx) => (
                  <span key={idx} className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-100">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-5 mt-6 border-t border-slate-50 flex items-center justify-between">
              <div>
                <span className="block text-[9px] font-bold uppercase text-slate-400 tracking-wider font-mono">Deployment</span>
                <span className="text-xs font-bold text-slate-700">{job.location || "Nairobi, KE"}</span>
              </div>
              
              <Button
                onClick={() => handleApply(job)}
                disabled={submittingId === job.id}
                className="h-9 px-4 rounded-xl text-[11px]"
              >
                {submittingId === job.id ? 'Casting...' : 'Transmit Pitch'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}