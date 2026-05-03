import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Neuri3D from '../components/Neuri3D'
import BottomNav from '../components/BottomNav'

function PopupReset({ onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
      <div style={{ background: '#0F1626', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '28px 24px', maxWidth: '340px', width: '100%' }}>
        <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '22px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 12px', textAlign: 'center' }}>Recommencer depuis le début ?</h2>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', color: 'rgba(255,255,255,0.6)', textAlign: 'center', margin: '0 0 24px', lineHeight: 1.5 }}>Ta progression sera remise à zéro, mais tu pourras refaire les leçons.</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} style={{ flex: 1, height: '50px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderRadius: '14px', fontSize: '15px', fontFamily: 'Nunito, sans-serif', fontWeight: '700', cursor: 'pointer' }}>Annuler</button>
          <button onClick={onConfirm} style={{ flex: 1, height: '50px', background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', border: 'none', color: '#FFFFFF', borderRadius: '14px', fontSize: '15px', fontFamily: 'Nunito, sans-serif', fontWeight: '700', cursor: 'pointer' }}>Oui, recommencer</button>
        </div>
      </div>
    </div>
  )
}

function EcranToutComplete({ profil, leconsCompletes, navigate, onReset, onContinuer }) {
  const [popup, setPopup] = useState(false)

  const handleConfirmReset = async () => {
    setPopup(false)
    await onReset()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(88,204,2,0.18) 0%, #090E1A 55%)', paddingBottom: '100px', maxWidth: '430px', margin: '0 auto' }}>
      <div style={{ padding: '52px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: '0 0 2px' }}>Salut</p>
            <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '24px', fontWeight: '900', color: '#FFFFFF', margin: 0 }}>{profil?.nom || 'toi'}</h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>💧</span>
              <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: '14px', fontWeight: '900', color: '#F59E0B' }}>{profil?.streak || 0}</span>
            </div>
            <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px' }}>★</span>
              <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: '14px', fontWeight: '900', color: '#A78BFA' }}>{profil?.xp || 0} XP</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
          <div style={{ width: '160px', height: '160px', marginBottom: '16px' }}>
            <Neuri3D color="#58CC02" />
          </div>
          <div style={{ background: 'rgba(88,204,2,0.15)', border: '1px solid rgba(88,204,2,0.3)', borderRadius: '20px', padding: '6px 16px', marginBottom: '16px' }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: '700', color: '#86EFAC', margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>🎉 Bravo !</p>
          </div>
          <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '28px', fontWeight: '900', color: '#FFFFFF', textAlign: 'center', margin: '0 0 8px', lineHeight: 1.2 }}>Tu as tout complété !</h1>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', color: 'rgba(255,255,255,0.6)', textAlign: 'center', margin: '0 0 32px', maxWidth: '280px', lineHeight: 1.5 }}>Continue à t'entraîner pour ancrer ce que tu as appris.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          {[
            { label: 'XP gagnés', value: profil?.xp || 0, color: '#8B5CF6' },
            { label: 'Mots appris', value: profil?.mots_appris || 0, color: '#58CC02' },
            { label: 'Leçons', value: profil?.lecons_completees || 0, color: '#F59E0B' },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '14px 8px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '22px', fontWeight: '900', color: s.color, margin: '0 0 2px' }}>{s.value}</p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        <button onClick={onContinuer} style={{ width: '100%', height: '54px', background: 'linear-gradient(135deg, #58CC02, #3DAD00)', color: '#FFFFFF', border: 'none', borderRadius: '16px', fontSize: '16px', fontFamily: 'Nunito, sans-serif', fontWeight: '800', cursor: 'pointer', boxShadow: '0 0 28px rgba(88,204,2,0.35)', marginBottom: '12px' }}>Continuer à m'entraîner</button>

        <button onClick={() => setPopup(true)} style={{ width: '100%', height: '50px', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', fontSize: '14px', fontFamily: 'Nunito, sans-serif', fontWeight: '600', cursor: 'pointer' }}>Revoir depuis le début</button>
      </div>

      {popup && <PopupReset onConfirm={handleConfirmReset} onCancel={() => setPopup(false)} />}
      <BottomNav />
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [profil, setProfil] = useState(null)
  const [leconSuivante, setLeconSuivante] = useState(null)
  const [toutComplete, setToutComplete] = useState(false)
  const [chargement, setChargement] = useState(true)

  const charger = async () => {
    setChargement(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }

    const { data: p } = await supabase.from('profils').select('*').eq('user_id', user.id).single()
    setProfil(p)

    const { data: lecons } = await supabase.from('lecons').select('id, titre, duree_minutes, nombre_mots, ordre').order('ordre')
    const { data: progressions } = await supabase.from('progression').select('lecon_id').eq('user_id', user.id)

    const idsCompletes = new Set((progressions || []).map(pr => pr.lecon_id))
    const prochaine = lecons.find(l => !idsCompletes.has(l.id))

    if (!prochaine) {
      setToutComplete(true)
      setLeconSuivante(null)
    } else {
      setToutComplete(false)
      setLeconSuivante(prochaine)
    }
    setChargement(false)
  }

  useEffect(() => { charger() }, [])

  const handleReset = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('progression').delete().eq('user_id', user.id)
    await supabase.from('profils').update({ lecons_completees: 0, mots_appris: 0 }).eq('user_id', user.id)
    await charger()
  }

  const handleContinuer = async () => {
    const { data: lecons } = await supabase.from('lecons').select('id').order('ordre')
    if (!lecons || lecons.length === 0) return
    const aleatoire = lecons[Math.floor(Math.random() * lecons.length)]
    navigate(`/lesson?lecon=${aleatoire.id}`)
  }

  if (chargement) {
    return (
      <div style={{ minHeight: '100vh', background: '#090E1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(139,92,246,0.2)', borderTop: '3px solid #8B5CF6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}/>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (toutComplete) {
    return <EcranToutComplete profil={profil} navigate={navigate} onReset={handleReset} onContinuer={handleContinuer} />
  }

  const couleurNeuri = profil?.profil_type === 'dyslexie' ? '#3B82F6' : '#8B5CF6'
  const xpObjectif = (profil?.objectif_minutes || 10) * 6
  const xpAujourdhui = Math.min(profil?.xp || 0, xpObjectif)
  const xpRestant = Math.max(xpObjectif - xpAujourdhui, 0)
  const pourcentage = (xpAujourdhui / xpObjectif) * 100

  return (
    <div style={{ minHeight: '100vh', background: '#090E1A', paddingBottom: '100px', maxWidth: '430px', margin: '0 auto' }}>
      <div style={{ padding: '52px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: '0 0 2px' }}>Salut</p>
            <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '24px', fontWeight: '900', color: '#FFFFFF', margin: 0 }}>{profil?.nom || 'toi'}</h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>💧</span>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '14px', fontWeight: '900', color: '#F59E0B', margin: 0 }}>{profil?.streak || 0}</p>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '9px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>jours de série</p>
              </div>
            </div>
            <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '12px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px' }}>★</span>
              <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: '15px', fontWeight: '900', color: '#A78BFA' }}>{profil?.xp || 0} XP</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
          <div style={{ width: '180px', height: '180px' }}>
            <Neuri3D color={couleurNeuri} />
          </div>
        </div>

        <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '26px', fontWeight: '900', color: '#FFFFFF', textAlign: 'center', margin: '0 0 4px' }}>{leconSuivante?.duree_minutes || 6} min pour progresser</h2>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', color: '#A78BFA', textAlign: 'center', margin: '0 0 24px' }}>Ta leçon t'attend</p>

        <div onClick={() => navigate(`/lesson?lecon=${leconSuivante.id}`)} style={{ background: 'rgba(139,92,246,0.08)', border: '1.5px solid rgba(139,92,246,0.4)', borderRadius: '20px', padding: '20px 22px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 0 28px rgba(139,92,246,0.18)', marginBottom: '20px' }}>
          <div style={{ fontSize: '40px' }}>📚</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: '700', color: '#A78BFA', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>Leçon suivante</p>
            <h3 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '20px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 4px' }}>{leconSuivante?.titre}</h3>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>{leconSuivante?.nombre_mots} mots · ~{leconSuivante?.duree_minutes} min</p>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '16px 18px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '15px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>Objectif du jour</p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', margin: 0 }}>
              <span style={{ color: '#86EFAC', fontWeight: '700' }}>Encore {xpRestant} XP</span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}> {xpAujourdhui}/{xpObjectif}</span>
            </p>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', position: 'relative' }}>
            <div style={{ height: '100%', width: `${pourcentage}%`, background: 'linear-gradient(90deg, #8B5CF6, #58CC02)', borderRadius: '99px', position: 'relative' }}>
              {pourcentage > 5 && (<div style={{ position: 'absolute', right: '-8px', top: '-4px', width: '16px', height: '16px', background: '#58CC02', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>★</div>)}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '14px 16px' }}>
            <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '24px', fontWeight: '900', color: '#58CC02', margin: '0 0 2px' }}>{profil?.lecons_completees || 0}</p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>Leçons complétées</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '14px 16px' }}>
            <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '24px', fontWeight: '900', color: '#F59E0B', margin: '0 0 2px' }}>{profil?.streak || 0}</p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>Jours de série</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '14px 16px' }}>
            <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '24px', fontWeight: '900', color: '#3B82F6', margin: '0 0 2px' }}>{profil?.mots_appris || 0}</p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>Mots appris</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '14px 16px' }}>
            <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '24px', fontWeight: '900', color: '#A78BFA', margin: '0 0 2px' }}>{profil?.temps_total_minutes || 0}min</p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>Temps total</p>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}