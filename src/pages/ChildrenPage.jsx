import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Neuri2D from '../components/Neuri2D'
import BottomNavParent from '../components/BottomNavParent'
import { getVersionFromDate } from '../utils/neuriUtils'

// TODO: factoriser dans utils/languages.js (duplique aussi ParentDashboard.jsx)
const DRAPEAUX = { en: '🇬🇧', es: '🇪🇸', de: '🇩🇪', pt: '🇵🇹' }
const NOMS_LANGUES = { en: 'Anglais', es: 'Espagnol', de: 'Allemand', pt: 'Portugais' }

const NIVEAUX_CONFIG = [
  { numero: 1, nom: 'Découverte', chapitresNumeros: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
  { numero: 2, nom: 'Les Bases', chapitresNumeros: [9] },
  { numero: 3, nom: 'Le Quotidien', chapitresNumeros: [10] },
  { numero: 4, nom: "L'Autonomie", chapitresNumeros: [11] },
]

function calculerAge(dateNaissance) {
  if (!dateNaissance) return null
  const today = new Date()
  const birth = new Date(dateNaissance)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default function ChildrenPage() {
  const navigate = useNavigate()
  const [enfants, setEnfants] = useState([])
  const [erreurChargement, setErreurChargement] = useState(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    async function charger() {
      try {
        setErreurChargement(null)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { navigate('/login'); return }

        const { data: profil, error: erreurProfil } = await supabase
          .from('profils').select('role').eq('user_id', user.id).single()
        if (erreurProfil) throw erreurProfil
        if (profil?.role !== 'parent') { navigate('/dashboard'); return }

        const { data: liens, error: erreurLiens } = await supabase
          .from('parent_child_links')
          .select('child_id')
          .eq('parent_id', user.id)
        if (erreurLiens) throw erreurLiens

        const childIds = (liens || []).map(l => l.child_id)
        if (childIds.length > 0) {
          const { data: profilsEnfants, error: erreurEnfants } = await supabase
            .from('profils')
            .select('*, langues(code, nom, emoji)')
            .in('user_id', childIds)
          if (erreurEnfants) throw erreurEnfants
          setEnfants(profilsEnfants || [])
        }
      } catch (error) {
        console.error('Erreur chargement Mes enfants', error)
        setErreurChargement('Impossible de charger la liste des enfants, réessaye plus tard')
      } finally {
        setChargement(false)
      }
    }
    charger()
  }, [navigate])

  if (chargement) {
    return (
      <div style={{ minHeight: '100vh', background: '#090E1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(139,92,246,0.2)', borderTop: '3px solid #8B5CF6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}/>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#090E1A', paddingBottom: '100px', maxWidth: '430px', margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ padding: '52px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '28px', fontWeight: '900', color: '#FFFFFF', margin: 0 }}>Mes enfants</h1>
        <button
          onClick={() => navigate('/parent-create-child')}
          style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', border: 'none', color: '#FFFFFF', fontSize: '22px', fontWeight: '300', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}
          aria-label="Ajouter un enfant"
        >
          +
        </button>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {erreurChargement && (
          <p style={{ color: '#FCA5A5', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', margin: 0 }}>
            {erreurChargement}
          </p>
        )}

        {/* LISTE DES ENFANTS */}
        {enfants.length === 0 ? (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '32px 24px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.6)', margin: '0 0 16px' }}>
              Aucun enfant lié pour le moment
            </p>
          </div>
        ) : (
          enfants.map(enfant => {
            const age = calculerAge(enfant.date_naissance)
            const versionNeuri = enfant.neuri_version || getVersionFromDate(enfant.date_naissance)
            const codeLangue = enfant.langues?.code
            const drapeau = enfant.langues?.emoji || DRAPEAUX[codeLangue]
            const nomLangue = enfant.langues?.nom || NOMS_LANGUES[codeLangue]
            const afficherLangue = Boolean(codeLangue && (drapeau || nomLangue))
            return (
              <div
                key={enfant.user_id}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', transition: 'all 0.2s ease' }}
              >
                <div style={{ flexShrink: 0 }}>
                  <Neuri2D version={versionNeuri} angle="face" equipes={{ chapeau: null, haut: null, lunettes: null, compagnonObjet: null }} size={64} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '17px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 2px' }}>
                    {enfant.nom?.split(' ')[0]}
                  </p>
                  {age && (
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '0 0 6px' }}>
                      {age} ans
                    </p>
                  )}
                  {afficherLangue && (
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '0 0 6px' }}>
                      {drapeau || '🌍'} {nomLangue || ''}
                    </p>
                  )}
                  {/* Mini barre de progression XP */}
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden', marginTop: '4px' }}>
                    <div style={{ height: '100%', width: `${Math.min(((enfant.xp || 0) % 300) / 3, 100)}%`, background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)', borderRadius: '99px' }}/>
                  </div>
                  <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>
                    {enfant.xp || 0} XP · {enfant.lecons_completees || 0} leçons
                  </p>
                </div>
                <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.3)' }}>›</span>
              </div>
            )
          })
        )}

        {/* CARTE AJOUTER */}
        <div
          onClick={() => navigate('/parent-link-child')}
          style={{ background: 'rgba(139,92,246,0.06)', border: '1.5px dashed rgba(139,92,246,0.3)', borderRadius: '20px', padding: '20px', cursor: 'pointer', textAlign: 'center', marginTop: '8px' }}
        >
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔗</div>
          <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '15px', fontWeight: '800', color: '#FFFFFF', margin: '0 0 4px' }}>
            Lier un enfant existant
          </p>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            Avec son code NEURI-XXXX
          </p>
        </div>

      </div>

      <BottomNavParent />
    </div>
  )
}