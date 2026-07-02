import { createContext, useContext, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { useProfil } from './ProfilContext'

// ─── MÉMOIRE PARTAGÉE DU CONTENU PÉDAGOGIQUE ────────────────────────
// Mémorise, par code de langue, le contenu qui ne change pas pendant une
// session : la table `langues`, les `chapitres` et les `lecons` d'une langue.
// Évite que Dashboard / Learn rechargent ce contenu à chaque visite.
//
// La progression n'est JAMAIS mémorisée ici : elle reste chargée à chaque
// visite par les pages (pour un déverrouillage / XP toujours justes).
//
// Fournit :
//   - chargerContenu(code) : renvoie { code, langueId, chapitres, lecons }
//       → instantané si la langue est déjà en cache, sinon la charge une fois.

const ContenuContext = createContext(null)

export function useContenu() {
  const ctx = useContext(ContenuContext)
  if (!ctx) throw new Error('useContenu doit être utilisé à l’intérieur de <ContenuProvider>')
  return ctx
}

export function ContenuProvider({ children }) {
  const { user } = useProfil()
  const cacheRef = useRef(new Map())    // code -> { code, langueId, chapitres, lecons }
  const languesRef = useRef(null)        // [{ id, code }, ...] (chargé une fois)
  const inflightRef = useRef(new Map())  // code -> Promise (évite les doubles chargements)
  const leconsToutesRef = useRef(null)   // toutes les leçons (pour Stats), chargées une fois
  const leconsToutesInflight = useRef(null)

  // Vide le contenu mémorisé à la déconnexion / au changement de compte.
  useEffect(() => {
    cacheRef.current.clear()
    languesRef.current = null
    inflightRef.current.clear()
    leconsToutesRef.current = null
    leconsToutesInflight.current = null
  }, [user?.id])

  // Toutes les leçons (id, nombre_mots, chapitre_id) — utilisées par Stats.
  // Contenu stable dans une session → chargé une seule fois, puis servi du cache.
  const chargerLeconsToutes = useCallback(async () => {
    if (leconsToutesRef.current) return leconsToutesRef.current
    if (leconsToutesInflight.current) return leconsToutesInflight.current
    const promesse = (async () => {
      const { data } = await supabase.from('lecons').select('id, nombre_mots, chapitre_id')
      leconsToutesRef.current = data || []
      leconsToutesInflight.current = null
      return leconsToutesRef.current
    })()
    leconsToutesInflight.current = promesse
    return promesse
  }, [])

  const chargerContenu = useCallback(async (code) => {
    if (!code) return { code, langueId: null, chapitres: [], lecons: [] }

    // Déjà en mémoire → réponse immédiate (0 requête)
    if (cacheRef.current.has(code)) return cacheRef.current.get(code)
    // Chargement déjà en cours pour ce code → on réutilise la même promesse
    if (inflightRef.current.has(code)) return inflightRef.current.get(code)

    const promesse = (async () => {
      // Table `langues` : chargée une seule fois (minuscule)
      if (!languesRef.current) {
        const { data } = await supabase.from('langues').select('id, code')
        languesRef.current = data || []
      }
      const langueId = languesRef.current.find((l) => l.code === code)?.id ?? null

      let chapitres = []
      let lecons = []
      if (langueId) {
        const { data: chaps } = await supabase
          .from('chapitres').select('*').eq('langue_id', langueId).order('numero')
        chapitres = chaps || []
        const ids = chapitres.map((c) => c.id)
        if (ids.length > 0) {
          const { data: lecs } = await supabase
            .from('lecons').select('*').in('chapitre_id', ids).order('ordre')
          lecons = lecs || []
        }
      }

      const contenu = { code, langueId, chapitres, lecons }
      cacheRef.current.set(code, contenu)
      inflightRef.current.delete(code)
      return contenu
    })()

    inflightRef.current.set(code, promesse)
    return promesse
  }, [])

  return (
    <ContenuContext.Provider value={{ chargerContenu, chargerLeconsToutes }}>
      {children}
    </ContenuContext.Provider>
  )
}
