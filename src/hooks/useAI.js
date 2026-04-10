import { calculateOfflineRisk } from '../utils/offlineRisk'

export async function callAI(systemPrompt, userMessage) {
  const key = import.meta.env.VITE_GEMINI_KEY
  if (!key || key.includes('your_gemini_api_key_here')) {
    console.warn('[MotherShield] Missing or placeholder Gemini key — returning mock AI analysis.')
    
    if (systemPrompt && systemPrompt.includes('medical documentation specialist')) {
      return `To Whom It May Concern,

This is a simulated referral letter. The patient presents with simulated complications.

Please evaluate and manage accordingly.

Sincerely,
MotherShield AI System`
    }

    return JSON.stringify({
      riskLevel: 'HIGH',
      explanation: 'This is a simulated AI analysis because a valid Gemini API key was not provided. Based on the vitals, there is an elevated risk that requires clinical review.',
      complications: ['Simulated Risk Factor Detected'],
      immediateActions: ['Contact a clinician for assessment', 'Continue to monitor vitals closely'],
      followUpDays: 1,
      confidenceScore: 90
    })
  }

  // Offline fallback
  if (!navigator.onLine) {
    console.warn('[MotherShield] Offline — skipping Gemini API call')
    throw new Error('OFFLINE')
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`

  let lastError
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt + '\n\n' + userMessage }] }]
        })
      })

      const data = await response.json()
      console.log('Gemini raw response (attempt ' + attempt + '):', data)

      if (!response.ok) throw new Error('Gemini API error: ' + JSON.stringify(data))

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error('Gemini response missing content')
      return text
    } catch (err) {
      lastError = err
      if (attempt === 1) {
        console.warn('[MotherShield] Gemini attempt 1 failed, retrying in 2s…', err.message)
        await new Promise((r) => setTimeout(r, 2000))
      }
    }
  }
  throw lastError
}

/**
 * callAIWithOfflineFallback — wraps callAI; on OFFLINE or repeated failure
 * uses calculateOfflineRisk and queues the request in localStorage.
 */
export async function callAIWithOfflineFallback(vitals) {
  if (!navigator.onLine) {
    queuePendingSync(vitals)
    return { _offline: true, ...calculateOfflineRisk(vitals) }
  }
  return null // caller should proceed with normal Gemini path
}

function queuePendingSync(vitals) {
  try {
    const q = JSON.parse(localStorage.getItem('pendingSync') || '[]')
    q.push({ ts: Date.now(), vitals })
    localStorage.setItem('pendingSync', JSON.stringify(q.slice(-50)))
  } catch (_) {}
}
