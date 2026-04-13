import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import thresholds from '../data/thresholds.json';
import { callAI } from '../hooks/useAI';

function cleanAndParseJSON(raw) {
  try {
    let cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')
    if (firstBrace === -1 || lastBrace === -1) throw new Error('No JSON object found')
    cleaned = cleaned.substring(firstBrace, lastBrace + 1)
    return JSON.parse(cleaned)
  } catch (e) {
    throw e
  }
}

async function analyseAnaemia(base64jpeg) {
  const prompt = 'Analyze anaemia in eyelid image. Return ONLY JSON: {"anaemiaLevel":"SEVERE|MILD|NORMAL","hemoglobinEstimate":number,"confidence":number,"recommendation":"string"}';
  let raw = await callAI("You are a medical assistant.", prompt);
  return cleanAndParseJSON(raw);
}

export default function Intake({ t: tProp, language: langProp }) {
  const t = tProp || ((k) => k);
  const language = langProp || 'en';
  const navigate = useNavigate();

  // Vitals state
  const [systolicBP, setSystolicBP]               = useState('');
  const [diastolicBP, setDiastolicBP]             = useState('');
  const [hemoglobin, setHemoglobin]               = useState('');
  const [gestationalWeeks, setGestationalWeeks]   = useState('');
  const [patientAge, setPatientAge]               = useState('');
  const [previousBirths, setPreviousBirths]       = useState('');
  const [previousComplications, setPreviousComplications] = useState('');
  const [bodyTemp, setBodyTemp]                   = useState('');
  const [patientName, setPatientName]             = useState('');
  const [familyPhone, setFamilyPhone]             = useState('');
  const [userLat, setUserLat]                     = useState(null);
  const [userLng, setUserLng]                     = useState(null);
  const [locationStatus, setLocationStatus]       = useState('Location not shared yet');
  const [submitting, setSubmitting]               = useState(false);

  // Mic/Camera internal state
  const [listeningField, setListeningField] = useState(null);
  const [micToast, setMicToast] = useState(null);
  const recognitionRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [anaemiaResult, setAnaemiaResult] = useState(null);
  const [anaemiaLoading, setAnaemiaLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const fields = [
    { id: 'patientName', label: 'Patient Name', value: patientName, setter: setPatientName, type: 'text' },
    { id: 'familyPhone', label: 'Family Phone', value: familyPhone, setter: setFamilyPhone, type: 'tel' },
    { id: 'systolicBP', label: 'Systolic BP', value: systolicBP, setter: setSystolicBP, type: 'number' },
    { id: 'diastolicBP', label: 'Diastolic BP', value: diastolicBP, setter: setDiastolicBP, type: 'number' },
    { id: 'hemoglobin', label: 'Hemoglobin (g/dL)', value: hemoglobin, setter: setHemoglobin, type: 'number', step: '0.1' },
    { id: 'gestationalWeeks', label: 'Gestational Weeks', value: gestationalWeeks, setter: setGestationalWeeks, type: 'number' },
    { id: 'patientAge', label: 'Patient Age', value: patientAge, setter: setPatientAge, type: 'number' },
    { id: 'previousBirths', label: 'Previous Births', value: previousBirths, setter: setPreviousBirths, type: 'number' }
  ];

  const filledFields = fields.filter(f => f.value !== '').length;
  const progress = (filledFields / fields.length) * 100;

  function getStatusColor(field, value) {
    if (!value) return 'rgba(255,255,255,0.1)';
    const num = Number(value);
    if (field === 'hemoglobin') {
      if (num < 7) return '#C62828';
      if (num < 11) return '#F59E0B';
      return '#10B981';
    }
    if (field === 'systolicBP') {
      if (num >= 140) return '#C62828';
      if (num >= 130) return '#F59E0B';
      return '#10B981';
    }
    return '#10B981';
  }

  // Camera logic (Simplified for UI update)
  async function openCamera() {
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch (err) { console.error(err); }
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setCapturedImage(dataUrl);
    streamRef.current.getTracks().forEach(t => t.stop());
    setCameraOpen(false);
    runAnaemiaAnalysis(dataUrl.split(',')[1]);
  }

  async function runAnaemiaAnalysis(base64) {
    setAnaemiaLoading(true);
    try {
      const result = await analyseAnaemia(base64);
      setAnaemiaResult(result);
      if (result.hemoglobinEstimate) setHemoglobin(String(result.hemoglobinEstimate));
    } catch (err) { console.error(err); }
    finally { setAnaemiaLoading(false); }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    const vitals = { systolicBP, diastolicBP, hemoglobin, gestationalWeeks, patientAge, previousBirths, previousComplications, bodyTemp };
    const patient = { name: patientName, familyPhone, patientAge, userLat, userLng, ...vitals };
    setTimeout(() => navigate('/results', { state: { vitals, patient } }), 1000);
  }

  return (
    <div className="min-h-screen bg-[#1f1f1f] text-[#f6f7ed] pb-20 px-6" style={{ paddingTop: '64px' }}>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-white/5 z-[2000]">
        <div 
          className="h-full bg-[#C62828] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto">
        <header className="mb-12 animate-fadeUp">
          <p className="text-[#C62828] text-[10px] tracking-[0.3em] font-black uppercase mb-4">NEW ASSESSMENT</p>
          <h1 className="text-6xl font-serif">Patient Vitals</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Sidebar - Anaemia Scan */}
          <div className="lg:col-span-1 border-r border-white/5 pr-8">
            <h3 className="text-[10px] tracking-[0.2em] font-bold text-white/40 uppercase mb-6">Anaemia Scanner</h3>
            <div className="glass-card p-6 border-white/10 group cursor-pointer hover:border-[#C62828]/30 transition-all overflow-hidden" onClick={openCamera}>
              {cameraOpen ? (
                <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <button onClick={(e) => { e.stopPropagation(); capturePhoto(); }} className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-red-600 rounded-full border-4 border-white/20" />
                </div>
              ) : capturedImage ? (
                <div className="relative aspect-square rounded-lg overflow-hidden">
                  <img src={capturedImage} className="w-full h-full object-cover" />
                  {anaemiaLoading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" /></div>}
                </div>
              ) : (
                <div className="aspect-square flex flex-col items-center justify-center gap-4 text-white/20 group-hover:text-[#C62828] transition-colors">
                  <span className="text-4xl">👁️</span>
                  <p className="text-[10px] font-bold tracking-widest text-center">CLICK TO SCAN EYELID</p>
                </div>
              )}
            </div>
            {anaemiaResult && (
              <div className="mt-4 animate-fadeIn">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-white/40">RESULT</span>
                  <span className="text-[10px] font-bold text-[#C62828]">{anaemiaResult.anaemiaLevel}</span>
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed italic">"{anaemiaResult.recommendation}"</p>
              </div>
            )}
          </div>

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 animate-fadeUp" style={{ animationDelay: '0.2s' }}>
            {fields.map((field) => (
              <div key={field.id} className="relative">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] tracking-[0.2em] font-black text-white/40 uppercase">
                    {field.label}
                  </label>
                  <div 
                    className="w-2 h-2 rounded-full transition-colors duration-500" 
                    style={{ backgroundColor: getStatusColor(field.id, field.value) }}
                  />
                </div>
                <input
                  type={field.type}
                  step={field.step}
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  className="w-full bg-[#2a2a2a] border border-white/5 px-4 py-4 text-white text-sm focus:outline-none focus:border-[#C62828] transition-all"
                  placeholder="---"
                />
              </div>
            ))}

            <div className="md:col-span-2 relative">
              <label className="text-[10px] tracking-[0.2em] font-black text-white/40 uppercase block mb-2">Previous Complications</label>
              <textarea
                value={previousComplications}
                onChange={(e) => setPreviousComplications(e.target.value)}
                className="w-full bg-[#2a2a2a] border border-white/5 px-4 py-4 text-white text-sm focus:outline-none focus:border-[#C62828] transition-all h-32"
                placeholder="List any history of hypertension, diabetes, etc."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="md:col-span-2 h-16 bg-[#8B0000] hover:bg-[#C62828] text-white text-[12px] tracking-[0.4em] font-black uppercase transition-all duration-500 shadow-[0_0_30px_rgba(139,0,0,0.3)] hover:shadow-[0_0_50px_rgba(198,40,40,0.5)] disabled:opacity-50"
            >
              {submitting ? 'Analyzing vitals...' : 'Generate Risk Assessment'}
            </button>
          </form>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
