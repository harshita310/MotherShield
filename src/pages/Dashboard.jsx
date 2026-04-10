// Updated: Phase 2 complete
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [assessments, setAssessments] = useState([]);
  const [followUps, setFollowUps] = useState([]);

  useEffect(() => {
    document.title = 'MotherShield — Dashboard';
    const data   = JSON.parse(localStorage.getItem('motherShieldAssessments') || '[]');
    const fups   = JSON.parse(localStorage.getItem('motherShieldFollowUps')   || '[]');
    setAssessments(data);
    setFollowUps(fups);
  }, []);

  // ── All stats memoised — won't recalculate on unrelated renders ──
  const counts = useMemo(() => {
    const now          = new Date();
    const currentMonth = now.getMonth();
    const currentYear  = now.getFullYear();

    const c = { total: assessments.length, critical: 0, referred: 0, pending: 0, LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };

    assessments.forEach((item) => {
      const d = new Date(item.date);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        if (item.riskLevel === 'CRITICAL') c.critical += 1;
      }
      if (item.riskLevel === 'HIGH' || item.riskLevel === 'CRITICAL') c.referred += 1;
      if (item.riskLevel) c[item.riskLevel] = (c[item.riskLevel] ?? 0) + 1;
    });

    c.pending = followUps.filter(
      (f) => !f.completed && new Date(f.followUpDate) < now
    ).length;

    return c;
  }, [assessments, followUps]);

  const today = useMemo(() =>
    new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  , []);

  const bars = useMemo(() => [
    { label: 'LOW',      value: counts.LOW,      color: '#2E7D32' },
    { label: 'MEDIUM',   value: counts.MEDIUM,   color: '#F59E0B' },
    { label: 'HIGH',     value: counts.HIGH,      color: '#EA580C' },
    { label: 'CRITICAL', value: counts.CRITICAL,  color: '#C62828' },
  ], [counts]);

  const maxBar = useMemo(() => Math.max(...bars.map((b) => b.value), 1), [bars]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
          <div>
            <h1 className="text-3xl font-bold text-[#1A237E]">Health Worker Dashboard</h1>
            <p className="text-slate-500">{today}</p>
          </div>
        </header>

        {assessments.length === 0 ? (
          <section className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-4xl mb-4">😢</p>
            <p className="text-slate-600 mb-6 text-lg">No assessments yet</p>
            <Link
              to="/intake"
              className="inline-block bg-[#C62828] hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg"
            >
              Start First Assessment
            </Link>
          </section>
        ) : (
          <>
            {/* Metric Cards */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-6 border-t-4 border-[#C62828]">
                <p className="text-slate-500 text-sm">Total Assessments</p>
                <p className="text-3xl font-bold text-[#1A237E] mt-2">{counts.total}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border-t-4 border-[#C62828]">
                <p className="text-slate-500 text-sm">Critical This Month</p>
                <p className="text-3xl font-bold text-[#C62828] mt-2">{counts.critical}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border-t-4 border-[#C62828]">
                <p className="text-slate-500 text-sm">Women Referred</p>
                <p className="text-3xl font-bold text-[#1A237E] mt-2">{counts.referred}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border-t-4 border-[#C62828]">
                <p className="text-slate-500 text-sm">Pending Follow-ups</p>
                <p className="text-3xl font-bold text-[#1A237E] mt-2">{counts.pending}</p>
              </div>
            </section>

            {/* Risk Distribution Chart */}
            <section className="bg-white rounded-lg shadow-sm p-5">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Risk Level Distribution</h2>
              <svg viewBox="0 0 500 220" className="w-full h-[220px]">
                {bars.map((bar, idx) => {
                  const barHeight = (bar.value / maxBar) * 140;
                  const x = 40 + idx * 110;
                  const y = 180 - barHeight;
                  return (
                    <g key={bar.label}>
                      <rect x={x} y={y} width="60" height={barHeight} fill={bar.color} rx="8" />
                      <text x={x + 30} y={195} textAnchor="middle" fontSize="12" fill="#334155">
                        {bar.label}
                      </text>
                      <text x={x + 30} y={y - 8} textAnchor="middle" fontSize="12" fill="#0F172A">
                        {bar.value}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </section>

            {/* Recent Assessments */}
            <section className="bg-white rounded-lg shadow-sm p-5">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Patient History</h2>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-slate-200">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Age</th>
                      <th className="py-3 px-4">Risk Level</th>
                      <th className="py-3 px-4">Vitals Summary</th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessments.slice(0, 12).map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="py-3 px-4">{new Date(item.date).toLocaleDateString()}</td>
                        <td className="py-3 px-4">{item.patientAge || 'N/A'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            item.riskLevel === 'CRITICAL' || item.riskLevel === 'HIGH'
                              ? 'bg-red-100 text-red-700'
                              : item.riskLevel === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {item.riskLevel}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          BP {item.vitals?.systolicBP ?? item.systolicBP}/{item.vitals?.diastolicBP ?? item.diastolicBP}, Hb {item.vitals?.hemoglobin ?? item.hemoglobin}
                        </td>
                        <td className="py-3 px-4 text-[#1A237E]">Stored</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
