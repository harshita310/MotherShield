import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
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
  <div className="flex items-center justify-center h-screen bg-[#0f0f0f]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-[#f6f7ed] text-xs tracking-widest uppercase font-medium">Loading...</p>
    </div>
  </div>
)

function AppContent() {
  const { language, setLanguage, t } = useLanguage()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const location = useLocation()

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
      <Navbar />

      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-[64px] left-0 w-full bg-red-700 text-white text-[10px] tracking-widest uppercase font-bold text-center py-1 z-40">
          Offline Mode — Local Calculations Active
        </div>
      )}

      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/"           element={<Home />} />
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
