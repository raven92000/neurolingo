// Calcule l'âge depuis une date de naissance (format ISO "YYYY-MM-DD")
export function getAgeFromDate(dateNaissance) {
  if (!dateNaissance) return null
  const today = new Date()
  const birth = new Date(dateNaissance)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// Détermine la version de Neuri selon l'âge
export function getVersionNeuri(age) {
  if (!age || age < 5) return 'adulte' // fallback
  if (age <= 10) return 'enfant'
  if (age <= 17) return 'ado'
  if (age <= 35) return 'adulte'
  return 'mature'
}

// Helper combiné : depuis une date → version directement
export function getVersionFromDate(dateNaissance) {
  return getVersionNeuri(getAgeFromDate(dateNaissance))
}

// Retourne le chemin de l'image du corps (WebP, ~10x plus léger que les PNG)
export function getCorpsPng(version, angle = 'face') {
  return `/neuri/corps/neuri-${version}-${angle}.webp`
}

// Retourne le chemin d'un accessoire (null si pas de fichier)
export function getAccessoirePng(type, itemId) {
  if (!itemId) return null
  return `/neuri/accessoires/${type}/${itemId}.png`
}

// Mapping slot → dossier accessoire
export const SLOT_TO_DOSSIER = {
  chapeau: 'chapeau',
  haut: 'haut',
  lunettes: 'lunettes',
  compagnonObjet: 'compagnon'
}