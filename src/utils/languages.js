// ─── LANGUES SUPPORTÉES ──────────────────────────────────────────────
// Source de vérité unique pour les langues de NeuroLingo.
// Pour ajouter une langue : ajouter une entrée ici, créer les chapitres
// dans Supabase avec le bon langue_id, puis passer disponible: true.

export const LANGUES = [
  {
    code: 'en',
    nom: 'Anglais',
    drapeau: '🇬🇧',
    disponible: true,
    bulle: {
      texte: "Let's go! Time to learn!",
      fond: '#3B82F6',           // Bleu
      texteCouleur: '#FFFFFF',
      ombre: 'rgba(59,130,246,0.4)',
    },
  },
  {
    code: 'es',
    nom: 'Espagnol',
    drapeau: '🇪🇸',
    disponible: true,
    bulle: {
      texte: '¡Vamos! Tu lección te espera',
      fond: '#F59E0B',           // Orange
      texteCouleur: '#FFFFFF',
      ombre: 'rgba(245,158,11,0.4)',
    },
  },
  {
    code: 'de',
    nom: 'Allemand',
    drapeau: '🇩🇪',
    disponible: false,
    bulle: {
      texte: "Los geht's! Deine Lektion wartet!",
      fond: '#1F2937',           // Noir profond
      texteCouleur: '#FFFFFF',
      ombre: 'rgba(31,41,55,0.6)',
    },
  },
]

const STORAGE_KEY = 'neurolingo_langue'
const LANGUE_PAR_DEFAUT = 'en'

// Récupère le code de la langue active depuis localStorage
export function getLangueActive() {
  if (typeof window === 'undefined') return LANGUE_PAR_DEFAUT
  const code = localStorage.getItem(STORAGE_KEY) || LANGUE_PAR_DEFAUT
  const langue = LANGUES.find((l) => l.code === code)
  if (!langue || !langue.disponible) return LANGUE_PAR_DEFAUT
  return code
}

// Définit la langue active (uniquement si elle est disponible)
export function setLangueActive(code) {
  if (typeof window === 'undefined') return
  const langue = LANGUES.find((l) => l.code === code)
  if (!langue || !langue.disponible) return
  localStorage.setItem(STORAGE_KEY, code)
}

// Récupère l'objet langue complet par son code
export function getLangueByCode(code) {
  return LANGUES.find((l) => l.code === code) || LANGUES[0]
}