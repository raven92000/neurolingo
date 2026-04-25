import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Neuri3D from '../components/Neuri3D'
import { supabase } from '../supabase'

const pulseStyle = `
  @keyframes cardPulse {
    0%, 100% { box-shadow: 0 0 24px rgba(139,92,246,0.15), 0 0 0 0 rgba(139,92,246,0.08); }
    50% { box-shadow: 0 0 36px rgba(139,92,246,0.28), 0 0 0 8px rgba(139,92,246,0.04); }
  }
  @keyframes progressStar {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
  }
`

function BottomNav({ active }) {
  const navigate = useNavigate()
  const items = [
    { id: 'home', label: 'Accueil', path: '/dashboard', icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 9.5L11 3L19 9.5V19C19 19.6 18.6 20 18 20H14V15H8V20H4C3.4 20 3 19.6 3 19V9.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    )},
    { id: 'learn', label: 'Apprendre', path: '/lesson', icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 5L11 2L19 5V10C19 14.4 15.5 18.5 11 20C6.5 18.5 3 14.4 3 10V5Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    )},
    { id: 'stats', label: 'Statistiques', path: '/dashboard', icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 16L8 10L12 13L16 7L20 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )},
    { id: 'profile', label: 'Profil', path: '/dashboard', icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" fill="none"/>
        <path d="M4 19C4 15.7 7.1 13 11 13C14.9 13 18 15.7 18 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
      </svg>
    )},
  ]

  return (
    <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '430px', background: 'rgba(9,14,26,0.95)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-around', padding: '12px 0 28px', zIndex: 100 }}>
      {items.map(item => (
        <div key={item.id} onClick={() => navigate(item.path)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: active === item.id ? '#8B5CF6' : 'rgba(255,255,255,0.28)', cursor: 'pointer', transition: 'color 0.2s ease' }}>
          {item.icon}
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '10px', fontWeight: '500' }}>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [profil, setProfil] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [cardPressed, setCardPressed] = useState(false)

  useEffect(() => {
    async function chargerProfil() {
      const { data, error } = await supabase
        .from('profils')
        .select('*')
        .limit(1)
        .single()
      if (!error && data) setProfil(data)
      setChargement(false)
    }
    chargerProfil()
  }, [])

  if (chargement) return (
    <div style={{ minHeight: '100vh', background: '#090E1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'DM Sans, sans-serif', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Chargement...</p>
    </div>
  )

  const xp = profil?.xp ?? 0
  const streak = profil?.streak ?? 0
  const lecons = profil?.lecons_completees ?? 0
  const mots = profil?.mots_appris ?? 0
  const temps = profil?.temps_total_minutes ?? 0
  const nom = profil?.nom ?? 'Wells'
  const objectif = 60
  const progression = xp % objectif
  const restant = objectif - progression

  const formatTemps = (minutes) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h > 0 ? `${h}h${m > 0 ? m : ''}` : `${m}min`
  }

  return (
    <>
      <style>{pulseStyle}</style>
      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(109,40,217,0.14) 0%, #090E1A 55%)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px 100px', maxWidth: '430px', margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '56px 0 12px' }}>
          <div>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: '0 0 2px' }}>Salut</p>
            <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '22px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>{nom}</p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: '14px', padding: '8px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1C7 1 4 4.5 4 7.5C4 9.4 5.3 11 7 11C8.7 11 10 9.4 10 7.5C10 4.5 7 1 7 1Z" fill="#F59E0B"/>
                </svg>
                <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: '16px', fontWeight: '800', color: '#F59E0B' }}>{streak}</span>
              </div>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '9px', color: 'rgba(245,158,11,0.6)' }}>jours de série</span>
            </div>

            <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: '14px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L8.5 5.5H13L9.5 8L11 12.5L7 10L3 12.5L4.5 8L1 5.5H5.5L7 1Z" fill="#8B5CF6"/>
              </svg>
              <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: '16px', fontWeight: '800', color: '#8B5CF6' }}>{xp} XP</span>
            </div>
          </div>
        </div>

        {/* NEURI + MESSAGE */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ width: '155px', height: '155px', marginBottom: '10px' }}>
            <Neuri3D color="#8B5CF6" />
          </div>
          <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '26px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 4px', textAlign: 'center' }}>
            4 min pour progresser
          </p>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(139,92,246,0.8)', margin: 0 }}>
            Ta leçon t'attend
          </p>
        </div>

        {/* CARTE LEÇON */}
        <div
          onClick={() => navigate('/lesson')}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          onMouseDown={() => setCardPressed(true)}
          onMouseUp={() => setCardPressed(false)}
          onTouchStart={() => setCardPressed(true)}
          onTouchEnd={() => setCardPressed(false)}
          style={{ width: '100%', background: 'rgba(139,92,246,0.12)', backdropFilter: 'blur(20px)', border: '1.5px solid rgba(139,92,246,0.3)', borderRadius: '22px', padding: '22px', marginBottom: '14px', cursor: 'pointer', animation: 'cardPulse 2.5s ease-in-out infinite', transform: cardPressed ? 'scale(0.98)' : 'scale(1)', transition: 'transform 0.15s ease' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '72px', height: '72px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '52px', filter: 'drop-shadow(0 4px 12px rgba(124,58,237,0.4))' }}>
              📚
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'rgba(167,139,250,0.7)', margin: '0 0 4px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: '500' }}>
                Chapitre 1 · Leçon 1
              </p>
              <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '20px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 5px' }}>
                Les salutations
              </p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.38)', margin: 0 }}>
                5 mots · ~6 min
              </p>
            </div>
          </div>
        </div>

        {/* OBJECTIF DU JOUR */}
        <div style={{ width: '100%', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '18px 20px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '15px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>Objectif du jour</p>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#58CC02', fontWeight: '600' }}>Encore {restant} XP</span>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginLeft: '6px' }}>{progression}/{objectif}</span>
            </div>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.07)', borderRadius: '99px', overflow: 'visible', position: 'relative' }}>
            <div style={{ width: `${(progression / objectif) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #7C3AED, #58CC02)', borderRadius: '99px', position: 'relative' }}>
              <div style={{ position: 'absolute', right: '-8px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', background: '#58CC02', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(88,204,2,0.5)', animation: 'progressStar 2s ease-in-out infinite' }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 1L6 3.8H9L6.8 5.5L7.6 8.5L5 7L2.4 8.5L3.2 5.5L1 3.8H4L5 1Z" fill="white"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* STATS RAPIDES */}
        <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { label: 'Leçons complétées', value: `${lecons}`, color: '#58CC02' },
            { label: 'Jours de série', value: `${streak}`, color: '#F59E0B' },
            { label: 'Mots appris', value: `${mots}`, color: '#3B82F6' },
            { label: 'Temps total', value: formatTemps(temps), color: '#8B5CF6' },
          ].map((stat, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px' }}>
              <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '24px', fontWeight: '900', color: stat.color, margin: '0 0 4px' }}>{stat.value}</p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>{stat.label}</p>
            </div>
          ))}
        </div>

      </div>
      <BottomNav active="home" />
    </>
  )
}