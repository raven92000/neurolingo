import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import BottomNavParent from '../components/BottomNavParent'
import ChildDetailHero from './ChildDetail/ChildDetailHero'
import ChildDetailStats from './ChildDetail/ChildDetailStats'
import ChildDetailActivity from './ChildDetail/ChildDetailActivity'
import ChildDetailActions from './ChildDetail/ChildDetailActions'
import { genererMessageEmotionnel } from './ChildDetail/genererMessageEmotionnel'

export default function ChildDetailPage() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const [enfant, setEnfant] = useState(null)
  const [derniereActivite, setDerniereActivite] = useState(null)
  const [activites, setActivites] = useState([])
  const [erreurChargement, setErreurChargement] = useState(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    async function charger() {
      try {
        setErreurChargement(null)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { navigate('/login'); return }

        // Vérifier que l'utilisateur connecté est bien parent
        const { data: profilParent, error: erreurProfilParent } = await supabase
          .from('profils').select('role').eq('user_id', user.id).single()
        if (erreurProfilParent) throw erreurProfilParent
        if (profilParent?.role !== 'parent') {
          navigate('/dashboard')
          return
        }

        // Vérifier que cet enfant est bien lié au parent connecté
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

        // Récupérer le profil enfant + langue
        const { data: profilEnfant, error: erreurEnfant } = await supabase
          .from('profils')
          .select('*, langues(code, nom, emoji)')
          .eq('user_id', userId)
          .single()
        if (erreurEnfant) throw erreurEnfant
        setEnfant(profilEnfant)

        // Récupérer les 10 dernières activités (avec titre de leçon via join)
        // Dégradation gracieuse : si RLS bloque, on garde activites=[] et derniereActivite=null
        try {
          const { data: progs } = await supabase
            .from('progression')
            .select('id, completee_le, lecons(titre)')
            .eq('user_id', userId)
            .order('completee_le', { ascending: false })
            .limit(10)
          if (progs && progs.length > 0) {
            setActivites(progs.map((p) => ({
              id: p.id,
              completee_le: p.completee_le,
              titre: p.lecons?.titre || 'Leçon',
            })))
            setDerniereActivite(progs[0].completee_le)
          }
        } catch (errProg) {
          console.warn('Lecture progression indisponible (probable RLS), fallback message émotionnel', errProg)
        }
      } catch (error) {
        console.error('Erreur chargement Détail enfant', error)
        setErreurChargement("Impossible de charger les données de l'enfant, réessaye plus tard")
      } finally {
        setChargement(false)
      }
    }
    charger()
  }, [navigate, userId])

  if (chargement) {
    return (
      <div style={{ minHeight: '100vh', background: '#090E1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(139,92,246,0.2)', borderTop: '3px solid #8B5CF6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}/>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (erreurChargement || !enfant) {
    return (
      <div style={{ minHeight: '100vh', background: '#090E1A', paddingBottom: '100px', maxWidth: '430px', margin: '0 auto' }}>
        <div style={{ padding: '52px 24px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', width: '40px', height: '40px', color: '#FFFFFF', fontSize: '18px', cursor: 'pointer' }}
            aria-label="Retour"
          >
            ←
          </button>
          <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '22px', fontWeight: '900', color: '#FFFFFF', margin: 0 }}>Détail enfant</h1>
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

  const messageEmotionnel = genererMessageEmotionnel({
    prenom: enfant.nom?.split(' ')[0],
    streak: enfant.streak || 0,
    lecons_completees: enfant.lecons_completees || 0,
    derniereActivite,
  })

  return (
    <div style={{ minHeight: '100vh', background: '#090E1A', paddingBottom: '100px', maxWidth: '430px', margin: '0 auto' }}>

      {/* HEADER avec bouton retour */}
      <div style={{ padding: '52px 24px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', width: '40px', height: '40px', color: '#FFFFFF', fontSize: '18px', cursor: 'pointer' }}
          aria-label="Retour"
        >
          ←
        </button>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <ChildDetailHero enfant={enfant} messageEmotionnel={messageEmotionnel} />
        <ChildDetailStats enfant={enfant} />
        <ChildDetailActivity activites={activites} prenom={enfant.nom?.split(' ')[0]} />
        <ChildDetailActions enfant={enfant} />
      </div>

      <BottomNavParent />
    </div>
  )
}
