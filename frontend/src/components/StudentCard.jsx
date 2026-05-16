const SKILLS = ['speaking', 'writing', 'reading', 'listening'];

function DeltaBadge({ value }) {
  const pos = value > 0;
  const neutral = value === 0;
  return (
    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
      neutral ? 'bg-slate-100 text-slate-500'
      : pos ? 'bg-emerald-100 text-emerald-700'
      : 'bg-red-100 text-red-700'
    }`}>
      {pos ? '+' : ''}{value.toFixed(2)}
    </span>
  );
}

export default function StudentCard({ student }) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 space-y-4 ${student.is_at_risk ? 'border-red-200' : 'border-slate-200'}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-slate-800">{student.name}</p>
          <p className="text-xs text-slate-400">{student.student_id} · {student.sessions_completed} sessions</p>
        </div>
        <div className="text-right space-y-1">
          {student.is_at_risk && (
            <span className="block text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">AT RISK</span>
          )}
          <span className="block text-xs text-slate-400">Exam in {student.days_until_exam}d</span>
        </div>
      </div>

      {/* Skills Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-separate border-spacing-y-1">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-slate-400">
              <th className="pb-1 font-medium">Skill</th>
              <th className="pb-1 font-medium text-center">Diagnostic</th>
              <th className="pb-1 font-medium text-center">Current</th>
              <th className="pb-1 font-medium text-center">Δ</th>
            </tr>
          </thead>
          <tbody>
            {SKILLS.map(skill => (
              <tr key={skill} className="bg-slate-50 rounded-lg">
                <td className="py-1.5 px-2 rounded-l-lg capitalize font-medium text-slate-600">{skill}</td>
                <td className="py-1.5 px-2 text-center text-slate-500">{student.diagnostic_band[skill].toFixed(1)}</td>
                <td className="py-1.5 px-2 text-center font-semibold text-slate-800">{student.current_band[skill].toFixed(1)}</td>
                <td className="py-1.5 px-2 rounded-r-lg text-center">
                  <DeltaBadge value={student.skill_deltas[skill]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer stats */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-500 pt-1 border-t border-slate-100">
        <span>Avg delta: <strong className={`${student.avg_band_delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{student.avg_band_delta >= 0 ? '+' : ''}{student.avg_band_delta.toFixed(4)}</strong></span>
        <span>Avg band: <strong className="text-slate-700">{student.avg_current_band.toFixed(2)}</strong></span>
        <span>Target: <strong className="text-slate-700">{student.target_band}</strong></span>
        <span>Inactive: <strong className={`${student.days_inactive >= 5 ? 'text-red-600' : 'text-slate-700'}`}>{student.days_inactive}d</strong></span>
        <span>Last active: <strong className="text-slate-700">{student.last_active}</strong></span>
      </div>
    </div>
  );
}
