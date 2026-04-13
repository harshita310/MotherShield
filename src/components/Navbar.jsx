import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const location = useLocation()
  
  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: 'rgba(15,15,15,0.9)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 40px'
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C62828' }}/>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '8px', height: '8px', borderRadius: '50%', background: '#C62828', animation: 'pulse-ring 1.5s ease-out infinite' }}/>
        </div>
        <span style={{ color: '#f6f7ed', fontWeight: 700, fontSize: '18px', letterSpacing: '-0.5px' }}>MotherShield</span>
      </Link>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        {[['/', 'Home'], ['/dashboard', 'Dashboard'], ['/history', 'History'], ['/timeline', 'Timeline'], ['/education', 'Learn']].map(([path, label]) => (
          <Link key={path} to={path} style={{
            color: location.pathname === path ? '#C62828' : 'rgba(246,247,237,0.5)',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 500,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            borderBottom: location.pathname === path ? '1px solid #C62828' : 'none',
            paddingBottom: '2px'
          }}>{label}</Link>
        ))}
        <Link to="/intake" style={{
          background: '#C62828',
          color: '#ffffff',
          padding: '8px 20px',
          borderRadius: '6px',
          textDecoration: 'none',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.5px'
        }}>New Assessment</Link>
      </div>
    </nav>
  )
}
