/**
 * calculateOfflineRisk — WHO guideline thresholds for offline fallback.
 * Returns the same structure as riskAgent.assessRisk().
 */
export function calculateOfflineRisk(vitals = {}) {
  const {
    systolicBP = 0,
    diastolicBP = 0,
    hemoglobin = 12,
    bodyTemp = 37,
    patientAge = 25,
  } = vitals

  let riskLevel = 'LOW'
  const flags = []
  const complications = []
  const immediateActions = []

  // CRITICAL thresholds
  if (systolicBP >= 160) { riskLevel = 'CRITICAL'; flags.push(`Systolic BP ${systolicBP} ≥ 160 mmHg (severe hypertension)`) }
  if (diastolicBP >= 110) { riskLevel = 'CRITICAL'; flags.push(`Diastolic BP ${diastolicBP} ≥ 110 mmHg (severe hypertension)`) }
  if (hemoglobin < 7)    { riskLevel = 'CRITICAL'; flags.push(`Hemoglobin ${hemoglobin} g/dL < 7 (severe anaemia)`) }

  // HIGH thresholds (only if not already CRITICAL)
  if (riskLevel !== 'CRITICAL') {
    if (systolicBP >= 140) { riskLevel = 'HIGH'; flags.push(`Systolic BP ${systolicBP} ≥ 140 mmHg (hypertension)`) }
    if (diastolicBP >= 90) { riskLevel = 'HIGH'; flags.push(`Diastolic BP ${diastolicBP} ≥ 90 mmHg (hypertension)`) }
    if (hemoglobin < 9)    { riskLevel = 'HIGH'; flags.push(`Hemoglobin ${hemoglobin} g/dL < 9 (moderate anaemia)`) }
    if (bodyTemp > 38.5)   { riskLevel = 'HIGH'; flags.push(`Body temperature ${bodyTemp}°C > 38.5°C (fever)`) }
  }

  // MEDIUM thresholds
  if (riskLevel === 'LOW') {
    if (systolicBP >= 130) { riskLevel = 'MEDIUM'; flags.push(`Systolic BP ${systolicBP} ≥ 130 mmHg (pre-hypertension)`) }
    if (hemoglobin < 11)   { riskLevel = 'MEDIUM'; flags.push(`Hemoglobin ${hemoglobin} g/dL < 11 (mild anaemia)`) }
    if (patientAge < 18)   { riskLevel = 'MEDIUM'; flags.push(`Patient age ${patientAge} < 18 (adolescent pregnancy risk)`) }
  }

  // Build complication list
  if (systolicBP >= 140 || diastolicBP >= 90) complications.push('Hypertension / Pre-eclampsia risk')
  if (hemoglobin < 11) complications.push('Anaemia')
  if (bodyTemp > 38.5) complications.push('Infection / Fever')
  if (patientAge < 18) complications.push('Adolescent pregnancy')

  // Build actions based on level
  if (riskLevel === 'CRITICAL') {
    immediateActions.push(
      'Call 108 ambulance immediately',
      'Transfer to nearest hospital with ICU/maternity ward',
      'Do not give food or water',
      'Keep patient lying on left side',
      'Monitor breathing every 5 minutes'
    )
  } else if (riskLevel === 'HIGH') {
    immediateActions.push(
      'Refer to hospital within 2 hours',
      'Monitor vitals every 30 minutes',
      'Ensure family member accompanies patient',
      'Prepare referral letter'
    )
  } else if (riskLevel === 'MEDIUM') {
    immediateActions.push(
      'Schedule follow-up within 48 hours',
      'Monitor blood pressure daily',
      'Ensure adequate nutrition and iron supplementation'
    )
  } else {
    immediateActions.push(
      'Continue routine antenatal care',
      'Next visit in 4 weeks as scheduled'
    )
  }

  const followUpDays = riskLevel === 'CRITICAL' ? 0 : riskLevel === 'HIGH' ? 1 : riskLevel === 'MEDIUM' ? 3 : 14

  const explanation = flags.length > 0
    ? `[OFFLINE — WHO Thresholds] ${flags.join('. ')}. This offline assessment uses WHO Safe Motherhood guidelines and should be confirmed with full AI analysis when connectivity is restored.`
    : `[OFFLINE — WHO Thresholds] All vitals appear within normal ranges based on WHO thresholds. Continue routine antenatal care. Full AI analysis will be performed when connectivity is restored.`

  return { riskLevel, explanation, complications, immediateActions, followUpDays, confidenceScore: 75 }
}
