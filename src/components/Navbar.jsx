import { Link } from 'react-router-dom'

export default function Navbar({ language, setLanguage, t }) {
  const tFn = t || ((k) => k)
  const lang = language || 'en'

  function toggleLang() {
    if (setLanguage) setLanguage(lang === 'en' ? 'hi' : 'en')
  }

  return (
    <nav className="bg-white h-[70px] shadow-sm" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Left Side */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
          <span className="text-2xl">❤️</span>
          <div>
            <p className="text-[22px] font-bold text-[#1A237E] leading-tight">MotherShield</p>
            <p className="text-[11px] text-slate-600 leading-none">AI Maternal Risk Platform</p>
          </div>
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Dashboard */}
          <Link to="/dashboard" className="hidden md:block text-slate-600 hover:text-slate-900 font-medium transition text-sm">
            {tFn('navDash')}
          </Link>

          {/* History */}
          <Link to="/history" className="hidden md:block text-slate-600 hover:text-slate-900 font-medium transition text-sm">
            {tFn('navHistory')}
          </Link>

          {/* Timeline */}
          <Link to="/timeline" className="hidden md:block text-slate-600 hover:text-slate-900 font-medium transition text-sm">
            {tFn('navTimeline')}
          </Link>

          {/* Language Toggle */}
          <button
            onClick={toggleLang}
            className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition"
            title="Toggle language"
          >
            {lang === 'en' ? '🇮🇳 हिं' : '🇬🇧 EN'}
          </button>

          {/* New Assessment Button */}
          <Link
            to="/intake"
            className="bg-[#C62828] hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-full transition text-sm"
          >
            {tFn('navNew')}
          </Link>
        </div>
      </div>
    </nav>
  )
}
