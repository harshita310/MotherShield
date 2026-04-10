import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

const RISK_ORDER = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

function getRiskBadgeClass(level) {
  if (level === 'CRITICAL') return 'bg-red-100 text-red-700 border border-red-300';
  if (level === 'HIGH')     return 'bg-orange-100 text-orange-700 border border-orange-300';
  if (level === 'MEDIUM')   return 'bg-yellow-100 text-yellow-700 border border-yellow-300';
  return 'bg-green-100 text-green-700 border border-green-300';
}

function getRiskDot(level) {
  if (level === 'CRITICAL') return 'bg-red-500';
  if (level === 'HIGH')     return 'bg-orange-500';
  if (level === 'MEDIUM')   return 'bg-yellow-500';
  return 'bg-green-500';
}

function getTrend(assessments) {
  // Group by patient name (case-insensitive), need at least 2
  const groups = {};
  assessments.forEach((a) => {
    const name = (a.vitals?.previousComplications !== undefined && a.patientName)
      ? a.patientName.toLowerCase()
      : 'unknown';
    if (!groups[name]) groups[name] = [];
    groups[name].push(a);
  });
  return groups;
}

function computeTrend(list) {
  if (list.length < 2) return null;
  const sorted = [...list].sort((a, b) => new Date(a.date) - new Date(b.date));
  const first = RISK_ORDER[sorted[0].riskLevel] ?? 1;
  const last  = RISK_ORDER[sorted[sorted.length - 1].riskLevel] ?? 1;
  if (last < first) return 'Improving';
  if (last > first) return 'Worsening';
  return 'Stable';
}

function trendIcon(trend) {
  if (trend === 'Improving') return { icon: '📉', cls: 'bg-green-100 text-green-700' };
  if (trend === 'Worsening') return { icon: '📈', cls: 'bg-red-100 text-red-700' };
  return { icon: '➡️', cls: 'bg-slate-100 text-slate-700' };
}

function arrayToCSV(data) {
  if (!data.length) return '';
  const rows = data.map((a) => ({
    id: a.id,
    date: a.date,
    riskLevel: a.riskLevel,
    patientAge: a.patientAge ?? a.vitals?.patientAge ?? '',
    systolicBP: a.vitals?.systolicBP ?? '',
    diastolicBP: a.vitals?.diastolicBP ?? '',
    hemoglobin: a.vitals?.hemoglobin ?? '',
    gestationalWeeks: a.vitals?.gestationalWeeks ?? '',
    bodyTemp: a.vitals?.bodyTemp ?? '',
    explanation: (a.riskResult?.explanation ?? '').replace(/,/g, ';'),
  }));
  const headers = Object.keys(rows[0]).join(',');
  const lines = rows.map((r) => Object.values(r).join(','));
  return [headers, ...lines].join('\n');
}

export default function PatientHistory() {
  const [assessments, setAssessments] = useState([]);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const raw = JSON.parse(localStorage.getItem('motherShieldAssessments') || '[]');
    setAssessments(raw);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return assessments;
    return assessments.filter((a) => {
      const dateStr = new Date(a.date).toLocaleDateString('en-IN').toLowerCase();
      const risk = (a.riskLevel ?? '').toLowerCase();
      return dateStr.includes(q) || risk.includes(q);
    });
  }, [assessments, search]);

  // Build name-based trend groups from all assessments (not filtered)
  const trendData = useMemo(() => {
    const byAge = {};
    assessments.forEach((a) => {
      const key = String(a.patientAge ?? a.vitals?.patientAge ?? 'unk');
      if (!byAge[key]) byAge[key] = [];
      byAge[key].push(a);
    });
    return byAge;
  }, [assessments]);

  function handleDelete(id) {
    const updated = assessments.filter((a) => a.id !== id);
    setAssessments(updated);
    localStorage.setItem('motherShieldAssessments', JSON.stringify(updated));
  }

  function handleExportCSV() {
    const csv = arrayToCSV(assessments);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MotherShield_History_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-2">
          <div>
            <h1 className="text-[26px] font-bold text-[#1A237E] flex items-center gap-2">
              <span className="text-3xl">📋</span> Patient History
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {assessments.length} past assessment{assessments.length !== 1 ? 's' : ''} stored locally
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportCSV}
              disabled={assessments.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1A237E] hover:bg-indigo-900 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              📥 Export CSV
            </button>
            <Link
              to="/intake"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C62828] hover:bg-red-700 text-white text-sm font-semibold transition"
            >
              ➕ New Assessment
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by date (e.g. 09/04/2026) or risk level (HIGH, MEDIUM…)"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1A237E]/30 text-sm"
          />
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <p className="text-5xl mb-4">🗂️</p>
            <p className="text-lg font-medium">No assessments found</p>
            <p className="text-sm mt-1">{search ? 'Try a different search term' : 'Complete a New Assessment to see history here'}</p>
          </div>
        )}

        {/* Cards */}
        <div className="space-y-4">
          {filtered.map((a) => {
            const isExpanded = expandedId === a.id;
            const dateStr = new Date(a.date).toLocaleString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            });
            const ageKey = String(a.patientAge ?? a.vitals?.patientAge ?? 'unk');
            const peerGroup = trendData[ageKey] ?? [];
            const trend = computeTrend(peerGroup);
            const { icon: trendIcon2, cls: trendCls } = trendIcon(trend);

            return (
              <div
                key={a.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all"
              >
                {/* Card Header */}
                <div className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                  {/* Left: date + vitals */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm text-slate-500 font-medium">{dateStr}</span>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getRiskBadgeClass(a.riskLevel)}`}>
                        <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${getRiskDot(a.riskLevel)}`} />
                        {a.riskLevel} RISK
                      </span>
                      {trend && peerGroup.length >= 2 && (
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${trendCls}`}>
                          {trendIcon2} {trend}
                        </span>
                      )}
                    </div>

                    {/* Key vitals summary */}
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-600">
                      {a.vitals?.patientAge   && <span>🧑 Age: <strong>{a.vitals.patientAge}</strong></span>}
                      {a.vitals?.systolicBP   && <span>💓 BP: <strong>{a.vitals.systolicBP}/{a.vitals.diastolicBP}</strong> mmHg</span>}
                      {a.vitals?.hemoglobin   && <span>🩸 Hgb: <strong>{a.vitals.hemoglobin}</strong> g/dL</span>}
                      {a.vitals?.gestationalWeeks && <span>🤰 <strong>{a.vitals.gestationalWeeks}</strong> wks</span>}
                      {a.vitals?.bodyTemp     && <span>🌡️ <strong>{a.vitals.bodyTemp}</strong>°C</span>}
                    </div>
                  </div>

                  {/* Right: action buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : a.id)}
                      className="text-sm font-semibold px-4 py-2 rounded-lg bg-[#1A237E]/10 text-[#1A237E] hover:bg-[#1A237E]/20 transition"
                    >
                      {isExpanded ? 'Hide Report ▲' : 'View Full Report ▼'}
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="text-sm font-semibold px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                      title="Delete this assessment"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Expanded Full Report */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 p-5 space-y-4 text-sm">

                    {/* AI Explanation */}
                    <div>
                      <h4 className="font-bold text-slate-700 mb-1">🤖 AI Explanation</h4>
                      <p className="text-slate-600 leading-relaxed">
                        {a.riskResult?.explanation || 'No explanation available.'}
                      </p>
                    </div>

                    {/* Immediate Actions */}
                    {a.riskResult?.immediateActions?.length > 0 && (
                      <div>
                        <h4 className="font-bold text-slate-700 mb-1">⚡ Immediate Actions</h4>
                        <ol className="list-decimal list-inside space-y-1 text-slate-600">
                          {a.riskResult.immediateActions.map((action, idx) => (
                            <li key={idx}>{action}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Complications */}
                    {a.riskResult?.complications?.length > 0 && (
                      <div>
                        <h4 className="font-bold text-slate-700 mb-2">⚠️ Complications</h4>
                        <div className="flex flex-wrap gap-2">
                          {a.riskResult.complications.map((c, idx) => (
                            <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">{c}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Nearest facilities */}
                    {a.facilities?.length > 0 && (
                      <div>
                        <h4 className="font-bold text-slate-700 mb-2">🏥 Nearest Facilities</h4>
                        <div className="space-y-1">
                          {a.facilities.slice(0, 3).map((f, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-slate-600">
                              <span className="font-medium">{f.name}</span>
                              <span className="text-slate-400">·</span>
                              <span>{f.distance} km</span>
                              {f.phone && <span className="text-blue-600">📞 {f.phone}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Raw vitals */}
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-600 font-medium">
                        Show raw vitals JSON
                      </summary>
                      <pre className="mt-2 text-xs bg-white border border-slate-200 rounded-lg p-3 overflow-auto max-h-48 text-slate-700">
                        {JSON.stringify(a.vitals, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
