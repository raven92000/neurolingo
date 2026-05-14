import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { supabase } from '../supabase'
import BottomNavParent from '../components/BottomNavParent'
import CalendrierMois from './ParentChildHistorique/CalendrierMois'
import LeconJourCard from './ParentChildHistorique/LeconJourCard'

const JOURS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

function pad2(n) {
  return String(n).padStart(2, '0')
}

function formatYMD(date) {
  return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate())
}

function formatHeure(date) {
  return pad2(date.getHours()) + ':' + pad2(date.getMinutes())
}

function memeMois(a, b) {
  return a.annee === b.annee && a.mois === b.mois
}

export default function ParentChildHistorique() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const location = useLocation()

  // Calculé une seule fois au mount : aujourd'hui et le mois actuel
  const [today] = useState(() => new Date())
  const moisActuel = useMemo(
    () => ({ annee: today.getFullYear(), mois: today.getMonth() }),
    [today]
  )

  const [enfant, setEnfant] = useState(null)
  const [progressions, setProgressions] = useState([])
  const [moisAffiche, setMoisAffiche] = useState(moisActuel)
  const [jourSelectionne, setJourSelectionne] = useState(null)
  const [erreurChargement, setErreurChargement] = useState(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    async function charger() {
      try {
        setErreurChargement(null)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { navigate('/login'); return }

        // Check rôle parent
        const { data: profilParent, error: erreurProfilParent } = await supabase
          .from('profils').select('role').eq('user_id', user.id).single()
        if (erreurProfilParent) throw erreurProfilParent
        if (profilParent?.role !== 'parent') {
          navigate('/dashboard')
          return
        }

        // Check lien parent-enfant
        const { data: lien, error: erreurLien } = await supabase
          .from('parent_child_links')
          .select('child_id')
          .eq('parent_id', user.id)
          .eq('child_id', userId)
          .maybeSingle()
        if (erreurLien) throw erreurLien
        if (!lien) {
          navigate('/parent-dashboard')
          return
        }

        // Profil enfant (prénom + date de création pour la limite passé)
        const { data: profilEnfant, error: erreurEnfant } = await supabase
          .from('profils')
          .select('nom, created_at')
          .eq('user_id', userId)
          .single()
        if (erreurEnfant) throw erreurEnfant
        setEnfant(profilEnfant)

        // Toutes les progressions complétées (leçon faite = completee_le NOT NULL)
        // avec jointure leçon → durée + chapitre.
        const { data: progs, error: erreurProgs } = await supabase
          .from('progression')
          .select('id, completee_le, lecons(titre, duree_minutes, image_url, chapitres(titre))')
          .eq('user_id', userId)
          .not('completee_le', 'is', null)
          .order('completee_le', { ascending: true })
        if (erreurProgs) throw erreurProgs
        const progsArr = progs || []
        setProgressions(progsArr)

        // Sélection par défaut : si on est sur le mois actuel et qu'il y a
        // au moins une leçon aujourd'hui, sélectionner aujourd'hui.
        const aujourdHuiKey = formatYMD(new Date())
        const auj = progsArr.filter(p => formatYMD(new Date(p.completee_le)) === aujourdHuiKey)
        if (auj.length > 0) {
          setJourSelectionne(aujourdHuiKey)
        }
      } catch (error) {
        console.error('Erreur chargement Historique', error)
        setErreurChargement("Impossible de charger l'historique, réessaye plus tard")
      } finally {
        setChargement(false)
      }
    }
    charger()
  }, [navigate, userId])

  // Regrouper les leçons faites par jour (clé "YYYY-MM-DD")
  const leconsParJour = useMemo(() => {
    const map = {}
    for (const p of progressions) {
      if (!p.completee_le) continue
      const key = formatYMD(new Date(p.completee_le))
      if (!map[key]) map[key] = []
      map[key].push(p)
    }
    return map
  }, [progressions])

  // Bouton retour : utilise location.state.from pour garantir un navigate
  // avec nouvelle location.key (cohérent avec ChildDetailPage).
  function retour() {
    const from = location.state?.from
    navigate(from || '/parent-dashboard')
  }

  // Change de mois et réinitialise le jour sélectionné. Exception : si on
  // arrive sur le mois actuel et qu'il y a des leçons aujourd'hui, on
  // resélectionne automatiquement aujourd'hui.
  function changerMois(nouveau) {
    setMoisAffiche(nouveau)
    const aujourdHuiKey = formatYMD(new Date())
    if (memeMois(nouveau, moisActuel) && leconsParJour[aujourdHuiKey]?.length > 0) {
      setJourSelectionne(aujourdHuiKey)
    } else {
      setJourSelectionne(null)
    }
  }

  if (chargement) {
    return (
      <div style={{ minHeight: '100vh', background: '#090E1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(139,92,246,0.2)', borderTop: '3px solid #8B5CF6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (erreurChargement || !enfant) {
    return (
      <div style={{ minHeight: '100vh', background: '#090E1A', paddingBottom: '100px', maxWidth: '430px', margin: '0 auto' }}>
        <div style={{ padding: '52px 24px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={retour}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', width: '40px', height: '40px', color: '#FFFFFF', fontSize: '18px', cursor: 'pointer' }}
            aria-label="Retour"
          >
            ←
          </button>
          <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '22px', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>Historique</h1>
        </div>
        <div style={{ padding: '0 20px' }}>
          <p style={{ color: '#FCA5A5', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', margin: 0 }}>
            {erreurChargement || "Cet enfant n'est pas accessible."}
          </p>
        </div>
        <BottomNavParent />
      </div>
    )
  }

  // Limites de navigation
  const createdAt = enfant.created_at ? new Date(enfant.created_at) : today
  const moisMin = { annee: createdAt.getFullYear(), mois: createdAt.getMonth() }
  const moisMax = moisActuel

  // Liste leçons du jour sélectionné, triées par heure croissante
  const leconsDuJour = jourSelectionne
    ? (leconsParJour[jourSelectionne] || []).slice().sort(
        (a, b) => new Date(a.completee_le) - new Date(b.completee_le)
      )
    : []

  // Label "Lundi 12 mai"
  let labelJour = null
  if (jourSelectionne) {
    const [y, m, d] = jourSelectionne.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    labelJour = JOURS_FR[date.getDay()] + ' ' + date.getDate() + ' ' + MOIS_FR[date.getMonth()]
  }

  const prenom = (enfant.nom || '').split(' ')[0] || enfant.nom || ''

  return (
    <div style={{ minHeight: '100vh', background: '#090E1A', paddingBottom: '100px', maxWidth: '430px', margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ padding: '52px 24px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={retour}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', width: '40px', height: '40px', color: '#FFFFFF', fontSize: '18px', cursor: 'pointer', flexShrink: 0 }}
          aria-label="Retour"
        >
          ←
        </button>
        <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '22px', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
          Historique de {prenom}
        </h1>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <CalendrierMois
          moisAffiche={moisAffiche}
          changerMois={changerMois}
          leconsParJour={leconsParJour}
          jourSelectionne={jourSelectionne}
          setJourSelectionne={setJourSelectionne}
          moisMin={moisMin}
          moisMax={moisMax}
        />

        {jourSelectionne && leconsDuJour.length > 0 && (
          <>
            <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '15px', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 0' }}>
              {labelJour} · {leconsDuJour.length} leçon{leconsDuJour.length > 1 ? 's' : ''}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {leconsDuJour.map(p => (
                <LeconJourCard
                  key={p.id}
                  titre={p.lecons?.titre || 'Leçon'}
                  heure={formatHeure(new Date(p.completee_le))}
                  duree={p.lecons?.duree_minutes}
                  chapitre={p.lecons?.chapitres?.titre || 'Chapitre inconnu'}
                  imageUrl={p.lecons?.image_url}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <BottomNavParent />
    </div>
  )
}
