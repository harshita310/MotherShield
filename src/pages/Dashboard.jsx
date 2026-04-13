import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [assessments, setAssessments] = useState([]);
  const [followUps, setFollowUps] = useState([]);

  useEffect(() => {
    document.title = 'MotherShield — Dashboard';
    const data = JSON.parse(localStorage.getItem('motherShieldAssessments') || '[]');
    const fups = JSON.parse(localStorage.getItem('motherShieldFollowUps') || '[]');
    setAssessments(data);
    setFollowUps(fups);
  }, []);

  const counts = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const c = { total: assessments.length, critical: 0, referred: 0, pending: 0, LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };

    assessments.forEach((item) => {
      const d = new Date(item.date);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        if (item.riskLevel === 'CRITICAL') c.critical += 1;
      }
      if (item.riskLevel === 'HIGH' || item.riskLevel === 'CRITICAL') c.referred += 1;
      if (item.riskLevel) c[item.riskLevel] = (c[item.riskLevel] ?? 0) + 1;
    });

    c.pending = followUps.filter(f => !f.completed && new Date(f.followUpDate) < now).length;
    return c;
  }, [assessments, followUps]);

  const bars = useMemo(() => [
    { label: 'LOW', value: counts.LOW, color: '#1B5E20' },
    { label: 'MEDIUM', value: counts.MEDIUM, color: '#F59E0B' },
    { label: 'HIGH', value: counts.HIGH, color: '#EA580C' },
    { label: 'CRITICAL', value: counts.CRITICAL, color: '#C62828' },
  ], [counts]);

  const maxBar = useMemo(() => Math.max(...bars.map(b => b.value), 1), [bars]);

  return (
    <div className="min-h-screen bg-[#1f1f1f] text-[#f6f7ed] pb-20 px-6" style={{ paddingTop: '64px' }}>
      <div className="max-w-[1400px] mx-auto">
        <header className="mb-12 animate-fadeUp">
          <p className="text-[#C62828] text-[10px] tracking-[0.3em] font-black uppercase mb-4">Admin Console</p>
          <h1 className="text-6xl font-serif">Health Worker Dashboard</h1>
        </header>

        {assessments.length === 0 ? (
          <div className="glass-card p-20 text-center animate-fadeUp">
            <p className="text-white/20 text-sm tracking-widest uppercase font-bold mb-8">No medical history found</p>
            <Link to="/intake" className="border border-[#C62828] text-[#C62828] px-10 py-4 text-[10px] tracking-widest uppercase font-bold hover:bg-[#C62828] hover:text-white transition-all">Start Assessment</Link>
          </div>
        ) : (
          <div className="space-y-12 animate-fadeUp" style={{ animationDelay: '0.1s' }}>
            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Assessments', value: counts.total },
                { label: 'Critical Cases', value: counts.critical, highlight: true },
                { label: 'Referrals Sent', value: counts.referred },
                { label: 'Pending Follow-ups', value: counts.pending }
              ].map((stat, i) => (
                <div key={i} className="glass-card p-8 border-white/5 relative overflow-hidden group">
                  {stat.highlight && <div className="absolute top-0 right-0 w-16 h-16 bg-[#C62828] blur-3xl opacity-20" />}
                  <p className="text-[10px] tracking-widest font-black text-white/40 uppercase mb-4">{stat.label}</p>
                  <p className={`text-5xl font-serif ${stat.highlight ? 'text-[#C62828]' : 'text-white'}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Distribution Chart */}
              <div className="glass-card p-10 border-white/5 lg:col-span-1">
                <h3 className="text-[10px] tracking-[0.2em] font-black text-white/40 uppercase mb-8">Risk Distribution</h3>
                <div className="flex items-end justify-between h-48 gap-4 px-2">
                  {bars.map((bar, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-4">
                      <div 
                        className="w-full rounded-t-sm transition-all duration-1000 ease-out"
                        style={{ 
                          height: `${(bar.value / maxBar) * 100}%`, 
                          backgroundColor: bar.color,
                          boxShadow: `0 0 20px ${bar.color}44`
                        }}
                      />
                      <span className="text-[9px] font-black opacity-40">{bar.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Patient Table */}
              <div className="glass-card p-10 border-white/5 lg:col-span-2 overflow-hidden">
                <h3 className="text-[10px] tracking-[0.2em] font-black text-white/40 uppercase mb-8">Recent History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-white/5">
                        <th className="pb-4 text-[9px] font-black tracking-widest text-white/20 uppercase">Date</th>
                        <th className="pb-4 text-[9px] font-black tracking-widest text-white/20 uppercase">Risk</th>
                        <th className="pb-4 text-[9px] font-black tracking-widest text-white/20 uppercase">Vitals</th>
                        <th className="pb-4 text-[9px] font-black tracking-widest text-white/20 uppercase text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {assessments.slice(0, 8).map((item, i) => (
                        <tr key={i} className="group">
                          <td className="py-6 text-xs text-white/60 font-mono">{new Date(item.date).toLocaleDateString()}</td>
                          <td className="py-6">
                            <span className={`text-[10px] font-black tracking-tighter ${
                              item.riskLevel === 'CRITICAL' ? 'text-[#C62828]' : 
                              item.riskLevel === 'HIGH' ? 'text-[#EA580C]' : 
                              item.riskLevel === 'MEDIUM' ? 'text-[#F59E0B]' : 'text-[#1B5E20]'
                            }`}>
                              {item.riskLevel}
                            </span>
                          </td>
                          <td className="py-6 text-xs text-white/40">
                             BP {item.vitals?.systolicBP}/{item.vitals?.diastolicBP} • HB {item.vitals?.hemoglobin}
                          </td>
                          <td className="py-6 text-right">
                             <div className="w-1.5 h-1.5 rounded-full bg-green-500 ml-auto" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
