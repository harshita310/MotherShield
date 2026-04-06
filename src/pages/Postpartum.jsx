import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { callAI } from '../hooks/useAI';

export default function Postpartum() {
  
  const [checkIns, setCheckIns] = useState({
    '6h': { status: 'Pending', data: null },
    '24h': { status: 'Pending', data: null },
    '48h': { status: 'Pending', data: null },
  });
  const [expandedCard, setExpandedCard] = useState(null);
  const [formData, setFormData] = useState({
    bleeding: '',
    temperature: '',
    uterusFirmness: '',
    dischargeSmell: '',
    consciousnessLevel: '',
    painLevel: 5,
  });
  const [emergency, setEmergency] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('motherShieldPostpartum') || '{}');
    if (saved.checkIns) setCheckIns(saved.checkIns);
  }, []);

  // Check for emergency conditions
  useEffect(() => {
    const emergencyConditions =
      formData.bleeding === 'Heavy' ||
      formData.bleeding === 'Soaking pads' ||
      formData.consciousnessLevel === 'Confused' ||
      formData.consciousnessLevel === 'Unresponsive';

    setEmergency(emergencyConditions);
  }, [formData.bleeding, formData.consciousnessLevel]);

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e, checkInKey) => {
    e.preventDefault();

    if (emergency) {
      return;
    }

    setLoading(true);

    const systemPrompt =
      'You are a maternal health specialist. Assess postpartum risk based on provided vitals. Return ONLY valid JSON: {"riskLevel":"HIGH"|"MEDIUM"|"LOW","findings":"string","immediateActions":["action1","action2"],"isEmergency":boolean}';

    const userMessage = `Check-in data: Bleeding: ${formData.bleeding}, Temperature: ${formData.temperature}°C, Uterus: ${formData.uterusFirmness}, Discharge: ${formData.dischargeSmell}, Consciousness: ${formData.consciousnessLevel}, Pain: ${formData.painLevel}/10`;

    try {
      const response = await callAI(systemPrompt, userMessage);
      const result = JSON.parse(response);
      setAiResult(result);

      // Save to localStorage
      const updated = { ...checkIns };
      updated[checkInKey] = {
        status: 'Completed',
        data: { ...formData, result, timestamp: new Date().toISOString() },
      };
      setCheckIns(updated);
      localStorage.setItem('motherShieldPostpartum', JSON.stringify({ checkIns: updated }));

      setExpandedCard(null);
      setFormData({
        bleeding: '',
        temperature: '',
        uterusFirmness: '',
        dischargeSmell: '',
        consciousnessLevel: '',
        painLevel: 5,
      });
    } catch (error) {
      console.error('AI Error:', error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6">
      {/* Emergency Overlay */}
      {emergency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#C62828] text-white text-center p-8 rounded-lg animate-pulse">
            <p className="text-5xl mb-6">🚨</p>
            <p className="text-3xl font-bold mb-4">EMERGENCY</p>
            <p className="text-xl mb-8">CALL 108 IMMEDIATELY</p>
            <a
              href="tel:108"
              className="inline-block bg-white text-[#C62828] px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100"
            >
              📞 Call 108 Now
            </a>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back Button */}
        <Link
          to="/dashboard"
          className="inline-block text-[#1A237E] hover:text-[#0D1B4B] font-semibold"
        >
          ← Back to Dashboard
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#1A237E]">Postpartum Monitoring</h1>
          <p className="text-slate-600">48-hour post-delivery check-ins</p>
        </div>

        {/* Check-in Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { key: '6h', label: '6 Hours Post-Delivery' },
            { key: '24h', label: '24 Hours Post-Delivery' },
            { key: '48h', label: '48 Hours Post-Delivery' },
          ].map(({ key, label }) => (
            <div
              key={key}
              className="bg-white rounded-lg shadow-sm p-6 cursor-pointer border-t-4 border-slate-300 hover:shadow-md transition"
              onClick={() => checkIns[key].status === 'Pending' && setExpandedCard(key)}
            >
              <h3 className="text-lg font-semibold text-[#1A237E] mb-3">{label}</h3>
              <span
                className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                  checkIns[key].status === 'Completed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {checkIns[key].status}
              </span>

              {expandedCard === key && (
                <form
                  onSubmit={(e) => handleSubmit(e, key)}
                  className="mt-6 space-y-4 bg-gray-50 p-4 rounded-lg"
                >
                  {/* Bleeding Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bleeding Amount
                    </label>
                    <div className="space-y-2">
                      {['None', 'Light', 'Moderate', 'Heavy', 'Soaking pads'].map((opt) => (
                        <label key={opt} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="bleeding"
                            value={opt}
                            checked={formData.bleeding === opt}
                            onChange={(e) => handleFormChange('bleeding', e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Body Temperature */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Body Temperature (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="37.0"
                      value={formData.temperature}
                      onChange={(e) => handleFormChange('temperature', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    />
                  </div>

                  {/* Uterus Firmness */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Uterus Firmness
                    </label>
                    <div className="space-y-2">
                      {['Firm', 'Soft', 'Very Soft'].map((opt) => (
                        <label key={opt} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="uterusFirmness"
                            value={opt}
                            checked={formData.uterusFirmness === opt}
                            onChange={(e) => handleFormChange('uterusFirmness', e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Discharge Smell */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discharge Smell
                    </label>
                    <div className="space-y-2">
                      {['Normal', 'Foul smelling'].map((opt) => (
                        <label key={opt} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="dischargeSmell"
                            value={opt}
                            checked={formData.dischargeSmell === opt}
                            onChange={(e) => handleFormChange('dischargeSmell', e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Consciousness Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Consciousness Level
                    </label>
                    <div className="space-y-2">
                      {['Alert', 'Confused', 'Unresponsive'].map((opt) => (
                        <label key={opt} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="consciousnessLevel"
                            value={opt}
                            checked={formData.consciousnessLevel === opt}
                            onChange={(e) =>
                              handleFormChange('consciousnessLevel', e.target.value)
                            }
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Pain Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pain Level: {formData.painLevel}/10
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={formData.painLevel}
                      onChange={(e) => handleFormChange('painLevel', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#C62828] hover:bg-red-700 text-white font-semibold py-2 rounded-lg"
                  >
                    {loading ? 'Analyzing...' : 'Submit Check-in'}
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>

        {/* AI Result Display */}
        {aiResult && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#1A237E] mb-4">Assessment Result</h3>
            <div className="space-y-3">
              <p>
                <strong>Risk Level:</strong> {aiResult.riskLevel}
              </p>
              <p>
                <strong>Findings:</strong> {aiResult.findings}
              </p>
              <p>
                <strong>Immediate Actions:</strong>
              </p>
              <ul className="list-disc ml-6 space-y-1">
                {aiResult.immediateActions.map((action, idx) => (
                  <li key={idx}>{action}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
