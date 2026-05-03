import { useNavigate, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  {
    label: 'Accueil',
    page: '/dashboard',
    key: 'accueil',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 11 L11 4 L19 11 L19 19 L13 19 L13 14 L9 14 L9 19 L3 19 Z"
          stroke={active ? '#8B5CF6' : 'rgba(255,255,255,0.4)'}
          strokeWidth="1.8" strokeLinejoin="round"
          fill={active ? 'rgba(139,92,246,0.1)' : 'none'}/>
      </svg>
    )
  },
  {
    label: 'Apprendre',
    page: '/learn',
    key: 'apprendre',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 3 L19 8 L19 16 L11 21 L3 16 L3 8 Z"
          stroke={active ? '#8B5CF6' : 'rgba(255,255,255,0.4)'}
          strokeWidth="1.5" strokeLinejoin="round"
          fill={active ? 'rgba(139,92,246,0.1)' : 'none'}/>
      </svg>
    )
  },
  {
    label: 'Progression',
    page: '/stats',
    key: 'progression',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 17 L8 12 L12 15 L19 7"
          stroke={active ? '#8B5CF6' : 'rgba(255,255,255,0.4)'}
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    )
  },
  {
    label: 'Profil',
    page: '/profile',
    key: 'profil',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="8" r="3.5"
          stroke={active ? '#8B5CF6' : 'rgba(255,255,255,0.4)'}
          strokeWidth="1.5"
          fill={active ? 'rgba(139,92,246,0.1)' : 'none'}/>
        <path d="M4 19 C4 15 7 13 11 13 C15 13 18 15 18 19"
          stroke={active ? '#8B5CF6' : 'rgba(255,255,255,0.4)'}
          strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      </svg>
    )
  },
  {
    label: 'Paramètres',
    page: '/settings',
    key: 'paramètres',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="3"
          stroke={active ? '#8B5CF6' : 'rgba(255,255,255,0.4)'}
          strokeWidth="1.5"
          fill={active ? 'rgba(139,92,246,0.1)' : 'none'}/>
        <path d="M11 2 L11 5 M11 17 L11 20 M2 11 L5 11 M17 11 L20 11 M4.5 4.5 L6.5 6.5 M15.5 15.5 L17.5 17.5 M4.5 17.5 L6.5 15.5 M15.5 6.5 L17.5 4.5"
          stroke={active ? '#8B5CF6' : 'rgba(255,255,255,0.4)'}
          strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  }
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  // Détecte automatiquement quel onglet est actif selon l'URL
  const activeKey = NAV_ITEMS.find(item => location.pathname.startsWith(item.page))?.key

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(8,13,24,0.95)', backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '12px 0 24px', display: 'flex', justifyContent: 'space-around',
      maxWidth: 430, margin: '0 auto', zIndex: 100
    }}>
      {NAV_ITEMS.map((item) => {
        const active = activeKey === item.key
        return (
          <div key={item.key} onClick={() => navigate(item.page)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 4, cursor: 'pointer'
          }}>
            {item.icon(active)}
            <span style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 11,
              fontWeight: active ? 700 : 500,
              color: active ? '#8B5CF6' : 'rgba(255,255,255,0.4)'
            }}>{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}