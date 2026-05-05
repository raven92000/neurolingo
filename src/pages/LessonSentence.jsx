import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import SentenceExercise from './SentenceExercise'
import { supabase } from '../supabase'

export default function LessonSentence() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const leconId = searchParams.get('lecon')

  const [phrases, setPhrases] = useState([])
  const [indexPhrase, setIndexPhrase] = useState(0)
  const [profilType, setProfilType] = useState('tdah')
  const [objectifMinutes, setObjectifMinutes] = useState(5)
  const [partieCourante, setPartieCourante] = useState(1)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login'); return }

      // Charger profil (type + objectif)
      const { data: profil } = await supabase
        .from('profils')
        .select('profil_type, objectif_minutes')
        .eq('user_id', user.id)
        .single()
      
      if (profil?.profil_type) setProfilType(profil.profil_type)
      const dureeUser = profil?.objectif_minutes || 5
      setObjectifMinutes(dureeUser)

      if (!leconId) { setChargement(false); return }

      // Déterminer la partie à afficher en mode 5 min
      let partie = 1
      if (dureeUser === 5) {
        const { data: prog } = await supabase
          .from('progression')
          .select('partie_completee')
          .eq('user_id', user.id)
          .eq('lecon_id', leconId)
          .maybeSingle()
        if (prog?.partie_completee === 1) partie = 2
      }
      setPartieCourante(partie)

      // Charger toutes les phrases de la leçon
      const { data: phrasesData } = await supabase
        .from('phrases')
        .select('*')
        .eq('lecon_id', leconId)
        .order('ordre')

      if (phrasesData) {
        // Filtrer selon le mode 5/10 min
        let phrasesFiltrees = phrasesData
        if (dureeUser === 5) {
          phrasesFiltrees = phrasesData.filter(p => 
            partie === 1 ? p.ordre <= 5 : p.ordre >= 6
          )
        }

        setPhrases(phrasesFiltrees.map(p => ({
          en: p.phrase_cible,
          fr: p.phrase_fr,
          distracteursPhrase: p.distracteurs_phrase || [],
          distracteursMot: p.distracteurs_mot || [],
          indexCache: p.index_cache ?? 1,
        })))
      }
      setChargement(false)
    }
    charger()
  }, [leconId, navigate])

  const handleComplete = async () => {
    if (indexPhrase + 1 < phrases.length) {
      setIndexPhrase(indexPhrase + 1)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user && leconId) {
      const partieCompleteeFinale = objectifMinutes === 10 ? 2 : (partieCourante === 1 ? 1 : 2)

      // Vérifier si la leçon était déjà complétée
      const { data: progressionExistante } = await supabase
        .from('progression')
        .select('partie_completee')
        .eq('user_id', user.id)
        .eq('lecon_id', leconId)
        .maybeSingle()
      const dejaTerminee = progressionExistante?.partie_completee === 2

      await supabase.from('progression').upsert({
        user_id: user.id,
        lecon_id: leconId,
        partie_completee: partieCompleteeFinale,
        completee_le: new Date().toISOString(),
      }, { onConflict: 'user_id,lecon_id' })

      // Donner les XP UNIQUEMENT si pas déjà terminée
      if (!dejaTerminee) {
        const { data: profilActuel } = await supabase
          .from('profils')
          .select('xp, mots_appris, lecons_completees')
          .eq('user_id', user.id)
          .single()

        if (profilActuel) {
          const update = {
            xp: (profilActuel.xp || 0) + (phrases.length * 10),
            mots_appris: (profilActuel.mots_appris || 0) + phrases.length,
          }
          if (partieCompleteeFinale === 2) {
            update.lecons_completees = (profilActuel.lecons_completees || 0) + 1
          }
          await supabase.from('profils').update(update).eq('user_id', user.id)
        }
      }
    }
    navigate('/dashboard')
  }

  if (chargement) {
    return (
      <div style={{ minHeight: '100vh', background: '#090E1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(139,92,246,0.2)', borderTop: '3px solid #8B5CF6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}/>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (phrases.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#090E1A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <p style={{ color: '#FFFFFF', fontSize: '17px', textAlign: 'center', marginBottom: '20px' }}>Aucune phrase trouvée pour cette leçon.</p>
        <button onClick={() => navigate('/dashboard')} style={{ padding: '14px 24px', background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: '#FFFFFF', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>Retour</button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '20px', padding: '4px 14px', zIndex: 100 }}>
        <span style={{ fontSize: '12px', color: '#A78BFA', fontWeight: '700', fontFamily: 'Nunito' }}>
          Phrase {indexPhrase + 1} / {phrases.length}
          {objectifMinutes === 5 && ` · Partie ${partieCourante}/2`}
        </span>
      </div>
      <SentenceExercise
        key={indexPhrase}
        phrase={phrases[indexPhrase]}
        profile={profilType}
        onComplete={handleComplete}
      />
    </div>
  )
}