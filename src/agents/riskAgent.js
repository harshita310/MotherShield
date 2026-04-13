import { callAI } from '../hooks/useAI'
import { calculateOfflineRisk } from '../utils/offlineRisk'

function extractJSON(raw) {
  let cleaned = raw
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim()

  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start !== -1 && end !== -1) {
    cleaned = cleaned.substring(start, end + 1)
  }

  // Try direct parse first
  try {
    return JSON.parse(cleaned)
  } catch(e) {
    console.log('Direct parse failed, trying to fix unquoted keys...')
  }

  // Fix unquoted property names: {riskLevel: -> {"riskLevel":
  try {
    const fixedKeys = cleaned.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    console.log('After key fix:', fixedKeys.substring(0, 200))
    return JSON.parse(fixedKeys)
  } catch(e) {
    console.log('Key fix failed, trying full conversion...')
  }

  // Fix unquoted string values too
  try {
    let fixed = cleaned
      .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
      .replace(/:\s*([A-Z][A-Z_]*)\s*([,}])/g, ':"$1"$2')
      .replace(/:\s*([a-zA-Z][a-zA-Z\s]*[a-zA-Z])\s*([,}])/g, ':"$1"$2')
    console.log('After full fix:', fixed.substring(0, 200))
    return JSON.parse(fixed)
  } catch(e) {
    console.log('All fixes failed:', e.message)
  }

  // Safe default
  return {
    riskLevel: 'HIGH',
    explanation: raw.substring(0, 200),
    complications: ['Please retry'],
    immediateActions: ['Retry the assessment'],
    followUpDays: 3,
    confidenceScore: 0
  }
}

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

  const systemPrompt = `You must respond with ONLY valid RFC 8259 compliant JSON. All property names must be in double quotes. All string values must be in double quotes. No trailing commas. No comments. No markdown. No code blocks. Example format: {"riskLevel": "HIGH", "explanation": "text here"}
You are a senior maternal health specialist trained on WHO Safe Motherhood guidelines. Analyze the patient vitals carefully and assess risk level.

CRITICAL if ANY of these: Systolic BP >= 160, Diastolic BP >= 110, Hemoglobin < 7, Consciousness altered, Bleeding severe
HIGH if ANY of these: Systolic BP 140-159, Diastolic BP 90-109, Hemoglobin 7-9, Temperature > 38.5, Age < 18 or > 40
MEDIUM if borderline values or single mild risk factor
LOW if all vitals within normal range

Return ONLY a raw JSON object with no markdown, no code blocks, no extra text:
{riskLevel: CRITICAL/HIGH/MEDIUM/LOW, explanation: detailed plain English explanation of which vitals are dangerous and why, complications: array of specific complication names, immediateActions: array of specific action steps, followUpDays: number, confidenceScore: percentage}
IMPORTANT: Respond with ONLY the raw JSON object. No markdown. No code blocks. No backticks. No explanation. Start your response with { and end with }`

  const safeVitals = vitals ?? {}
  const vitalsText = Object.entries(safeVitals)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')

  try {
    const responseText = await callAI(systemPrompt, `Patient vitals:\n${vitalsText}`)
    
    console.log('=== RAW AI RESPONSE START ===')
    console.log(responseText)
    console.log('=== RAW AI RESPONSE END ===')
    console.log('First character code:', responseText.charCodeAt(0))
    console.log('First 50 chars:', responseText.substring(0, 50))
    
    const parsed = extractJSON(responseText)
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
    throw err
  }
}
