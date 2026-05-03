import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Neuri3D from '../components/Neuri3D'
import { supabase } from '../supabase'
import { applyProfileClass } from '../profileSettings'
import BottomNav from '../components/BottomNav'

export default function Profile() {
  const navigate = useNavigate()
  const [profil, setProfil] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [changementEnCours, setChangementEnCours] = useState(false)
  const [messageConfirmation, setMessageConfirmation] = useState(null)

  useEffect(() => {
    async function chargerProfil() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login'); return }
      const { data } = await supabase.from('profils').select('*').eq('user_id', user.id).single()
      setProfil(data)
      if (data?.profil_type) applyProfileClass(data.profil_type)
      setChargement(false)
    }
    chargerProfil()
  }, [])

  const handleChangerProfil = async (nouveauProfil) => {
    if (nouveauProfil === profil?.profil_type || changementEnCours) return
    setChangementEnCours(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profils').update({ profil_type: nouveauProfil }).eq('user_id', user.id)
    setProfil(p => ({ ...p, profil_type: nouveauProfil }))
    applyProfileClass(nouveauProfil)
    setMessageConfirmation(`Profil ${nouveauProfil === 'tdah' ? 'TDAH' : 'Dyslexie'} activé ✓`)
    setTimeout(() => setMessageConfirmation(null), 2500)
    setChangementEnCours(false)
  }

  const handleDeconnexion = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (chargement) {
    return (
      <div style={{ minHeight: '100vh', background: '#090E1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(139,92,246,0.2)', borderTop: '3px solid #8B5CF6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}/>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const neurColor = profil?.profil_type === 'dyslexie' ? '#3B82F6' : '#8B5CF6'
  const estTDAH = profil?.profil_type === 'tdah'

  return (
    <div style={{ minHeight: '100vh', background: '#090E1A', paddingBottom: '100px', maxWidth: '430px', margin: '0 auto' }}>

      {/* ─── EN-TÊTE ────────────────────────────────────────── */}
      <div style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.18) 0%, #090E1A 60%)', padding: '52px 24px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '130px', height: '130px', marginBottom: '16px' }}>
          <Neuri3D color={neurColor} />
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 8px', textAlign: 'center' }}>
          {profil?.nom || 'Mon profil'}
        </h1>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: estTDAH ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.15)', border: `1px solid ${estTDAH ? 'rgba(139,92,246,0.4)' : 'rgba(59,130,246,0.4)'}`, borderRadius: '20px', padding: '6px 14px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: estTDAH ? '#8B5CF6' : '#3B82F6' }}/>
          <span style={{ fontSize: '13px', fontWeight: '700', color: estTDAH ? '#C4B5FD' : '#93C5FD' }}>
            {estTDAH ? 'Profil TDAH' : 'Profil Dyslexie'}
          </span>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>

        {/* ─── STATS ──────────────────────────────────────────── */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>Mes stats</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { label: 'XP total', value: profil?.xp || 0, suffix: ' XP', color: '#8B5CF6' },
              { label: 'Mots appris', value: profil?.mots_appris || 0, suffix: '', color: '#58CC02' },
              { label: 'Leçons', value: profil?.lecons_completees || 0, suffix: '', color: '#F59E0B' },
              { label: 'Temps total', value: profil?.temps_total_minutes || 0, suffix: ' min', color: '#3B82F6' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '16px' }}>
                <p style={{ fontSize: '24px', fontWeight: '900', color: s.color, margin: '0 0 4px' }}>{s.value}{s.suffix}</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── PARAMÈTRES — PROFIL ────────────────────────────── */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>Mon profil d'apprentissage</p>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '8px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'tdah', label: 'TDAH', desc: 'Rapide · Visuel · Stimulant', color: '#8B5CF6', colorBg: 'rgba(139,92,246,0.15)', colorBorder: 'rgba(139,92,246,0.5)' },
                { id: 'dyslexie', label: 'Dyslexie', desc: 'Lent · Lisible · Simple', color: '#3B82F6', colorBg: 'rgba(59,130,246,0.15)', colorBorder: 'rgba(59,130,246,0.5)' },
              ].map(p => {
                const actif = profil?.profil_type === p.id
                return (
                  <div key={p.id} onClick={() => handleChangerProfil(p.id)} style={{ flex: 1, borderRadius: '12px', padding: '14px 10px', cursor: changementEnCours ? 'not-allowed' : 'pointer', background: actif ? p.colorBg : 'transparent', border: actif ? `1.5px solid ${p.colorBorder}` : '1.5px solid transparent', transition: 'all 0.3s ease', textAlign: 'center' }}>
                    <p style={{ fontSize: '15px', fontWeight: '800', color: actif ? p.color : 'rgba(255,255,255,0.5)', margin: '0 0 4px', transition: 'color 0.3s ease' }}>{p.label}</p>
                    <p style={{ fontSize: '11px', color: actif ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)', margin: 0, lineHeight: 1.4 }}>{p.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Message de confirmation */}
          <div style={{ height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '8px' }}>
            {messageConfirmation && (
              <p style={{ fontSize: '13px', color: '#58CC02', margin: 0, fontWeight: '600' }}>
                {messageConfirmation}
              </p>
            )}
          </div>
        </div>

        {/* ─── DÉCONNEXION ────────────────────────────────────── */}
        <button onClick={handleDeconnexion} style={{ width: '100%', height: '52px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5', borderRadius: '16px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease' }}>
          Se déconnecter
        </button>

      </div>

      <BottomNav />
    </div>
  )
}