import { useState } from 'react';
import {
  exportVehicleReport,
  exportIssueReport,
  exportTechnicianReport,
  exportStatisticsReport,
  exportHistoryReport,
} from '../lib/export';

// ─── Export Reports Page (Admin) ───────────────────────────────────────────────
// Generates CSV downloads for all major data sets.

interface Props { onBack: () => void; }

interface ReportDef {
  key:         string;
  title:       string;
  description: string;
  icon:        string;
  fn:          () => Promise<void>;
}

const REPORTS: ReportDef[] = [
  {
    key:         'vehicles',
    title:       'Vehicle Report',
    description: 'All vehicles: STK ID, VIN, model, stage, dates, dealer',
    icon:        'directions_car',
    fn:          exportVehicleReport,
  },
  {
    key:         'issues',
    title:       'Issue Report',
    description: 'All alerts and repairs: status, responsible person, contact',
    icon:        'report_problem',
    fn:          exportIssueReport,
  },
  {
    key:         'technicians',
    title:       'Technician Report',
    description: 'All technicians: role, assigned vehicles, activity count',
    icon:        'engineering',
    fn:          exportTechnicianReport,
  },
  {
    key:         'statistics',
    title:       'Statistics Report',
    description: 'Fleet totals by stage, average days per stage, throughput',
    icon:        'bar_chart',
    fn:          exportStatisticsReport,
  },
  {
    key:         'history',
    title:       'History Report',
    description: 'Full vehicle history log: actions, stage transitions, timestamps',
    icon:        'history',
    fn:          exportHistoryReport,
  },
];

export function ExportPage({ onBack }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);

  async function run(report: ReportDef) {
    setLoading(report.key);
    setError(null);
    setSuccess(null);
    try {
      await report.fn();
      setSuccess(report.key);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`${report.title} failed: ${String(err)}`);
    }
    setLoading(null);
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-[#1A1A2E]">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-[#1A1A2E]">Export Reports</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3 pb-8">
        <p className="text-xs text-[#8A8FA3]">
          All reports are exported as CSV files and downloaded directly to your device.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {REPORTS.map(report => (
          <div key={report.key} className="bg-white rounded-[20px] p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[#D0112B] text-xl">{report.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#1A1A2E]">{report.title}</p>
              <p className="text-xs text-[#8A8FA3] mt-0.5 leading-relaxed">{report.description}</p>
            </div>
            <button
              onClick={() => run(report)}
              disabled={loading === report.key}
              className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full transition-all ${
                success === report.key
                  ? 'bg-green-100 text-green-700'
                  : 'bg-[#D0112B] text-white disabled:opacity-50'
              }`}
            >
              {loading === report.key ? (
                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
              ) : success === report.key ? (
                <><span className="material-symbols-outlined text-base">check</span> Done</>
              ) : (
                <><span className="material-symbols-outlined text-base">download</span> Export</>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
