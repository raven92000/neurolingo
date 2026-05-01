import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Neuri3D from '../components/Neuri3D'
import { supabase } from '../supabase'

function BottomNav() {
  const navigate = useNavigate()
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(9,14,26,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 0 24px', display: 'flex', justifyContent: 'space-around', maxWidth: '430px', margin: '0 auto' }}>
      {[
        { label: 'Accueil', actif: false, page: '/dashboard', icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 11 L11 4 L19 11 L19 19 L13 19 L13 14 L9 14 L9 19 L3 19 Z" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" strokeLinejoin="round" fill="none"/></svg> },
        { label: 'Apprendre', actif: false, page: null, icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 3 L19 8 L19 16 L11 21 L3 16 L3 8 Z" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinejoin="round" fill="none"/></svg> },
        { label: 'Progression', actif: true, page: '/stats', icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 17 L8 12 L12 15 L19 7" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg> },
        { label: 'Profil', actif: false, page: '/profile', icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="8" r="3.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none"/><path d="M4 19 C4 15 7 13 11 13 C15 13 18 15 18 19" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg> },
      ].map((nav, i) => (
        <div key={i} onClick={() => nav.page && navigate(nav.page)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: nav.page ? 'pointer' : 'default', opacity: nav.page ? 1 : 0.4 }}>
          {nav.icon}
          <span style={{ fontSize: '11px', fontWeight: nav.actif ? '700' : '500', color: nav.actif ? '#8B5CF6' : 'rgba(255,255,255,0.4)' }}>{nav.label}</span>
        </div>
      ))}
    </div>
  )
}

// Calcule les XP par jour sur les 7 derniers jours
function calculerXPParJour(progressions, motsParLecon) {
  const aujourdhui = new Date()
  const jours = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(aujourdhui)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    const dateStr = date.toISOString().split('T')[0]
    const xpJour = (progressions || []).reduce((acc, p) => {
      const datePr = new Date(p.completee_le).toISOString().split('T')[0]
      if (datePr === dateStr) {
        const nbMots = motsParLecon[p.lecon_id] || 5
        return acc + (nbMots * 10)
      }
      return acc
    }, 0)
    jours.push({
      date: dateStr,
      label: date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''),
      xp: xpJour,
    })
  }
  return jours
}

// Calcule le streak actuel
function calculerStreak(progressions) {
  if (!progressions || progressions.length === 0) return 0
  const datesUniques = [...new Set(progressions.map(p => new Date(p.completee_le).toISOString().split('T')[0]))].sort().reverse()
  if (datesUniques.length === 0) return 0

  const aujourdhui = new Date().toISOString().split('T')[0]
  const hier = new Date()
  hier.setDate(hier.getDate() - 1)
  const hierStr = hier.toISOString().split('T')[0]

  // Si pas de leçon aujourd'hui ni hier → streak = 0
  if (datesUniques[0] !== aujourdhui && datesUniques[0] !== hierStr) return 0

  let streak = 1
  for (let i = 0; i < datesUniques.length - 1; i++) {
    const d1 = new Date(datesUniques[i])
    const d2 = new Date(datesUniques[i + 1])
    const diff = Math.round((d1 - d2) / (1000 * 60 * 60 * 24))
    if (diff === 1) streak++
    else break
  }
  return streak
}

export default function Stats() {
  const navigate = useNavigate()
  const [profil, setProfil] = useState(null)
  const [xpParJour, setXpParJour] = useState([])
  const [streak, setStreak] = useState(0)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login'); return }

      const { data: p } = await supabase.from('profils').select('*').eq('user_id', user.id).single()
      setProfil(p)

      const { data: progressions } = await supabase.from('progression').select('lecon_id, completee_le').eq('user_id', user.id)
      const { data: lecons } = await supabase.from('lecons').select('id, nombre_mots')
      const motsParLecon = (lecons || []).reduce((acc, l) => ({ ...acc, [l.id]: l.nombre_mots }), {})

      setXpParJour(calculerXPParJour(progressions, motsParLecon))
      setStreak(calculerStreak(progressions))
      setChargement(false)
    }
    charger()
  }, [])

  if (chargement) {
    return (
      <div style={{ minHeight: '100vh', background: '#090E1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(139,92,246,0.2)', borderTop: '3px solid #8B5CF6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}/>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const xpMax = Math.max(...xpParJour.map(j => j.xp), 60)
  const objectifXP = (profil?.objectif_minutes || 10) * 6

  return (
    <div style={{ minHeight: '100vh', background: '#090E1A', paddingBottom: '100px', maxWidth: '430px', margin: '0 auto' }}>

      {/* ─── HEADER ──────────────────────────────────────────── */}
      <div style={{ padding: '52px 24px 16px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 4px' }}>Progression</h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Ta progression cette semaine</p>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* ─── CARTE XP PRINCIPALE ────────────────────────────── */}
        <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(124,58,237,0.08) 100%)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '24px', padding: '28px 24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '24px', opacity: 0.3 }}>⚡</div>
          <p style={{ fontSize: '12px', fontWeight: '700', color: '#A78BFA', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>XP total</p>
          <p style={{ fontSize: '52px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 6px', lineHeight: 1 }}>{profil?.xp || 0}</p>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', margin: 0 }}>
            {(profil?.xp || 0) === 0 ? 'Commence ta première leçon !' : (profil?.xp || 0) < 100 ? 'Bon démarrage 💪' : (profil?.xp || 0) < 500 ? 'Tu progresses bien' : 'Tu cartonnes ! 🚀'}
          </p>
        </div>

        {/* ─── MINI CARDS 2x2 ─────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { label: 'Leçons', value: profil?.lecons_completees || 0, color: '#58CC02', icon: '📚' },
            { label: 'Mots appris', value: profil?.mots_appris || 0, color: '#3B82F6', icon: '🔤' },
            { label: 'Temps total', value: `${profil?.temps_total_minutes || 0}min`, color: '#F59E0B', icon: '⏱️' },
            { label: 'Streak', value: streak, color: '#EF4444', icon: '🔥' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '16px' }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>{s.icon}</div>
              <p style={{ fontSize: '24px', fontWeight: '900', color: s.color, margin: '0 0 2px', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ─── GRAPHIQUE XP 7 JOURS ───────────────────────────── */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '20px' }}>
          <p style={{ fontSize: '14px', fontWeight: '800', color: '#FFFFFF', margin: '0 0 18px' }}>XP cette semaine</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '120px', gap: '6px' }}>
            {xpParJour.map((j, i) => {
              const hauteur = j.xp === 0 ? 4 : Math.max((j.xp / xpMax) * 100, 8)
              const estAujourdhui = i === xpParJour.length - 1
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%' }}>
                  <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ width: '100%', height: `${hauteur}%`, background: estAujourdhui ? 'linear-gradient(180deg, #8B5CF6 0%, #6D28D9 100%)' : j.xp > 0 ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.06)', borderRadius: '8px', transition: 'height 0.6s ease', position: 'relative' }}>
                      {j.xp > 0 && (
                        <span style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', fontWeight: '700', color: estAujourdhui ? '#A78BFA' : 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{j.xp}</span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: estAujourdhui ? '#A78BFA' : 'rgba(255,255,255,0.4)', fontWeight: estAujourdhui ? '700' : '500' }}>{j.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ─── OBJECTIF QUOTIDIEN 7 JOURS ─────────────────────── */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <p style={{ fontSize: '14px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>Objectif quotidien</p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{objectifXP} XP/jour</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px' }}>
            {xpParJour.map((j, i) => {
              const atteint = j.xp >= objectifXP
              const estAujourdhui = i === xpParJour.length - 1
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: atteint ? 'linear-gradient(135deg, #58CC02, #3DAD00)' : 'rgba(255,255,255,0.06)', border: estAujourdhui && !atteint ? '2px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.4s ease' }}>
                    {atteint && (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8 L7 12 L13 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: '10px', color: estAujourdhui ? '#A78BFA' : 'rgba(255,255,255,0.35)', fontWeight: estAujourdhui ? '700' : '500' }}>{j.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ─── MESSAGE NEURI ──────────────────────────────────── */}
        <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '20px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '52px', height: '52px', flexShrink: 0 }}>
            <Neuri3D color="#8B5CF6" />
          </div>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.5 }}>
            {streak >= 3
              ? `Bravo, ${streak} jours d'affilée ! Tu as pris le rythme.`
              : (profil?.xp || 0) === 0
              ? "Lance ta première leçon, c'est parti !"
              : "Continue comme ça, 5 minutes par jour suffisent pour progresser."}
          </p>
        </div>

      </div>

      <BottomNav />
    </div>
  )
}