import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../supabase'
import { PROFIL_COLUMNS } from '../utils/profilColumns'
import { getLangueActive, setLangueActive } from '../utils/languages'

// ─── MÉMOIRE PARTAGÉE DU PROFIL ─────────────────────────────────────
// Charge le profil de l'utilisateur connecté UNE fois, et le met à
// disposition de toutes les pages. Évite que chaque page recharge le
// profil (et affiche un rond plein écran) à chaque visite.
//
// Fournit :
//   - user             : l'utilisateur connecté (null si déconnecté)
//   - profil           : sa ligne `profils` (null si pas encore chargée)
//   - chargementProfil : true tant que l'état de connexion n'est pas résolu
//   - refreshProfil()  : recharge le profil à la demande (après une action)

const ProfilContext = createContext(null)

export function useProfil() {
  const ctx = useContext(ProfilContext)
  if (!ctx) throw new Error('useProfil doit être utilisé à l’intérieur de <ProfilProvider>')
  return ctx
}

// Aligne la langue active (localStorage) sur celle enregistrée dans le profil.
// Remplace l'ancien window.location.reload() de Dashboard : on fixe la langue
// AVANT que les pages ne chargent leurs mondes/leçons, sans recharger la page.
//
// Note : dans `profils`, la colonne `langue_id` contient directement le CODE
// de langue (ex. 'en', 'es'), lié à `langues.code`. Pas besoin de requête :
// setLangueActive ignore de toute façon un code inconnu ou indisponible.
function alignerLangue(profil) {
  const code = profil?.langue_id
  if (code && code !== getLangueActive()) {
    setLangueActive(code)
  }
}

export function ProfilProvider({ children }) {
  // undefined = état de connexion pas encore connu ; null = déconnecté
  const [user, setUser] = useState(undefined)
  const [profil, setProfil] = useState(null)
  const [chargementProfil, setChargementProfil] = useState(true)
  const userIdRef = useRef(null)

  const chargerProfil = useCallback(async (uid) => {
    const { data } = await supabase
      .from('profils')
      .select(PROFIL_COLUMNS)
      .eq('user_id', uid)
      .single()
    return data || null
  }, [])

  // Recharge le profil à la demande (après fin de leçon, achat, réglage, langue…)
  const refreshProfil = useCallback(async () => {
    const uid = userIdRef.current
    if (!uid) return null
    const data = await chargerProfil(uid)
    setProfil(data)
    return data
  }, [chargerProfil])

  // Écoute l'état de connexion Supabase (connexion / déconnexion / refresh token).
  // onAuthStateChange émet aussi INITIAL_SESSION au démarrage → couvre le 1er chargement.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Quand l'utilisateur change (connexion, déconnexion, changement de compte) :
  // charger son profil, ou vider la mémoire.
  useEffect(() => {
    if (user === undefined) return // pas encore déterminé
    let actif = true
    const uid = user?.id ?? null
    userIdRef.current = uid

    if (!uid) {
      // Déconnexion : on vide tout (important si un enfant se connecte après un parent)
      setProfil(null)
      setChargementProfil(false)
      return
    }

    setChargementProfil(true)
    setProfil(null)
    ;(async () => {
      const data = await chargerProfil(uid)
      alignerLangue(data)
      if (!actif) return
      setProfil(data)
      setChargementProfil(false)
    })()

    return () => { actif = false }
  }, [user?.id, chargerProfil])

  return (
    <ProfilContext.Provider value={{ user, profil, chargementProfil, refreshProfil, setProfil }}>
      {children}
    </ProfilContext.Provider>
  )
}
