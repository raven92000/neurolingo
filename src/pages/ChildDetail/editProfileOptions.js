// Options canoniques pour l'édition du profil enfant.
// Alignées sur profileSettings.js, Profile.jsx, ChildDetailHero.jsx.
// Fichier séparé pour respecter la règle react-refresh/only-export-components
// (un composant React et ses constantes ne peuvent pas coexister dans le même fichier).

export const PROFIL_OPTIONS = [
  { id: 'tdah', label: 'TDAH', desc: 'Rapide · Visuel · Stimulant', color: '#8B5CF6', colorBg: 'rgba(139,92,246,0.15)', colorBorder: 'rgba(139,92,246,0.5)' },
  { id: 'dyslexie', label: 'Dyslexie', desc: 'Lent · Lisible · Simple', color: '#3B82F6', colorBg: 'rgba(59,130,246,0.15)', colorBorder: 'rgba(59,130,246,0.5)' },
]

export const NEURI_OPTIONS = [
  { id: 'enfant', label: 'Enfant' },
  { id: 'ado', label: 'Ado' },
  { id: 'adulte', label: 'Adulte' },
  { id: 'mature', label: 'Mature' },
]

export const PROFIL_IDS = PROFIL_OPTIONS.map(p => p.id)
export const NEURI_IDS = NEURI_OPTIONS.map(n => n.id)
