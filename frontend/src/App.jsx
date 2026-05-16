import { useState } from 'react';
import Dashboard from './components/Dashboard';

const API_URL = 'https://progress-report-83ba.onrender.com/api/batch-report';

export default function App() {
  const [batchId, setBatchId] = useState('batch-kerala-2026');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleGenerate(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_id: batchId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unknown error');
      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">TC</div>
        <span className="font-semibold text-slate-800 text-sm">TestCrack</span>
        <span className="text-slate-300">|</span>
        <span className="text-slate-500 text-sm">Batch Progress Reporter</span>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Generate Batch Report</h2>
          <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3">
            <input
              id="batch-id-input"
              type="text"
              value={batchId}
              onChange={e => setBatchId(e.target.value)}
              placeholder="Enter batch_id"
              className="flex-1 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50"
              required
            />
            <button
              id="generate-btn"
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors whitespace-nowrap"
            >
              {loading ? 'Generating…' : 'Generate Report'}
            </button>
          </form>
          <p className="mt-3 text-xs text-slate-400">
            Calls <code className="bg-slate-100 px-1 rounded">POST /api/batch-report</code> · Backend must be running on port 3001
          </p>
        </div>

        {loading && (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-sm">
            <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-slate-500">Computing stats and generating AI narrative…</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {report && <Dashboard report={report} />}

      </main>
    </div>
  );
}
