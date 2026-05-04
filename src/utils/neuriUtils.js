// Détermine la version de Neuri selon l'âge
export function getVersionNeuri(age) {
  if (!age || age < 5) return 'adulte' // fallback
  if (age <= 10) return 'enfant'
  if (age <= 17) return 'ado'
  if (age <= 35) return 'adulte'
  return 'mature'
}

// Retourne le chemin du PNG du corps
export function getCorpsPng(version, angle = 'face') {
  return `/neuri/corps/neuri-${version}-${angle}.png`
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