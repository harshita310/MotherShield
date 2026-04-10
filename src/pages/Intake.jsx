import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import thresholds from '../data/thresholds.json';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY;

// ─── Anaemia Gemini call ────────────────────────────────────────────────────
async function analyseAnaemia(base64jpeg) {
  if (!GEMINI_KEY) throw new Error('Missing VITE_GEMINI_KEY');
  const prompt =
    'Look at this image of a patient\'s inner lower eyelid (conjunctiva). Assess anaemia level based on color. ' +
    'Pale white or very light pink = severe anaemia. Light pink = mild anaemia. Deep pink/red = normal. ' +
    'Return ONLY JSON (no markdown, no code blocks): ' +
    '{"anaemiaLevel":"SEVERE|MILD|NORMAL","hemoglobinEstimate":number,"confidence":number,"recommendation":"string"}';

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: 'image/jpeg', data: base64jpeg } },
          ],
        }],
      }),
    }
  );
  const data = await res.json();
  let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
  const f = raw.indexOf('{');
  const l = raw.lastIndexOf('}');
  if (f === -1 || l === -1) throw new Error('No JSON in Gemini response');
  return JSON.parse(raw.substring(f, l + 1));
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function Intake({ t: tProp, language: langProp }) {
  // Translation helper: if parent passes t use it, else identity
  const t = tProp || ((k) => k);
  const language = langProp || 'en';

  const navigate = useNavigate();

  // ── Vitals state ──
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

  // ── Mic state ──
  const [listeningField, setListeningField] = useState(null);
  const [micLang, setMicLang]               = useState(language === 'hi' ? 'hi-IN' : 'en-IN');
  const [micToast, setMicToast]             = useState(null);
  const recognitionRef                      = useRef(null);
  const activeFieldRef                      = useRef(null);

  // Sync mic language when global language changes
  useEffect(() => {
    setMicLang(language === 'hi' ? 'hi-IN' : 'en-IN');
  }, [language]);

  // ── Camera / Anaemia state ──
  const [cameraOpen, setCameraOpen]       = useState(false);
  const [cameraError, setCameraError]     = useState(null);
  const [capturedImage, setCapturedImage] = useState(null); // base64 data URL
  const [anaemiaResult, setAnaemiaResult] = useState(null);
  const [anaemiaLoading, setAnaemiaLoading] = useState(false);
  const [anaemiaError, setAnaemiaError]   = useState(null);
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const fieldSetters = {
    patientName:           setPatientName,
    familyPhone:           setFamilyPhone,
    systolicBP:            setSystolicBP,
    diastolicBP:           setDiastolicBP,
    hemoglobin:            setHemoglobin,
    gestationalWeeks:      setGestationalWeeks,
    patientAge:            setPatientAge,
    previousBirths:        setPreviousBirths,
    previousComplications: setPreviousComplications,
    bodyTemp:              setBodyTemp,
  };

  function showToast(msg) {
    setMicToast(msg);
    setTimeout(() => setMicToast(null), 3500);
  }

  // ── Speech recognition ──
  const buildRecognition = useCallback((lang) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
    }
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('Result received:', transcript);
      const field = activeFieldRef.current;
      if (field && fieldSetters[field]) fieldSetters[field](transcript);
      setListeningField(null);
      activeFieldRef.current = null;
    };
    rec.onerror = (event) => {
      console.log('Error:', event.error);
      setListeningField(null);
      activeFieldRef.current = null;
      if (event.error !== 'aborted') showToast(t('micUnavailable'));
    };
    rec.onend = () => {
      setListeningField(null);
      activeFieldRef.current = null;
    };
    recognitionRef.current = rec;
    return rec;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { buildRecognition(micLang); }, [micLang, buildRecognition]);

  function startListening(field) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showToast(t('micUnavailable')); return; }
    if (listeningField && recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      setListeningField(null);
      activeFieldRef.current = null;
      setTimeout(() => startListening(field), 150);
      return;
    }
    buildRecognition(micLang);
    activeFieldRef.current = field;
    setListeningField(field);
    try {
      recognitionRef.current.start();
      console.log('Mic started for field:', field);
    } catch (err) {
      console.log('Error:', err.message);
      setListeningField(null);
      activeFieldRef.current = null;
      showToast(t('micUnavailable'));
    }
  }

  // ── Camera helpers ──
  async function openCamera() {
    setCameraError(null);
    setCapturedImage(null);
    setAnaemiaResult(null);
    setAnaemiaError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      setCameraOpen(true);
      // attach stream after state update
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError(t('cameraError'));
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
    // trigger analysis
    const base64 = dataUrl.split(',')[1];
    runAnaemiaAnalysis(base64);
  }

  async function runAnaemiaAnalysis(base64) {
    setAnaemiaLoading(true);
    setAnaemiaError(null);
    setAnaemiaResult(null);
    try {
      const result = await analyseAnaemia(base64);
      setAnaemiaResult(result);
      // Auto-fill hemoglobin
      if (result.hemoglobinEstimate) {
        setHemoglobin(String(result.hemoglobinEstimate));
        showToast(t('autoFilled'));
      }
    } catch (err) {
      console.error('Anaemia analysis error:', err);
      setAnaemiaError('Analysis failed: ' + err.message);
    } finally {
      setAnaemiaLoading(false);
    }
  }

  // Cleanup camera on unmount
  useEffect(() => () => stopCamera(), []);

  // ── Threshold helpers ──
  function getStatus(field, value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return 'Normal';
    if (field === 'hemoglobin') {
      if (num < thresholds.hemoglobin.warning) return 'Danger';
      if (num < thresholds.hemoglobin.normal) return 'Warning';
      return 'Normal';
    }
    if (field === 'gestationalWeeks') {
      if (num < thresholds.gestationalWeeks.preterm) return 'Warning';
      return 'Normal';
    }
    if (field === 'patientAge') {
      if (num < thresholds.patientAge.youngRisk || num > thresholds.patientAge.oldRisk) return 'Warning';
      return 'Normal';
    }
    if (thresholds[field]?.danger !== undefined && num >= thresholds[field].danger) return 'Danger';
    if (thresholds[field]?.warning !== undefined && num >= thresholds[field].warning) return 'Warning';
    return 'Normal';
  }

  function statusClasses(status) {
    if (status === 'Danger') return 'border-l-red-600 bg-red-50';
    if (status === 'Warning') return 'border-l-amber-500 bg-amber-50';
    return 'border-l-green-600 bg-green-50';
  }

  function pillClasses(status) {
    if (status === 'Danger') return 'bg-red-100 text-red-700';
    if (status === 'Warning') return 'bg-amber-100 text-amber-700';
    return 'bg-green-100 text-green-700';
  }

  function anaemiaBadgeClass(level) {
    if (level === 'SEVERE') return 'bg-red-100 text-red-700 border border-red-300';
    if (level === 'MILD')   return 'bg-yellow-100 text-yellow-700 border border-yellow-300';
    return 'bg-green-100 text-green-700 border border-green-300';
  }

  function handleGetLocation() {
    if (!navigator.geolocation) { setLocationStatus('Geolocation is not supported'); return; }
    setLocationStatus(t('locationFetching'));
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); setLocationStatus(t('locationSuccess')); },
      ()    => setLocationStatus(t('locationFailed')),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    const vitals = {
      systolicBP: Number(systolicBP), diastolicBP: Number(diastolicBP),
      hemoglobin: Number(hemoglobin), gestationalWeeks: Number(gestationalWeeks),
      patientAge: Number(patientAge), previousBirths: Number(previousBirths),
      previousComplications, bodyTemp: Number(bodyTemp),
    };
    const patient = {
      name: patientName.trim(), familyPhone: familyPhone.trim(),
      patientAge: Number(patientAge), userLat, userLng, ...vitals,
    };
    setTimeout(() => navigate('/results', { state: { vitals, patient } }), 400);
  }

  // ── Voice Button ──
  const VoiceButton = ({ field }) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const isActive = listeningField === field;
    return (
      <button
        type="button"
        onClick={() => startListening(field)}
        title={isActive ? t('listening') : 'Click to use voice input'}
        className={`ml-2 w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center transition-all ${
          isActive
            ? 'bg-red-600 text-white shadow-lg ring-4 ring-red-300 animate-pulse'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >🎤</button>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      {/* Toast */}
      {micToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-700 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium animate-bounce">
          🎙️ {micToast}
        </div>
      )}

      <div className="w-full max-w-[700px] space-y-4">

        {/* ── ANAEMIA SCANNER SECTION ── */}
        <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">👁️</span>
            <h2 className="text-base font-bold text-[#1A237E]">{t('anaemiaTitle')}</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">{t('anaemiaDesc')}</p>

          {/* Camera controls */}
          {!cameraOpen && !capturedImage && (
            <button
              type="button"
              onClick={openCamera}
              className="px-5 py-2.5 bg-[#1A237E] hover:bg-indigo-900 text-white text-sm font-semibold rounded-xl transition flex items-center gap-2"
            >
              {t('scanBtn')}
            </button>
          )}

          {cameraError && (
            <p className="text-xs text-red-600 font-medium mt-2">⚠️ {cameraError}</p>
          )}

          {/* Live preview */}
          {cameraOpen && (
            <div className="mt-3 space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-black w-full" style={{ maxHeight: 240 }}>
                <video ref={videoRef} autoPlay playsInline muted className="w-full object-cover" style={{ maxHeight: 240 }} />
                {/* Overlay guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-dashed border-white/60 rounded-full w-32 h-20 opacity-70" />
                </div>
              </div>
              <p className="text-xs text-slate-500 text-center">Pull down lower eyelid and hold inside eye to camera</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="flex-1 py-2.5 bg-[#C62828] hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition"
                >
                  {t('captureBtn')}
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition"
                >
                  {t('stopCamera')}
                </button>
              </div>
            </div>
          )}

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Captured image preview */}
          {capturedImage && !cameraOpen && (
            <div className="mt-3 flex gap-4 items-start">
              <img
                src={capturedImage}
                alt="Captured eyelid"
                className="w-24 h-16 object-cover rounded-lg border border-slate-200"
              />
              <div className="flex-1">
                {anaemiaLoading && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="w-4 h-4 border-2 border-indigo-300 border-t-[#1A237E] rounded-full animate-spin" />
                    {t('scanningAnaemia')}
                  </div>
                )}
                {anaemiaError && (
                  <p className="text-xs text-red-600 font-medium">⚠️ {anaemiaError}</p>
                )}
                {anaemiaResult && !anaemiaLoading && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-600">{t('anaemiaResult')}:</span>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${anaemiaBadgeClass(anaemiaResult.anaemiaLevel)}`}>
                        {anaemiaResult.anaemiaLevel}
                      </span>
                      <span className="text-xs text-slate-500">
                        Hgb ~{anaemiaResult.hemoglobinEstimate} g/dL
                      </span>
                      <span className="text-xs text-slate-500">
                        {t('confidence')}: {anaemiaResult.confidence}%
                      </span>
                    </div>
                    {anaemiaResult.recommendation && (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        💡 {anaemiaResult.recommendation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Retake button */}
          {capturedImage && !cameraOpen && (
            <button
              type="button"
              onClick={() => { setCapturedImage(null); setAnaemiaResult(null); setAnaemiaError(null); openCamera(); }}
              className="mt-3 text-xs text-[#1A237E] underline hover:no-underline"
            >
              Retake photo
            </button>
          )}
        </div>

        {/* ── MAIN FORM CARD ── */}
        <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🩺</span>
            <h1 className="text-[28px] font-bold text-[#1A237E]">{t('intakeTitle')}</h1>
          </div>
          <p className="text-sm text-slate-600 mb-4">{t('intakeSubtitle')}</p>

          {/* Voice Language Toggle */}
          <div className="flex items-center gap-2 mb-5">
            <span className="text-sm text-slate-600 font-medium">{t('voiceLang')}</span>
            <button
              type="button"
              onClick={() => setMicLang('en-IN')}
              className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                micLang === 'en-IN' ? 'bg-[#1A237E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >EN</button>
            <button
              type="button"
              onClick={() => setMicLang('hi-IN')}
              className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                micLang === 'hi-IN' ? 'bg-[#1A237E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >हिं</button>
            {listeningField && (
              <span className="ml-2 flex items-center gap-1 text-xs text-red-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                {t('listening')}
              </span>
            )}
          </div>

          {/* Location banner */}
          <div className="mb-4 rounded-lg bg-blue-50 border border-blue-100 p-3 flex items-center justify-between gap-3">
            <div className="text-sm text-blue-800">{locationStatus}</div>
            <button
              type="button"
              onClick={handleGetLocation}
              className="px-3 py-1.5 rounded-md bg-[#1A237E] text-white text-sm hover:bg-indigo-900 whitespace-nowrap"
            >
              {t('useMyLocation')}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Patient Name */}
              <div>
                <div className="flex items-center">
                  <label className="block text-sm font-medium text-gray-700">{t('patientName')}</label>
                  <VoiceButton field="patientName" />
                </div>
                <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-3 h-12" />
              </div>

              {/* Family Phone */}
              <div>
                <div className="flex items-center">
                  <label className="block text-sm font-medium text-gray-700">{t('familyPhone')}</label>
                  <VoiceButton field="familyPhone" />
                </div>
                <input type="tel" value={familyPhone} onChange={(e) => setFamilyPhone(e.target.value)}
                  placeholder="+91XXXXXXXXXX"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-3 h-12" />
              </div>

              {/* Systolic BP */}
              <div className={`border-l-4 rounded-md p-2 ${statusClasses(getStatus('systolicBP', systolicBP))}`}>
                <div className="flex items-center">
                  <label className="block text-sm font-medium text-gray-700">{t('systolicBP')}</label>
                  <VoiceButton field="systolicBP" />
                </div>
                <input type="number" value={systolicBP} onChange={(e) => setSystolicBP(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-3 h-12" />
                <p className="mt-1 text-xs text-gray-500">{t('bpNote')}</p>
                <span className={`mt-2 inline-block text-xs font-semibold px-2 py-1 rounded-full ${pillClasses(getStatus('systolicBP', systolicBP))}`}>
                  {getStatus('systolicBP', systolicBP)}
                </span>
              </div>

              {/* Diastolic BP */}
              <div className={`border-l-4 rounded-md p-2 ${statusClasses(getStatus('diastolicBP', diastolicBP))}`}>
                <div className="flex items-center">
                  <label className="block text-sm font-medium text-gray-700">{t('diastolicBPLabel')}</label>
                  <VoiceButton field="diastolicBP" />
                </div>
                <input type="number" value={diastolicBP} onChange={(e) => setDiastolicBP(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-3 h-12" />
                <p className="mt-1 text-xs text-gray-500">{t('dbpNote')}</p>
                <span className={`mt-2 inline-block text-xs font-semibold px-2 py-1 rounded-full ${pillClasses(getStatus('diastolicBP', diastolicBP))}`}>
                  {getStatus('diastolicBP', diastolicBP)}
                </span>
              </div>

              {/* Hemoglobin */}
              <div className={`border-l-4 rounded-md p-2 ${statusClasses(getStatus('hemoglobin', hemoglobin))}`}>
                <div className="flex items-center">
                  <label className="block text-sm font-medium text-gray-700">{t('hemoglobinLabel')}</label>
                  <VoiceButton field="hemoglobin" />
                </div>
                <input type="number" value={hemoglobin} onChange={(e) => setHemoglobin(e.target.value)}
                  step="0.1"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-3 h-12" />
                <span className={`mt-2 inline-block text-xs font-semibold px-2 py-1 rounded-full ${pillClasses(getStatus('hemoglobin', hemoglobin))}`}>
                  {getStatus('hemoglobin', hemoglobin)}
                </span>
              </div>

              {/* Gestational Weeks */}
              <div className={`border-l-4 rounded-md p-2 ${statusClasses(getStatus('gestationalWeeks', gestationalWeeks))}`}>
                <div className="flex items-center">
                  <label className="block text-sm font-medium text-gray-700">{t('gestWeeks')}</label>
                  <VoiceButton field="gestationalWeeks" />
                </div>
                <input type="number" value={gestationalWeeks} onChange={(e) => setGestationalWeeks(e.target.value)}
                  step="0.1"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-3 h-12" />
                <span className={`mt-2 inline-block text-xs font-semibold px-2 py-1 rounded-full ${pillClasses(getStatus('gestationalWeeks', gestationalWeeks))}`}>
                  {getStatus('gestationalWeeks', gestationalWeeks)}
                </span>
              </div>

              {/* Patient Age */}
              <div className={`border-l-4 rounded-md p-2 ${statusClasses(getStatus('patientAge', patientAge))}`}>
                <div className="flex items-center">
                  <label className="block text-sm font-medium text-gray-700">{t('patientAge')}</label>
                  <VoiceButton field="patientAge" />
                </div>
                <input type="number" value={patientAge} onChange={(e) => setPatientAge(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-3 h-12" />
                <span className={`mt-2 inline-block text-xs font-semibold px-2 py-1 rounded-full ${pillClasses(getStatus('patientAge', patientAge))}`}>
                  {getStatus('patientAge', patientAge)}
                </span>
              </div>

              {/* Previous Births */}
              <div>
                <div className="flex items-center">
                  <label className="block text-sm font-medium text-gray-700">{t('prevBirths')}</label>
                  <VoiceButton field="previousBirths" />
                </div>
                <input type="number" value={previousBirths} onChange={(e) => setPreviousBirths(e.target.value)}
                  step="1"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-3 h-12" />
              </div>

              {/* Previous Complications */}
              <div className="md:col-span-2">
                <div className="flex items-center">
                  <label className="block text-sm font-medium text-gray-700">{t('prevComplications')}</label>
                  <VoiceButton field="previousComplications" />
                </div>
                <input type="text" value={previousComplications} onChange={(e) => setPreviousComplications(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-3 h-12" />
              </div>

              {/* Body Temperature */}
              <div className={`md:col-span-2 border-l-4 rounded-md p-2 ${statusClasses(getStatus('bodyTemp', bodyTemp))}`}>
                <div className="flex items-center">
                  <label className="block text-sm font-medium text-gray-700">{t('bodyTempLabel')}</label>
                  <VoiceButton field="bodyTemp" />
                </div>
                <input type="number" value={bodyTemp} onChange={(e) => setBodyTemp(e.target.value)}
                  step="0.1"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-3 h-12" />
                <span className={`mt-2 inline-block text-xs font-semibold px-2 py-1 rounded-full ${pillClasses(getStatus('bodyTemp', bodyTemp))}`}>
                  {getStatus('bodyTemp', bodyTemp)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-14 bg-[#C62828] hover:bg-red-700 text-white font-semibold rounded-xl text-lg flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                  {t('analyzing')}
                </>
              ) : t('submitBtn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
