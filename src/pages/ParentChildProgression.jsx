import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { supabase } from '../supabase'
import BottomNavParent from '../components/BottomNavParent'
import ChapitreCard from './ParentChildProgression/ChapitreCard'

function getStatutLecon(progressions, leconId) {
  const p = progressions.find(pr => pr.lecon_id === leconId)
  if (!p) return 'non_commencee'
  if (p.completee_le) return 'terminee'
  return 'en_cours'
}

export default function ParentChildProgression() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const location = useLocation()
  const [enfant, setEnfant] = useState(null)
  const [chapitresAvecProgression, setChapitresAvecProgression] = useState([])
  const [aucuneLangue, setAucuneLangue] = useState(false)
  const [erreurChargement, setErreurChargement] = useState(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    async function charger() {
      try {
        setErreurChargement(null)

        // 1. Auth
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { navigate('/login'); return }

        // 2. Check rôle parent
        const { data: profilParent, error: erreurProfilParent } = await supabase
          .from('profils').select('role').eq('user_id', user.id).single()
        if (erreurProfilParent) throw erreurProfilParent
        if (profilParent?.role !== 'parent') {
          navigate('/dashboard')
          return
        }

        // 3. Check lien parent-enfant
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

        // 4. Récupérer l'enfant + sa langue
        const { data: profilEnfant, error: erreurEnfant } = await supabase
          .from('profils')
          .select('nom, langue_id, langues(code, nom, emoji)')
          .eq('user_id', userId)
          .single()
        if (erreurEnfant) throw erreurEnfant
        setEnfant(profilEnfant)

        // 5. Si pas de langue : on s'arrête là avec un message bienveillant
        if (!profilEnfant?.langue_id) {
          setAucuneLangue(true)
          return
        }

        // 6. Résoudre code langue (text) → uuid (pattern documenté dans CLAUDE.md)
        const { data: langue } = await supabase
          .from('langues')
          .select('id')
          .eq('code', profilEnfant.langue_id)
          .maybeSingle()

        if (!langue) {
          setAucuneLangue(true)
          return
        }

        // 7. Récupérer les chapitres de cette langue
        const { data: chapitres } = await supabase
          .from('chapitres')
          .select('id, numero, titre, niveau')
          .eq('langue_id', langue.id)
          .order('numero', { ascending: true })

        const chapitresSafe = chapitres || []
        const chapitresIds = chapitresSafe.map(c => c.id)

        // 8. Récupérer toutes les leçons de ces chapitres
        let lecons = []
        if (chapitresIds.length > 0) {
          const { data: leconsData } = await supabase
            .from('lecons')
            .select('id, titre, chapitre_id, ordre')
            .in('chapitre_id', chapitresIds)
            .order('ordre', { ascending: true })
          lecons = leconsData || []
        }

        // 9. Récupérer la progression de l'enfant (try/catch pour RLS éventuelle)
        let progressions = []
        try {
          const { data: progressionsData } = await supabase
            .from('progression')
            .select('lecon_id, completee_le, partie_completee')
            .eq('user_id', userId)
          progressions = progressionsData || []
        } catch (errProg) {
          console.warn('Lecture progression indisponible (probable RLS), fallback 0%', errProg)
        }

        // 10. Construire la structure enrichie
        const resultat = chapitresSafe.map(chap => {
          const leconsDuChap = lecons.filter(l => l.chapitre_id === chap.id)
          const leconsAvecStatut = leconsDuChap.map(l => ({
            id: l.id,
            titre: l.titre,
            statut: getStatutLecon(progressions, l.id),
          }))
          const nbTotal = leconsDuChap.length
          const nbTerminees = leconsAvecStatut.filter(l => l.statut === 'terminee').length
          const pourcentage = nbTotal === 0 ? 0 : Math.round((nbTerminees / nbTotal) * 100)
          return {
            id: chap.id,
            numero: chap.numero,
            titre: chap.titre,
            niveau: chap.niveau,
            lecons: leconsAvecStatut,
            nbTotal,
            nbTerminees,
            pourcentage,
          }
        })

        setChapitresAvecProgression(resultat)
      } catch (error) {
        console.error('Erreur chargement Progression enfant', error)
        setErreurChargement('Impossible de charger la progression, réessaye plus tard')
      } finally {
        setChargement(false)
      }
    }
    charger()
  }, [navigate, userId])

  function retour() {
    const from = location.state?.from
    navigate(from || `/parent/enfant/${userId}`)
  }

  if (chargement) {
    return (
      <div style={{ minHeight: '100vh', background: '#090E1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(139,92,246,0.2)', borderTop: '3px solid #8B5CF6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}/>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const prenom = enfant?.nom || 'ton enfant'

  return (
    <div style={{ minHeight: '100vh', background: '#090E1A', paddingBottom: '100px', maxWidth: '430px', margin: '0 auto' }}>

      {/* Header : bouton retour + titre */}
      <div style={{ padding: '52px 24px 8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={retour}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', width: '40px', height: '40px', color: '#FFFFFF', fontSize: '18px', cursor: 'pointer' }}
          aria-label="Retour"
        >
          ←
        </button>
      </div>

      <div style={{ padding: '8px 24px 20px' }}>
        <h1 style={{
          fontFamily: 'Nunito, sans-serif',
          fontSize: '26px',
          fontWeight: 900,
          color: '#FFFFFF',
          margin: '0 0 4px',
          lineHeight: 1.2,
        }}>
          Progression de {prenom}
        </h1>
        <p style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          color: 'rgba(255,255,255,0.5)',
          margin: 0,
        }}>
          Chapitre par chapitre
        </p>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {erreurChargement && (
          <p style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '14px',
            padding: '14px 16px',
            color: '#FCA5A5',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            margin: 0,
          }}>
            {erreurChargement}
          </p>
        )}

        {!erreurChargement && aucuneLangue && (
          <div style={{
            background: 'rgba(139,92,246,0.06)',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: '20px',
            padding: '20px',
          }}>
            <p style={{
              fontFamily: 'Nunito, sans-serif',
              fontSize: '15px',
              fontWeight: 800,
              color: '#FFFFFF',
              margin: '0 0 6px',
            }}>
              Aucune langue assignée
            </p>
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.6)',
              margin: 0,
              lineHeight: 1.5,
            }}>
              {prenom} n'a pas encore de langue d'apprentissage. Reviens ici une fois la langue choisie.
            </p>
          </div>
        )}

        {!erreurChargement && !aucuneLangue && chapitresAvecProgression.length === 0 && (
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: 'rgba(255,255,255,0.5)',
            margin: 0,
          }}>
            Aucun chapitre disponible pour cette langue pour le moment.
          </p>
        )}

        {chapitresAvecProgression.map(chap => (
          <ChapitreCard key={chap.id} chapitre={chap} />
        ))}
      </div>

      <BottomNavParent />
    </div>
  )
}
