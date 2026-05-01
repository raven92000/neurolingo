// ─── RÉGLAGES PAR PROFIL ──────────────────────────────────────
// Source de vérité unique pour adapter l'expérience selon le profil neuroatypique

export const PROFILE_SETTINGS = {
  tdah: {
    // Audio
    audioRate: 0.9,           // Vitesse de la voix (légèrement ralenti)

    // Timings (en millisecondes)
    expositionDuree: 2200,    // Durée de l'écran d'exposition d'un mot
    feedbackCorrect: 1,       // Délai après bonne réponse (en secondes)
    feedbackErreur: 2,        // Délai après mauvaise réponse (en secondes)

    // Visuel
    animationsReduites: false,
  },

  dyslexie: {
    // Audio
    audioRate: 0.75,          // Vitesse de la voix (plus lent)

    // Timings
    expositionDuree: 4000,    // Plus de temps pour mémoriser
    feedbackCorrect: 2,       // Plus de temps pour lire le feedback
    feedbackErreur: 3,

    // Visuel
    animationsReduites: true,
  },
}

// Réglages par défaut si profil inconnu
export const DEFAULT_SETTINGS = PROFILE_SETTINGS.tdah

// Helper pour récupérer les réglages d'un profil
export function getProfileSettings(profilType) {
  return PROFILE_SETTINGS[profilType] || DEFAULT_SETTINGS
}

// Helper pour appliquer la classe CSS du profil au body
export function applyProfileClass(profilType) {
  if (typeof document === 'undefined') return
  document.body.classList.remove('profil-tdah', 'profil-dyslexie')
  if (profilType) {
    document.body.classList.add(`profil-${profilType}`)
  }
}