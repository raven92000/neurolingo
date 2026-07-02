import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../supabase'
import { useProfil } from './ProfilContext'

// ─── MÉMOIRE DE LA DERNIÈRE PROGRESSION CONNUE ──────────────────────
// Principe « affiche tout de suite, rafraîchis en arrière-plan » : on garde
// en mémoire la dernière progression connue de l'utilisateur. Les pages
// l'affichent IMMÉDIATEMENT (pas de squelette bloquant sur le réseau), puis
// appellent `refreshProgression()` qui revérifie en arrière-plan et met à
// jour l'affichage si ça a changé.
//
// La progression n'est donc pas « mise en cache et oubliée » : elle est
// revalidée à chaque visite → XP et déverrouillage restent justes.
//
// Fournit :
//   - progression         : dernier tableau connu (null tant que jamais chargé)
//   - refreshProgression() : recharge la progression et met à jour la mémoire
//
// Colonnes chargées = surensemble de ce dont ont besoin Dashboard / Learn / Stats
// (lecon_id, completee_le, partie_completee).

const ProgressionContext = createContext(null)

export function useProgression() {
  const ctx = useContext(ProgressionContext)
  if (!ctx) throw new Error('useProgression doit être utilisé à l’intérieur de <ProgressionProvider>')
  return ctx
}

export function ProgressionProvider({ children }) {
  const { user } = useProfil()
  const [progression, setProgression] = useState(null) // null = jamais chargée
  const userIdRef = useRef(null)

  const refreshProgression = useCallback(async () => {
    const uid = userIdRef.current
    if (!uid) return null
    const { data } = await supabase
      .from('progression')
      .select('lecon_id, completee_le, partie_completee')
      .eq('user_id', uid)
    const arr = data || []
    setProgression(arr)
    return arr
  }, [])

  // Vide la dernière progression connue à la déconnexion / au changement de compte
  // (évite d'afficher la progression d'un autre compte).
  useEffect(() => {
    userIdRef.current = user?.id ?? null
    setProgression(null)
  }, [user?.id])

  return (
    <ProgressionContext.Provider value={{ progression, refreshProgression }}>
      {children}
    </ProgressionContext.Provider>
  )
}
