import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Neuri2D from '../components/Neuri2D'
import BottomNavParent from '../components/BottomNavParent'
import { getVersionFromDate } from '../utils/neuriUtils'

const DRAPEAUX = { en: '🇬🇧', es: '🇪🇸', de: '🇩🇪', pt: '🇵🇹' }
const NOMS_LANGUES = { en: 'Anglais', es: 'Espagnol', de: 'Allemand', pt: 'Portugais' }

const NIVEAUX_CONFIG = [
  { numero: 1, nom: 'Découverte', chapitresNumeros: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
  { numero: 2, nom: 'Les Bases', chapitresNumeros: [9] },
  { numero: 3, nom: 'Le Quotidien', chapitresNumeros: [10] },
  { numero: 4, nom: "L'Autonomie", chapitresNumeros: [11] },
]

function calculerNiveauActuel(chapitres, lecons, progressions) {
  const idsCompletes = new Set((progressions || []).filter(p => p.partie_completee === 2).map(p => p.lecon_id))
  let niveauActuel = NIVEAUX_CONFIG[0]
  for (const niv of NIVEAUX_CONFIG) {
    const chapsIds = (chapitres || []).filter(c => niv.chapitresNumeros.includes(c.numero)).map(c => c.id)
    const lecsLevel = (lecons || []).filter(l => chapsIds.includes(l.chapitre_id))
    if (lecsLevel.length === 0) continue
    const fait = lecsLevel.filter(l => idsCompletes.has(l.id)).length
    niveauActuel = niv
    if (fait < lecsLevel.length) break
  }
  return niveauActuel
}

function calculerAge(dateNaissance) {
  if (!dateNaissance) return null
  const today = new Date()
  const birth = new Date(dateNaissance)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default function ParentDashboard() {
  const navigate = useNavigate()
  const [parent, setParent] = useState(null)
  const [enfants, setEnfants] = useState([])
  const [enfantActif, setEnfantActif] = useState(null)
  const [stats, setStats] = useState({ niveau: NIVEAUX_CONFIG[0], xp: 0, lecons: 0, mots: 0, streak: 0 })
  const [erreurStats, setErreurStats] = useState(null)
  const [erreurChargement, setErreurChargement] = useState(null)
  const [chargement, setChargement] = useState(true)

  async function chargerStatsEnfant(enfant) {
    if (!enfant) {
      return
    }

    try {
      setErreurStats(null)

      if (!enfant?.langue_id) {
        setStats({ niveau: NIVEAUX_CONFIG[0], xp: enfant?.xp || 0, lecons: enfant?.lecons_completees || 0, mots: enfant?.mots_appris || 0, streak: enfant?.streak || 0 })
        return
      }

      // Résoudre le code langue (text dans profils.langue_id) en uuid (langues.id)
      const { data: langue, error: erreurLangue } = await supabase
        .from('langues')
        .select('id')
        .eq('code', enfant.langue_id)
        .maybeSingle()
      if (erreurLangue) throw erreurLangue
      if (!langue) {
        setStats({ niveau: NIVEAUX_CONFIG[0], xp: enfant?.xp || 0, lecons: enfant?.lecons_completees || 0, mots: enfant?.mots_appris || 0, streak: enfant?.streak || 0 })
        return
      }

      const { data: chapitres, error: erreurChapitres } = await supabase
        .from('chapitres').select('id, numero').eq('langue_id', langue.id)
      if (erreurChapitres) throw erreurChapitres

      const chapIds = (chapitres || []).map(c => c.id)
      const { data: lecons, error: erreurLecons } = await supabase
        .from('lecons').select('id, chapitre_id').in('chapitre_id', chapIds)
      if (erreurLecons) throw erreurLecons

      const { data: progressions, error: erreurProgression } = await supabase
        .from('progression').select('lecon_id, partie_completee').eq('user_id', enfant.user_id)
      if (erreurProgression) throw erreurProgression

      const niveau = calculerNiveauActuel(chapitres, lecons, progressions)
      setStats({
        niveau,
        xp: enfant.xp || 0,
        lecons: enfant.lecons_completees || 0,
        mots: enfant.mots_appris || 0,
        streak: enfant.streak || 0,
      })
    } catch (error) {
      console.error('Erreur chargement stats enfant', error)
      setErreurStats('Impossible de charger les stats, réessaye plus tard')
    }
  }

  useEffect(() => {
    async function charger() {
      try {
        setErreurChargement(null)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { navigate('/login'); return }

        const { data: profilParent, error: erreurProfilParent } = await supabase
          .from('profils').select('*').eq('user_id', user.id).single()
        if (erreurProfilParent) throw erreurProfilParent

        if (profilParent?.role !== 'parent') {
          navigate('/dashboard')
          return
        }
        setParent(profilParent)

        // Récupérer les enfants liés
        const { data: liens, error: erreurLiens } = await supabase
          .from('parent_child_links')
          .select('child_id')
          .eq('parent_id', user.id)
        if (erreurLiens) throw erreurLiens

        const childIds = (liens || []).map(l => l.child_id)
        if (childIds.length === 0) {
          return
        }

        const { data: profilsEnfants, error: erreurEnfants } = await supabase
          .from('profils')
          .select('*, langues(code, nom, emoji)')
          .in('user_id', childIds)
        if (erreurEnfants) throw erreurEnfants

        setEnfants(profilsEnfants || [])

        // Sélectionner le 1er enfant par défaut
        const premier = profilsEnfants?.[0]
        if (premier) {
          setEnfantActif(premier)
          await chargerStatsEnfant(premier)
        }
      } catch (error) {
        console.error('Erreur chargement Dashboard Parent', error)
        setErreurChargement('Impossible de charger tes données, réessaye plus tard')
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

  // ─── ÉTAT VIDE : aucun enfant lié ─────────────────────────
  if (enfants.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#090E1A', paddingBottom: '100px', maxWidth: '430px', margin: '0 auto' }}>
        <div style={{ padding: '52px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '28px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 4px' }}>Espace Parent</h1>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Bonjour {parent?.nom?.split(' ')[0]}</p>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A78BFA', fontWeight: '900', fontFamily: 'Nunito, sans-serif' }}>
            {parent?.nom?.charAt(0).toUpperCase() || 'P'}
          </div>
        </div>

        <div style={{ padding: '0 20px' }}>
          {erreurChargement && (
            <p style={{ color: '#FCA5A5', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', margin: '0 0 12px' }}>
              {erreurChargement}
            </p>
          )}
          <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(124,58,237,0.08) 100%)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '24px', padding: '32px 24px', textAlign: 'center', boxShadow: '0 0 40px rgba(138,92,255,0.12)' }}>
            <div style={{ width: '120px', height: '120px', margin: '0 auto 16px' }}>
              <Neuri2D version="adulte" angle="face" equipes={{ chapeau: null, haut: null, lunettes: null, compagnonObjet: null }} size={120} />
            </div>
            <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '22px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 8px' }}>Aucun enfant lié</h2>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.6)', margin: '0 0 24px', lineHeight: 1.5 }}>
              Créez un compte enfant ou liez un compte existant pour commencer.
            </p>
            <button
              onClick={() => navigate('/parent-create-child')}
              style={{ width: '100%', height: '50px', background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: '#FFFFFF', border: 'none', borderRadius: '14px', fontSize: '15px', fontFamily: 'Nunito, sans-serif', fontWeight: '800', cursor: 'pointer', marginBottom: '10px', boxShadow: '0 0 28px rgba(124,58,237,0.35)' }}
            >
              + Créer un compte enfant
            </button>
            <button
              onClick={() => navigate('/parent-link-child')}
              style={{ width: '100%', height: '50px', background: 'rgba(255,255,255,0.06)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', fontSize: '15px', fontFamily: 'Nunito, sans-serif', fontWeight: '700', cursor: 'pointer' }}
            >
              Lier un enfant existant
            </button>
          </div>
        </div>

        <BottomNavParent />
      </div>
    )
  }

  // ─── DASHBOARD PRINCIPAL ──────────────────────────────────
  const versionNeuri = enfantActif?.neuri_version || getVersionFromDate(enfantActif?.date_naissance)
  const ageEnfant = calculerAge(enfantActif?.date_naissance)
  const codeLangue = enfantActif?.langues?.code
  const nomLangue = enfantActif?.langues?.nom || NOMS_LANGUES[codeLangue] || 'Langue à définir'
  const drapeau = enfantActif?.langues?.emoji || DRAPEAUX[codeLangue] || '🌍'
  const fonctionnalites = [
    { icon: '📊', titre: 'Progression', desc: 'Voir les niveaux, leçons et compétences', color: '#A78BFA' },
    { icon: '🌍', titre: 'Langues étudiées', desc: 'Consulter les langues en cours', color: '#60A5FA' },
    { icon: '⏱️', titre: 'Temps d\'apprentissage', desc: 'Voir le temps passé chaque jour', color: '#86EFAC' },
    { icon: '📅', titre: 'Historique semaine', desc: 'Détail jour par jour des activités', color: '#FCA5A5' },
  ]

  const conseils = [
    "Les sessions courtes fonctionnent bien cette semaine.",
    "Les exercices audio semblent améliorer la mémorisation.",
    `${enfantActif?.nom?.split(' ')[0]} progresse davantage le matin.`,
    "Encouragez la régularité plutôt que la durée.",
  ]
  const conseilDuJour = conseils[new Date().getDay() % conseils.length]

  return (
    <div style={{ minHeight: '100vh', background: '#090E1A', paddingBottom: '100px', maxWidth: '430px', margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ padding: '52px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '28px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 4px' }}>Espace Parent</h1>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Bonjour {parent?.nom?.split(' ')[0]}</p>
        </div>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A78BFA', fontWeight: '900', fontFamily: 'Nunito, sans-serif' }}>
          {parent?.nom?.charAt(0).toUpperCase() || 'P'}
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {erreurChargement && (
          <p style={{ color: '#FCA5A5', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', margin: 0 }}>
            {erreurChargement}
          </p>
        )}

        {/* CARTE ENFANT */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(88, 49, 196, 0.35), rgba(16, 18, 40, 0.95))',
          border: '1px solid rgba(138, 92, 255, 0.25)',
          borderRadius: '24px',
          padding: '20px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 0 40px rgba(138,92,255,0.12)',
          display: 'flex', alignItems: 'center', gap: '14px',
        }}>
          <div style={{ flexShrink: 0 }}>
            <Neuri2D version={versionNeuri} angle="face" equipes={{ chapeau: null, haut: null, lunettes: null, compagnonObjet: null }} size={90} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '22px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 2px' }}>
              {enfantActif?.nom?.split(' ')[0]}{ageEnfant && ` (${ageEnfant} ans)`}
            </h2>
            {enfantActif?.langue_id && (
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: '0 0 4px' }}>
                {drapeau} {nomLangue || 'Langue'} en apprentissage
              </p>
            )}
            <div style={{ display: 'inline-block', background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '8px', padding: '3px 8px' }}>
              <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '12px', fontWeight: '700', color: '#A78BFA', margin: 0 }}>
                Niveau {stats.niveau.numero} · {stats.niveau.nom}
              </p>
            </div>
          </div>
        </div>

        {erreurStats && (
          <p style={{ color: '#FCA5A5', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', margin: '0 0 10px' }}>
            {erreurStats}
          </p>
        )}

        {/* GRILLE 2x2 STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { label: 'Leçons', value: stats.lecons, color: '#58CC02', icon: '📚' },
            { label: 'XP gagnés', value: stats.xp, color: '#A78BFA', icon: '⚡' },
            { label: 'Mots appris', value: stats.mots, color: '#3B82F6', icon: '🔤' },
            { label: 'Série', value: stats.streak, color: '#F59E0B', icon: '🔥' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '14px' }}>
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>{s.icon}</div>
              <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '24px', fontWeight: '900', color: s.color, margin: '0 0 2px', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* GRILLE FONCTIONNALITÉS */}
        <h3 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: '8px 0 0' }}>
          Fonctionnalités
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {fonctionnalites.map((f, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s ease' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${f.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '10px' }}>
                {f.icon}
              </div>
              <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '14px', fontWeight: '800', color: '#FFFFFF', margin: '0 0 4px' }}>{f.titre}</p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.3 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CONSEILS PERSONNALISÉS */}
        <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(139,92,246,0.08) 100%)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '20px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px' }}>
          <div style={{ fontSize: '32px', filter: 'drop-shadow(0 0 12px rgba(245,158,11,0.5))' }}>💡</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: '700', color: '#FCD34D', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>Conseil personnalisé</p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.4 }}>{conseilDuJour}</p>
          </div>
        </div>

      </div>

      <BottomNavParent />
    </div>
  )
}