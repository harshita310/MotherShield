import React, { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import { callAI } from '../hooks/useAI'

function cleanAndParseJSON(raw) {
  try {
    // Remove markdown code blocks
    let cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    
    // Find first { and last } to extract just the JSON object
    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No JSON object found in response')
    }
    
    cleaned = cleaned.substring(firstBrace, lastBrace + 1)
    
    return JSON.parse(cleaned)
  } catch (e) {
    console.error('JSON parse failed:', e)
    console.error('Raw response was:', raw)
    throw e
  }
}

async function fetchWeekGuidance(weeks) {
  const prompt = `Patient is ${weeks} weeks pregnant. Provide week-specific maternal health guidance for an ASHA worker in India. Return ONLY valid JSON (no markdown, no code blocks):
{"trimester":"First/Second/Third","babySize":"brief description of baby size/development this week","keyDangerSigns":["sign1","sign2","sign3"],"recommendedChecks":["check1","check2","check3"],"nextVisitWeeks":number,"specialNotes":"1-2 sentences of specific advice for this week"}
IMPORTANT: Respond with ONLY the raw JSON object. No markdown. No code blocks. No backticks. No explanation. Start your response with { and end with }`

  let raw = await callAI("You are a helpful maternal health assistant.", prompt)
  return cleanAndParseJSON(raw)
}

function getTrimesterInfo(week) {
  if (week <= 13) return { name: 'First Trimester', range: '1–13', color: '#7C3AED', light: '#EDE9FE', pct: (week / 13) * 33.3 }
  if (week <= 27) return { name: 'Second Trimester', range: '14–27', color: '#0891B2', light: '#CFFAFE', pct: 33.3 + ((week - 13) / 14) * 33.3 }
  return { name: 'Third Trimester', range: '28–40', color: '#DC2626', light: '#FEE2E2', pct: 66.6 + ((week - 27) / 13) * 33.4 }
}

export default function Timeline() {
  const location = useLocation()
  const { t } = useLanguage()

  // Pre-fill from last assessment or navigation state
  const prefill = location.state?.gestationalWeeks ?? (() => {
    try {
      const assessments = JSON.parse(localStorage.getItem('motherShieldAssessments') || '[]')
      return assessments[0]?.vitals?.gestationalWeeks ?? ''
    } catch { return '' }
  })()

  const [inputWeeks, setInputWeeks] = useState(String(prefill || ''))
  const [currentWeek, setCurrentWeek] = useState(prefill ? Number(prefill) : null)
  const [guidance, setGuidance] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    document.title = 'MotherShield — Pregnancy Timeline'
  }, [])

  useEffect(() => {
    if (!currentWeek || currentWeek < 1 || currentWeek > 42) return
    setLoading(true)
    setError(null)
    setGuidance(null)
    fetchWeekGuidance(currentWeek)
      .then(setGuidance)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [currentWeek])

  function handleSubmit(e) {
    e.preventDefault()
    const w = parseInt(inputWeeks, 10)
    if (!w || w < 1 || w > 42) return
    setCurrentWeek(w)
  }

  function navigate(delta) {
    const next = Math.max(1, Math.min(42, currentWeek + delta))
    setCurrentWeek(next)
    setInputWeeks(String(next))
  }

  const trimInfo = currentWeek ? getTrimesterInfo(currentWeek) : null

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="pt-2">
          <h1 className="text-[26px] font-bold text-[#1A237E] flex items-center gap-2">
            <span className="text-3xl">🤰</span> {t('timelineTitle')}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{t('timelineSubtitle')}</p>
        </div>

        {/* Week input */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            {t('enterWeeks')}
          </label>
          <div className="flex gap-3">
            <input
              type="number"
              min="1"
              max="42"
              value={inputWeeks}
              onChange={(e) => setInputWeeks(e.target.value)}
              placeholder="e.g. 28"
              className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-lg font-bold text-[#1A237E] focus:outline-none focus:ring-2 focus:ring-[#1A237E]/30"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-[#1A237E] hover:bg-indigo-900 text-white font-semibold rounded-xl transition"
            >
              {t('viewTimeline')}
            </button>
          </div>
        </form>

        {/* Visual Timeline Bar */}
        {currentWeek && trimInfo && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span style={{ color: '#7C3AED' }}>T1 {t('weeksRange')}</span>
              <span style={{ color: '#0891B2' }}>T2 {t('weeksRange2')}</span>
              <span style={{ color: '#DC2626' }}>T3 {t('weeksRange3')}</span>
            </div>

            {/* Track */}
            <div className="relative h-6 rounded-full overflow-hidden flex">
              <div className="h-full bg-purple-200" style={{ width: '33.3%' }} />
              <div className="h-full bg-cyan-200" style={{ width: '33.3%' }} />
              <div className="h-full bg-red-200" style={{ width: '33.4%' }} />
              {/* Marker */}
              <div
                className="absolute top-0 h-full w-1 rounded"
                style={{
                  left: `${Math.min(trimInfo.pct, 99)}%`,
                  backgroundColor: trimInfo.color,
                  boxShadow: `0 0 6px ${trimInfo.color}`,
                }}
              />
            </div>

            {/* Current week label */}
            <div className="mt-3 flex items-center gap-3">
              <span
                className="text-sm font-bold px-3 py-1 rounded-full"
                style={{ backgroundColor: trimInfo.light, color: trimInfo.color }}
              >
                {t('week')} {currentWeek}
              </span>
              <span className="text-sm text-slate-600 font-medium">{trimInfo.name}</span>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => navigate(-1)}
                disabled={currentWeek <= 1}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 transition text-sm"
              >
                {t('prevWeek')}
              </button>
              <button
                onClick={() => navigate(1)}
                disabled={currentWeek >= 42}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 transition text-sm"
              >
                {t('nextWeek')}
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-[#1A237E]" />
            <p className="text-slate-600 font-medium">{t('loadingTimeline')}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-700 text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Guidance Cards */}
        {guidance && !loading && (
          <div className="space-y-4">
            {/* Baby Development */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-bold text-[#1A237E] flex items-center gap-2 mb-3">
                <span className="text-2xl">👶</span> {t('babySize')}
              </h3>
              <p className="text-slate-700 leading-relaxed">{guidance.babySize}</p>
            </div>

            {/* Danger Signs */}
            {guidance.keyDangerSigns?.length > 0 && (
              <div className="bg-red-50 rounded-2xl border border-red-100 p-6">
                <h3 className="font-bold text-red-700 flex items-center gap-2 mb-3">
                  <span className="text-2xl">⚠️</span> {t('dangerSigns')}
                </h3>
                <ul className="space-y-2">
                  {guidance.keyDangerSigns.map((sign, i) => (
                    <li key={i} className="flex items-start gap-2 text-red-800 text-sm">
                      <span className="text-red-500 mt-0.5 flex-shrink-0">•</span> {sign}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended Checks */}
            {guidance.recommendedChecks?.length > 0 && (
              <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6">
                <h3 className="font-bold text-blue-700 flex items-center gap-2 mb-3">
                  <span className="text-2xl">🔬</span> {t('recommendedChecks')}
                </h3>
                <ul className="space-y-2">
                  {guidance.recommendedChecks.map((check, i) => (
                    <li key={i} className="flex items-start gap-2 text-blue-800 text-sm">
                      <span className="text-blue-400 mt-0.5 flex-shrink-0">✓</span> {check}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Visit + Special Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guidance.nextVisitWeeks && (
                <div className="bg-green-50 rounded-2xl border border-green-100 p-5">
                  <h3 className="font-bold text-green-700 mb-2 flex items-center gap-2">
                    <span>📅</span> {t('nextVisit')}
                  </h3>
                  <p className="text-green-800 font-semibold">
                    {t('week')} {guidance.nextVisitWeeks}
                  </p>
                </div>
              )}
              {guidance.specialNotes && (
                <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
                  <h3 className="font-bold text-amber-700 mb-2 flex items-center gap-2">
                    <span>💡</span> {t('specialNotes')}
                  </h3>
                  <p className="text-amber-800 text-sm leading-relaxed">{guidance.specialNotes}</p>
                </div>
              )}
            </div>

            {/* Link to new assessment */}
            <Link
              to="/intake"
              className="block w-full text-center py-3 bg-[#C62828] hover:bg-red-700 text-white font-semibold rounded-xl transition"
            >
              🩺 {t('navNew')}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
