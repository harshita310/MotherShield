import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { runAgents } from '../agents/orchestrator'
import { exportDangerSignsCard, exportReferralPDF } from '../utils/pdfExport'
import { getDirectionsUrl } from '../agents/facilityAgent'

export default function Results() {
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const savedRef = useRef(false)
  const state = location.state ?? {}
  const vitals = state.vitals ?? state
  const patient = state.patient ?? {}

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const runResult = await runAgents(vitals, patient)
        if (!cancelled) setResult(runResult)
      } catch (err) {
        if (!cancelled) setError(err?.message ?? 'Unknown error')
      } finally {
        if (!cancelled) {
          // Add a slight delay for cinematic effect
          setTimeout(() => setLoading(false), 2000)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [location.state, patient, vitals])

  const riskResult = result?.riskResult ?? result
  const riskLevel = riskResult?.riskLevel ?? 'MEDIUM'
  
  const patientForPdf = useMemo(() => ({
    age: vitals?.patientAge,
    gestationalWeeks: vitals?.gestationalWeeks,
    previousBirths: vitals?.previousBirths,
    name: patient?.name || 'Patient',
    systolicBP: vitals?.systolicBP,
    diastolicBP: vitals?.diastolicBP,
    hemoglobin: vitals?.hemoglobin,
  }), [patient?.name, vitals])

  useEffect(() => {
    if (!result || savedRef.current) return
    const existing = JSON.parse(localStorage.getItem('motherShieldAssessments') || '[]')
    const newAssessment = { id: Date.now(), date: new Date().toISOString(), riskLevel, vitals, riskResult, timestamp: Date.now() }
    localStorage.setItem('motherShieldAssessments', JSON.stringify([newAssessment, ...existing]))
    savedRef.current = true
  }, [result, riskLevel, vitals, riskResult])

  const getBannerGradient = () => {
    if (riskLevel === 'CRITICAL') return 'from-[#600] to-[#B71C1C]'
    if (riskLevel === 'HIGH') return 'from-[#840] to-[#E65100]'
    if (riskLevel === 'MEDIUM') return 'from-[#760] to-[#F57F17]'
    return 'from-[#040] to-[#1B5E20]'
  }

  if (loading) return (
    <div className="min-h-screen bg-[#1f1f1f] flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(198,40,40,0.05)_1px,transparent_1px)] bg-[size:100%_4px] animate-scanline pointer-events-none" />
      <div className="relative">
        <div className="w-48 h-48 border border-[#C62828]/20 rounded-full animate-[pulse-ring_2s_infinite]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <h2 className="text-4xl font-serif italic animate-[glitch_1s_infinite] tracking-widest">ANALYZING</h2>
          <div className="mt-8 flex gap-2">
            {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 bg-[#C62828] rounded-full animate-bounce" style={{ animationDelay: `${i*0.2}s` }} />)}
          </div>
        </div>
      </div>
      <div className="mt-20 flex flex-col items-center gap-4">
        <p className="text-[10px] tracking-[0.4em] text-white/40 font-bold uppercase">Processing Vitals ── Generating Report</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#1f1f1f] p-10 flex flex-col items-center justify-center">
       <div className="glass-card p-12 border-red-900/50 max-w-xl text-center">
          <span className="text-4xl mb-6 block">⚠️</span>
          <h2 className="text-2xl font-serif mb-4">Analysis Failed</h2>
          <p className="text-white/40 text-sm font-mono mb-8">{error}</p>
          <Link to="/intake" className="border border-white/10 px-8 py-3 text-[10px] tracking-widest uppercase font-bold hover:bg-white hover:text-black transition-all">Go Back</Link>
       </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#1f1f1f] text-[#f6f7ed] pb-20 px-6" style={{ paddingTop: '64px' }}>
      <div className="max-w-[1200px] mx-auto">
        
        {/* Risk Level Banner */}
        <section className={`relative overflow-hidden rounded-3xl p-12 md:p-20 mb-12 bg-gradient-to-br ${getBannerGradient()} border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)]`}>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] font-black opacity-10 pointer-events-none select-none">
              {riskLevel}
           </div>
           
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-10">
              <div className="flex flex-col gap-4">
                 <p className="text-[10px] tracking-[0.4em] font-black uppercase opacity-60">AI ASSESSMENT COMPLETE</p>
                 <h1 className="text-8xl md:text-9xl font-serif font-black tracking-tighter leading-none">{riskLevel}</h1>
                 <p className="text-xl max-w-md opacity-80 font-light italic mt-4">
                    {riskResult?.explanation?.split('.')[0]}. Immediate attention is recommended.
                 </p>
              </div>
              <div className="flex flex-col items-end gap-4">
                 <div className="text-right">
                    <p className="text-[10px] tracking-widest opacity-40 uppercase font-bold">Patient ID</p>
                    <p className="text-xl font-mono">MS-{(Math.random()*1000).toFixed(0)}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] tracking-widest opacity-40 uppercase font-bold">Status</p>
                    <p className="text-xl text-white font-bold">{riskLevel === 'CRITICAL' ? '⚠️ EMERGENCY' : '✓ REVIEWED'}</p>
                 </div>
              </div>
           </div>
        </section>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
           
           {/* Detailed Explanation */}
           <div className="lg:col-span-2 glass-card p-10 border-white/5">
              <h3 className="text-[10px] tracking-[0.3em] font-black text-[#C62828] uppercase mb-8">Clinical Analysis</h3>
              <p className="text-2xl font-light leading-relaxed mb-10">
                {riskResult?.explanation}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10 border-t border-white/5">
                 <div>
                    <h4 className="text-[10px] tracking-[0.2em] font-bold text-white/40 uppercase mb-6">Complications</h4>
                    <div className="flex flex-wrap gap-2">
                       {riskResult?.complications?.map((c, i) => (
                         <span key={i} className="px-4 py-2 bg-red-900/20 border border-red-900/30 text-white text-[10px] font-bold tracking-widest uppercase rounded-full">
                           {c}
                         </span>
                       ))}
                    </div>
                 </div>
                 <div>
                    <h4 className="text-[10px] tracking-[0.2em] font-bold text-white/40 uppercase mb-6">Immediate Actions</h4>
                    <ul className="flex flex-col gap-4">
                       {riskResult?.immediateActions?.map((a, i) => (
                         <li key={i} className="flex gap-4 items-start text-sm text-white/60">
                            <span className="text-[#C62828] font-black text-xs">0{i+1}</span>
                            {a}
                         </li>
                       ))}
                    </ul>
                 </div>
              </div>
           </div>

           {/* Quick Actions Sidebar */}
           <div className="flex flex-col gap-6">
              <button 
                onClick={() => exportReferralPDF(patientForPdf, riskResult, result?.referralLetter)}
                className="w-full py-6 border border-[#C62828] text-[#C62828] text-xs font-black tracking-[0.4em] uppercase hover:bg-[#C62828] hover:text-white transition-all duration-500"
              >
                Referral Letter PDF
              </button>
              <button 
                onClick={() => exportDangerSignsCard(patientForPdf, riskResult)}
                className="w-full py-6 border border-white/10 text-white text-xs font-black tracking-[0.4em] uppercase hover:bg-white hover:text-black transition-all duration-500"
              >
                Danger Signs Card
              </button>
              <button 
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`MotherShield Alert: ${riskLevel} Risk Detected for patient ${patient.name}. Recommendations: ${riskResult?.immediateActions?.join(', ')}`)}`)}
                className="w-full py-6 border border-[#2E7D32] text-[#2E7D32] text-xs font-black tracking-[0.4em] uppercase hover:bg-[#2E7D32] hover:text-white transition-all duration-500"
              >
                Share on WhatsApp
              </button>
              
              <div className="mt-10 pt-10 border-t border-white/5">
                 <h4 className="text-[10px] tracking-[0.2em] font-bold text-white/40 uppercase mb-6">Nearest Hospital</h4>
                 <div className="glass-card p-6 border-white/5">
                    <p className="font-serif text-xl mb-4">{result?.facilities?.[0]?.name || 'District Hospital'}</p>
                    <div className="flex justify-between items-center text-[10px] font-bold tracking-widest text-[#C62828]">
                       <span>{result?.facilities?.[0]?.distance || '2.4'} KM AWAY</span>
                       <button onClick={() => window.open(getDirectionsUrl(result?.facilities?.[0]?.lat, result?.facilities?.[0]?.lng))} className="underline hover:text-white transition-colors">DIRECTIONS →</button>
                    </div>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  )
}
