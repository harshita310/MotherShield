import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

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
      const dateStr = new Date(a.date).toLocaleDateString().toLowerCase();
      const risk = (a.riskLevel ?? '').toLowerCase();
      return dateStr.includes(q) || risk.includes(q);
    });
  }, [assessments, search]);

  function handleDelete(id) {
    const updated = assessments.filter((a) => a.id !== id);
    setAssessments(updated);
    localStorage.setItem('motherShieldAssessments', JSON.stringify(updated));
  }

  return (
    <div className="min-h-screen bg-[#1f1f1f] text-[#f6f7ed] pt-24 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        
        <header className="mb-12 flex flex-col md:flex-row justify-between items-end gap-8 animate-fadeUp">
          <div>
            <p className="text-[#C62828] text-[10px] tracking-[0.3em] font-black uppercase mb-4">ARCHIVES</p>
            <h1 className="text-6xl font-serif">Patient History</h1>
          </div>
          <Link
            to="/intake"
            className="border border-[#C62828] text-[#C62828] px-10 py-4 text-[10px] tracking-widest uppercase font-bold hover:bg-[#C62828] hover:text-white transition-all shadow-[0_0_20px_rgba(198,40,40,0.1)]"
          >
            New Assessment
          </Link>
        </header>

        {/* Search */}
        <div className="relative mb-12 animate-fadeUp" style={{ animationDelay: '0.1s' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by date or risk level..."
            className="w-full bg-[#2a2a2a] border border-white/5 px-6 py-5 text-white text-sm focus:outline-none focus:border-[#C62828] transition-all"
          />
          <span className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20">🔍</span>
        </div>

        {filtered.length === 0 ? (
          <div className="glass-card p-20 text-center animate-fadeUp">
            <p className="text-white/20 text-sm tracking-widest uppercase font-bold">No matching records</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filtered.map((a, i) => (
              <div 
                key={a.id} 
                className="glass-card border-white/5 overflow-hidden animate-fadeUp group"
                style={{ animationDelay: `${0.2 + i * 0.05}s` }}
              >
                <div 
                  className="p-8 flex flex-col md:flex-row justify-between items-center gap-8 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                >
                  <div className="flex flex-col md:flex-row items-center gap-10 flex-1">
                    <div className="text-left w-32">
                      <p className="text-[10px] tracking-widest font-black text-white/20 uppercase mb-1">Date</p>
                      <p className="text-xs font-mono">{new Date(a.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-left w-32">
                      <p className="text-[10px] tracking-widest font-black text-white/20 uppercase mb-1">Risk Level</p>
                      <p className={`text-xs font-black tracking-widest uppercase ${
                        a.riskLevel === 'CRITICAL' ? 'text-[#C62828]' : 'text-white/60'
                      }`}>{a.riskLevel}</p>
                    </div>
                    <div className="text-left flex-1 border-l border-white/5 pl-10 hidden lg:block">
                      <p className="text-[10px] tracking-widest font-black text-white/20 uppercase mb-1">Vitals Summary</p>
                      <p className="text-xs text-white/40 italic truncate max-w-sm">
                        BP {a.vitals?.systolicBP}/{a.vitals?.diastolicBP} • HB {a.vitals?.hemoglobin} • AGE {a.vitals?.patientAge}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button 
                      className="text-[10px] tracking-widest font-black uppercase text-white/40 hover:text-white transition-colors"
                    >
                      {expandedId === a.id ? 'Close' : 'View report'}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-900/20 text-white/20 hover:text-[#C62828] transition-all"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {expandedId === a.id && (
                  <div className="px-8 pb-8 animate-fadeIn">
                    <div className="pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div>
                        <h4 className="text-[10px] tracking-[0.2em] font-black text-[#C62828] uppercase mb-4">Patient Details</h4>
                        <div className="space-y-4 text-xs text-white/60 leading-relaxed">
                          <p>The patient was assessed on {new Date(a.date).toLocaleString()}. The AI system identified a <strong>{a.riskLevel}</strong> risk profile based on clinical markers.</p>
                          <div className="bg-white/5 p-4 rounded-sm font-mono text-[11px] grid grid-cols-2 gap-4">
                             <div>SYSTOLIC: {a.vitals?.systolicBP}</div>
                             <div>DIASTOLIC: {a.vitals?.diastolicBP}</div>
                             <div>HEMOGLOBIN: {a.vitals?.hemoglobin}</div>
                             <div>TEMP: {a.vitals?.bodyTemp}</div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-[10px] tracking-[0.2em] font-black text-[#C62828] uppercase mb-4">Clinical Notes</h4>
                        <p className="text-xs text-white/40 leading-relaxed italic">
                          {a.riskResult?.explanation || 'No detailed analysis available for this record.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
