import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { PROFIL_COLUMNS } from '../utils/profilColumns'
import BottomNavParent from '../components/BottomNavParent'

export default function ParentSettings() {
  const navigate = useNavigate()
  const [parent, setParent] = useState(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login'); return }
      const { data: profil } = await supabase.from('profils').select(PROFIL_COLUMNS).eq('user_id', user.id).single()
      if (profil?.role !== 'parent') { navigate('/dashboard'); return }
      setParent(profil)
      setChargement(false)
    }
    charger()
  }, [navigate])

  const handleLogout = async () => {
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

  const sections = [
    { icon: '👤', titre: 'Profil parent', desc: 'Modifier mes informations', action: () => alert('Bientôt disponible') },
    { icon: '👨‍👩‍👧', titre: 'Enfants liés', desc: 'Gérer les comptes de mes enfants', action: () => navigate('/parent-children') },
    { icon: '🔔', titre: 'Notifications', desc: 'Gérer les alertes et rappels', action: () => alert('Bientôt disponible') },
    { icon: '🎯', titre: 'Objectifs & préférences', desc: "Définir les objectifs d'apprentissage", action: () => alert('Bientôt disponible') },
    { icon: '⏰', titre: "Contrôle du temps d'écran", desc: 'Définir des limites si besoin', action: () => alert('Bientôt disponible') },
    { icon: '🔒', titre: 'Confidentialité', desc: 'Gérer mes données', action: () => alert('Bientôt disponible') },
    { icon: '💬', titre: 'Aide & support', desc: 'FAQ et assistance', action: () => alert('Bientôt disponible') },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#090E1A', paddingBottom: '100px', maxWidth: '430px', margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ padding: '52px 24px 16px' }}>
        <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '28px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 4px' }}>Paramètres</h1>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{parent?.nom}</p>
      </div>

      <div style={{ padding: '0 20px' }}>

        {/* IDENTIFIANT PARENT */}
        {parent?.identifiant_parent && (
          <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(124,58,237,0.05))', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '20px', padding: '18px', marginBottom: '20px' }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: '700', color: '#A78BFA', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>Mon identifiant parent</p>
            <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '22px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 4px', letterSpacing: '0.05em' }}>{parent.identifiant_parent}</p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Conservez-le précieusement</p>
          </div>
        )}

        {/* LISTE PARAMÈTRES */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden' }}>
          {sections.map((s, i) => (
            <div
              key={i}
              onClick={s.action}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '16px 18px',
                borderBottom: i < sections.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                {s.icon}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '14px', fontWeight: '700', color: '#FFFFFF', margin: '0 0 2px' }}>{s.titre}</p>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{s.desc}</p>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '18px' }}>›</span>
            </div>
          ))}
        </div>

        {/* SECTION BIENVEILLANCE */}
        <div style={{ background: 'rgba(85,214,0,0.06)', border: '1px solid rgba(85,214,0,0.15)', borderRadius: '20px', padding: '18px', marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>💜</span>
            <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '14px', fontWeight: '800', color: '#86EFAC', margin: 0 }}>Expérience bienveillante</p>
          </div>
          <ul style={{ margin: 0, padding: '0 0 0 4px', listStyle: 'none' }}>
            {[
              'Pas de notes ni de classement',
              'Aucun message anxiogène',
              'Conseils positifs et adaptés',
              'Conçu pour les enfants neurodivergents',
            ].map((t, i) => (
              <li key={i} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: '0 0 4px', lineHeight: 1.4 }}>
                · {t}
              </li>
            ))}
          </ul>
        </div>

        {/* DÉCONNEXION */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%', height: '52px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#FCA5A5', borderRadius: '14px',
            fontSize: '15px', fontFamily: 'Nunito, sans-serif', fontWeight: '700',
            cursor: 'pointer', marginTop: '20px',
          }}
        >
          Se déconnecter
        </button>

      </div>

      <BottomNavParent />
    </div>
  )
}