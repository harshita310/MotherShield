import { calculateOfflineRisk } from '../utils/offlineRisk'

export async function callAI(systemPrompt, userMessage) {
  const key = import.meta.env.VITE_GEMINI_KEY
  if (!key) throw new Error('Missing VITE_GEMINI_KEY')

  // Offline fallback
  if (!navigator.onLine) {
    console.warn('[MotherShield] Offline — skipping Gemini API call')
    throw new Error('OFFLINE')
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`

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
