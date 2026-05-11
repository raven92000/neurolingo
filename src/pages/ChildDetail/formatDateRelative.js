const JOURS_SEMAINE = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export function formatDateRelative(date, now = new Date()) {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''

  const diffMs = now.getTime() - d.getTime()
  if (diffMs < 60000) return "À l'instant"

  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 60) return `Il y a ${diffMin} min`

  const diffHour = Math.floor(diffMs / 3600000)
  if (diffHour < 24) return `Il y a ${diffHour}h`

  // Comparaison "jours calendaires" pour que "Hier" ne dépende pas de l'heure
  const debutAujourdhui = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const debutDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffJours = Math.round((debutAujourdhui.getTime() - debutDate.getTime()) / 86400000)

  if (diffJours === 1) return 'Hier'
  if (diffJours >= 2 && diffJours <= 6) return JOURS_SEMAINE[d.getDay()]

  const jj = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${jj}/${mm}`
}
