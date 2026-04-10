// Updated: Phase 2 complete
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'
import Navbar from './components/Navbar'
import { useLanguage } from './hooks/useLanguage'

// Lazy-loaded pages
const Home          = lazy(() => import('./pages/Home'))
const Intake        = lazy(() => import('./pages/Intake'))
const Results       = lazy(() => import('./pages/Results'))
const Postpartum    = lazy(() => import('./pages/Postpartum'))
const Dashboard     = lazy(() => import('./pages/Dashboard'))
const PatientHistory = lazy(() => import('./pages/PatientHistory'))
const Timeline      = lazy(() => import('./pages/Timeline'))
const NotFound      = lazy(() => import('./pages/NotFound'))

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-[#F8FAFC]">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700" />
      <p className="text-slate-500 text-sm font-medium">Loading…</p>
    </div>
  </div>
)

function AppContent() {
  const { language, setLanguage, t } = useLanguage()
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true)
      try {
        const pending = JSON.parse(localStorage.getItem('pendingSync') || '[]')
        if (pending.length > 0) {
          console.log(`[MotherShield] Back online — ${pending.length} pending sync item(s) found`)
          localStorage.setItem('pendingSync', '[]')
        }
      } catch (_) {}
    }
    const goOffline = () => setIsOnline(false)

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return (
    <>
      <Navbar language={language} setLanguage={setLanguage} t={t} />

      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-orange-500 text-white text-sm font-semibold text-center py-2 px-4 flex items-center justify-center gap-2 z-40">
          <span>⚠️</span>
          <span>Offline Mode — Using WHO threshold calculations</span>
        </div>
      )}

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"           element={<Home t={t} />} />
          <Route path="/intake"     element={<Intake t={t} language={language} />} />
          <Route path="/results"    element={<Results t={t} />} />
          <Route path="/postpartum" element={<Postpartum />} />
          <Route path="/dashboard"  element={<Dashboard />} />
          <Route path="/history"    element={<PatientHistory t={t} />} />
          <Route path="/timeline"   element={<Timeline />} />
          <Route path="*"           element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
