import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'

export default function Home() {
  return (
    <div style={{ background: '#0f0f0f', minHeight: '100vh', paddingTop: '64px' }}>
      
      {/* HERO */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 80px',
        position: 'relative',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at 20% 50%, rgba(198,40,40,0.08) 0%, transparent 60%)'
      }}>
        
        {/* Grid background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none'
        }}/>
        
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(198,40,40,0.1)', border: '1px solid rgba(198,40,40,0.3)',
          borderRadius: '20px', padding: '6px 16px', width: 'fit-content',
          marginBottom: '32px', animation: 'fadeUp 0.6s ease forwards'
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C62828' }}/>
          <span style={{ color: '#C62828', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
            AI-Powered Maternal Health
          </span>
        </div>
        
        {/* Heading */}
        <h1 style={{ 
          fontSize: 'clamp(48px, 7vw, 96px)',
          fontWeight: 800, lineHeight: 1.05,
          color: '#f6f7ed', marginBottom: '24px',
          animation: 'fadeUp 0.8s ease 0.1s both'
        }}>
          Every Mother<br/>
          <span style={{ color: 'rgba(246,247,237,0.3)', fontWeight: 300 }}>Deserves to</span><br/>
          <span style={{ 
            background: 'linear-gradient(135deg, #f6f7ed, #C62828)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>Come Home.</span>
        </h1>
        
        <p style={{
          fontSize: '18px', color: 'rgba(246,247,237,0.5)',
          maxWidth: '500px', lineHeight: 1.7, marginBottom: '48px',
          animation: 'fadeUp 0.8s ease 0.2s both'
        }}>
          AI risk assessment for India's 1 million ASHA workers. Identify high-risk pregnancies before complications occur.
        </p>
        
        <div style={{ display: 'flex', gap: '16px', animation: 'fadeUp 0.8s ease 0.3s both' }}>
          <Link to="/intake" style={{
            background: '#C62828', color: '#fff',
            padding: '14px 32px', borderRadius: '8px',
            textDecoration: 'none', fontSize: '15px', fontWeight: 600,
            boxShadow: '0 8px 32px rgba(198,40,40,0.3)'
          }}>Start Assessment →</Link>
          <Link to="/education" style={{
            border: '1px solid rgba(255,255,255,0.15)', color: '#f6f7ed',
            padding: '14px 32px', borderRadius: '8px',
            textDecoration: 'none', fontSize: '15px', fontWeight: 400
          }}>Learn More</Link>
        </div>
        
        {/* Floating stat bottom left */}
        <div style={{ position: 'absolute', bottom: '40px', left: '80px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', textTransform: 'uppercase' }}>
            295,000 preventable deaths per year
          </span>
        </div>
        
        {/* Floating mock card top right */}
        <div style={{
          position: 'absolute', right: '80px', top: '50%', transform: 'translateY(-50%)',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '24px', width: '280px',
          animation: 'float 4s ease-in-out infinite'
        }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Risk Assessment</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#ef4444', marginBottom: '8px' }}>CRITICAL</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>Severe preeclampsia detected</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {['BP: 168/112 ⚠️', 'Hb: 6.8 g/dL ⚠️', 'Age: 16 ⚠️'].map(item => (
              <div key={item} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', background: 'rgba(239,68,68,0.1)', padding: '4px 10px', borderRadius: '4px' }}>{item}</div>
            ))}
          </div>
        </div>
      </section>
      
      {/* MARQUEE */}
      <div style={{ background: '#C62828', padding: '14px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', animation: 'marquee 20s linear infinite', whiteSpace: 'nowrap' }}>
          {[...Array(2)].map((_, i) => (
            <span key={i} style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '3px', color: '#fff', textTransform: 'uppercase', marginRight: '48px' }}>
              AI RISK ASSESSMENT &nbsp;—&nbsp; MATERNAL HEALTH &nbsp;—&nbsp; ASHA WORKERS &nbsp;—&nbsp; RURAL INDIA &nbsp;—&nbsp; SAVE LIVES &nbsp;—&nbsp; WHO GUIDELINES &nbsp;—&nbsp; 44,000 LIVES AT RISK &nbsp;—&nbsp;
            </span>
          ))}
        </div>
      </div>
      
      {/* STATS */}
      <section style={{ padding: '120px 80px', background: '#0f0f0f' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
          {[
            { num: '295,000', label: 'Maternal deaths yearly globally' },
            { num: '44,000', label: 'Deaths in India alone' },
            { num: '37%', label: 'Reduction with AI early warning' }
          ].map((stat, i) => (
            <div key={i} style={{ padding: '60px 48px', background: '#0f0f0f' }}>
              <div style={{ fontSize: '64px', fontWeight: 800, color: '#f6f7ed', lineHeight: 1, marginBottom: '12px', fontFamily: 'Playfair Display, serif' }}>{stat.num}</div>
              <div style={{ fontSize: '14px', color: 'rgba(246,247,237,0.4)', lineHeight: 1.5 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>
      
      {/* FEATURES */}
      <section style={{ padding: '0 80px 120px' }}>
        <div style={{ marginBottom: '64px' }}>
          <div style={{ fontSize: '12px', color: '#C62828', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '16px' }}>Capabilities</div>
          <h2 style={{ fontSize: '48px', fontWeight: 700, color: '#f6f7ed' }}>Built for the field.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.06)' }}>
          {[
            { num: '01', icon: '🔬', title: 'Instant Risk Assessment', desc: 'AI analyzes 8 clinical vitals in under 10 seconds using WHO guidelines and Llama 3.3 70B reasoning.' },
            { num: '02', icon: '📋', title: 'Auto Referral Letter', desc: 'Formal medical referral generated instantly, pre-filled with patient vitals and risk findings.' },
            { num: '03', icon: '🏥', title: 'Nearest Hospital', desc: 'GPS-powered facility finder locates the closest maternity hospital with ICU and blood bank info.' }
          ].map((f, i) => (
            <div key={i} style={{
              padding: '48px', background: '#0f0f0f',
              borderLeft: '3px solid transparent',
              transition: 'border-color 0.3s ease, background 0.3s ease',
              cursor: 'default'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderLeftColor = '#C62828'; e.currentTarget.style.background = 'rgba(198,40,40,0.04)' }}
            onMouseLeave={e => { e.currentTarget.style.borderLeftColor = 'transparent'; e.currentTarget.style.background = '#0f0f0f' }}>
              <div style={{ fontSize: '11px', color: '#C62828', letterSpacing: '2px', marginBottom: '24px' }}>{f.num}</div>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>{f.icon}</div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#f6f7ed', marginBottom: '12px' }}>{f.title}</div>
              <div style={{ fontSize: '14px', color: 'rgba(246,247,237,0.4)', lineHeight: 1.7 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>
      
      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '60px 80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>© 2025 MotherShield. Built for India's ASHA workers.</div>
        <div style={{ fontSize: '32px', fontWeight: 800, color: 'rgba(255,255,255,0.06)', letterSpacing: '-1px' }}>MOTHERSHIELD</div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>SDG 3 · Good Health</div>
      </footer>
    </div>
  )
}