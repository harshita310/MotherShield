import { callAI } from '../hooks/useAI'
import { calculateOfflineRisk } from '../utils/offlineRisk'

export async function assessRisk(vitals) {
  // Offline path
  if (!navigator.onLine) {
    console.warn('[MotherShield] Offline — using WHO threshold risk calculation')
    const offline = calculateOfflineRisk(vitals)
    // Queue for later sync
    try {
      const q = JSON.parse(localStorage.getItem('pendingSync') || '[]')
      q.push({ ts: Date.now(), vitals })
      localStorage.setItem('pendingSync', JSON.stringify(q.slice(-50)))
    } catch (_) {}
    return offline
  }

  const systemPrompt = `You are a senior maternal health specialist trained on WHO Safe Motherhood guidelines. Analyze the patient vitals carefully and assess risk level.

CRITICAL if ANY of these: Systolic BP >= 160, Diastolic BP >= 110, Hemoglobin < 7, Consciousness altered, Bleeding severe
HIGH if ANY of these: Systolic BP 140-159, Diastolic BP 90-109, Hemoglobin 7-9, Temperature > 38.5, Age < 18 or > 40
MEDIUM if borderline values or single mild risk factor
LOW if all vitals within normal range

Return ONLY a raw JSON object with no markdown, no code blocks, no extra text:
{riskLevel: CRITICAL/HIGH/MEDIUM/LOW, explanation: detailed plain English explanation of which vitals are dangerous and why, complications: array of specific complication names, immediateActions: array of specific action steps, followUpDays: number, confidenceScore: percentage}`

  const safeVitals = vitals ?? {}
  const vitalsText = Object.entries(safeVitals)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')

  try {
    const responseText = await callAI(systemPrompt, `Patient vitals:\n${vitalsText}`)
    let cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1)
    }
    const parsed = JSON.parse(cleaned)
    return {
      riskLevel: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(parsed?.riskLevel)
        ? parsed.riskLevel
        : 'HIGH',
      explanation: typeof parsed?.explanation === 'string' ? parsed.explanation : 'No explanation provided.',
      complications: Array.isArray(parsed?.complications) ? parsed.complications : [],
      immediateActions: Array.isArray(parsed?.immediateActions) ? parsed.immediateActions : [],
      followUpDays: Number.isFinite(parsed?.followUpDays) ? parsed.followUpDays : 1,
      confidenceScore: Number.isFinite(parsed?.confidenceScore) ? parsed.confidenceScore : 0
    }
  } catch (err) {
    // If offline happened mid-flight, fall back
    if (!navigator.onLine) return calculateOfflineRisk(vitals)
    return {
      riskLevel: 'HIGH',
      explanation:
        'I could not reliably interpret the provided vitals. Based on this uncertainty, the safest approach is to treat the situation as high risk and seek prompt clinical review.',
      complications: ['Uncertain clinical risk due to parsing/response format issues'],
      immediateActions: [
        'Contact a clinician or emergency service for urgent assessment',
        'Re-check vital measurements and confirm units'
      ],
      followUpDays: 1,
      confidenceScore: 0
    }
  }
}
