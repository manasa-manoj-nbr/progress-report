import StatCard from './StatCard';
import AtRiskCard from './AtRiskCard';
import StudentCard from './StudentCard';

export default function Dashboard({ report }) {
  const { batch_id, report_date, summary_stats: s, at_risk_students, ai_narrative, student_summaries } = report;

  return (
    <div className="space-y-8">

      {/* Report Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Batch Report</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{batch_id}</span>
            &nbsp;·&nbsp;Generated on {report_date}
          </p>
        </div>
        <span className="self-start sm:self-auto text-xs font-semibold uppercase tracking-widest bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full">
          IELTS
        </span>
      </div>

      {/* Summary Stats */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Summary Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total Students"      value={s.total_students} />
          <StatCard label="Active This Week"    value={s.active_this_week} sub={`of ${s.total_students}`} />
          <StatCard label="At Risk"             value={s.at_risk} highlight={s.at_risk > 0} />
          <StatCard label="Most Improved"       value={s.most_improved_student} sub={`+${s.most_improved_delta} avg`} />
          <StatCard label="Most Improved Δ"     value={`+${s.most_improved_delta}`} />
          <StatCard label="Batch Avg Δ"         value={s.batch_average_improvement >= 0 ? `+${s.batch_average_improvement}` : s.batch_average_improvement} />
        </div>
      </section>

      {/* AI Narrative */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">AI Narrative</h2>
        <div className="bg-white border border-indigo-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Gemini AI · 3-sentence summary</span>
            <span className="text-xs text-slate-400">Generated from pre-computed stats only</span>
          </div>
          <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap">{ai_narrative}</p>
        </div>
      </section>

      {/* At-Risk Students */}
      {at_risk_students.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
            At-Risk Students
            <span className="ml-2 bg-red-100 text-red-700 px-2 py-0.5 rounded-full normal-case font-semibold">{at_risk_students.length}</span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {at_risk_students.map(s => <AtRiskCard key={s.student_id} student={s} />)}
          </div>
        </section>
      )}

      {/* Student Summaries */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">All Students</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {student_summaries.map(s => <StudentCard key={s.student_id} student={s} />)}
        </div>
      </section>

      {/* Raw JSON */}
      <section>
        <details className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <summary className="px-5 py-3 cursor-pointer text-xs font-semibold uppercase tracking-widest text-slate-500 hover:text-slate-800 transition select-none">
            Full JSON Response
          </summary>
          <pre className="px-5 pb-5 text-xs text-slate-600 overflow-x-auto leading-relaxed">
            {JSON.stringify(report, null, 2)}
          </pre>
        </details>
      </section>

    </div>
  );
}
