
export default function AssetPlaceholder({ name = 'SAP', type = 'avatar', className = '' }) {
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  if (type === 'avatar') {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200/60 text-slate-700 font-mono select-none ${className}`}>
        {initials}
      </div>
    );
  }

  return (
    <div className={`rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center ${className}`}>
      <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    </div>
  );
}