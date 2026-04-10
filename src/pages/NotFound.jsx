import { Link } from 'react-router-dom'
import { useEffect } from 'react'

export default function NotFound() {
  useEffect(() => {
    document.title = 'MotherShield — Page Not Found'
  }, [])

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="text-8xl mb-6">🏥</div>
        <h1 className="text-4xl font-bold text-[#1A237E] mb-3">404</h1>
        <h2 className="text-xl font-semibold text-slate-700 mb-4">Page Not Found</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">
          The page you're looking for doesn't exist. It may have been moved or the URL is incorrect.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-[#C62828] hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-xl transition"
        >
          ❤️ Go Home
        </Link>
      </div>
    </div>
  )
}
