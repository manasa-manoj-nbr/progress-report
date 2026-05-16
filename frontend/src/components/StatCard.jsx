export default function StatCard({ label, value, sub, highlight }) {
  return (
    <div className={`bg-white rounded-xl border p-5 shadow-sm flex flex-col gap-1 ${highlight ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200'}`}>
      <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</span>
      <span className={`text-3xl font-bold ${highlight ? 'text-indigo-700' : 'text-slate-800'}`}>{value}</span>
      {sub && <span className="text-xs text-slate-500">{sub}</span>}
    </div>
  );
}
