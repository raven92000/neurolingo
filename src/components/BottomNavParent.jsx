import { useNavigate, useLocation } from 'react-router-dom'

export default function BottomNavParent() {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname

  const items = [
    { path: '/parent-dashboard', label: 'Accueil', icon: '🏠' },
    { path: '/parent-children', label: 'Enfants', icon: '👨‍👩‍👧' },
    { path: '/parent-settings', label: 'Paramètres', icon: '⚙️' },
  ]

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(9, 14, 26, 0.92)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '12px 0 28px',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      maxWidth: '430px', margin: '0 auto',
    }}>
      {items.map(item => {
        const actif = path === item.path
        return (
          <div
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '4px', cursor: 'pointer',
              opacity: actif ? 1 : 0.5, transition: 'opacity 0.2s ease',
            }}
          >
            <span style={{ fontSize: '22px' }}>{item.icon}</span>
            <span style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              fontWeight: actif ? '700' : '500',
              color: actif ? '#A78BFA' : 'rgba(255,255,255,0.6)',
            }}>
              {item.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}