// Fonction pure : génère un message émotionnel et rassurant pour le parent
// en fonction de l'activité de son enfant.
// Reçoit un objet { prenom, streak, lecons_completees, derniereActivite }
// derniereActivite : ISO string ou null
export function genererMessageEmotionnel({ prenom, streak, lecons_completees, derniereActivite }) {
  const nom = prenom || 'Ton enfant'

  if (streak >= 7) return `${nom} apprend tous les jours ! 🌟`
  if (streak >= 3) return `${nom} apprend régulièrement cette semaine ✨`

  if (derniereActivite) {
    const joursDepuis = Math.floor((Date.now() - new Date(derniereActivite).getTime()) / 86400000)
    if (joursDepuis <= 7) return `${nom} a fait des progrès cette semaine 💜`
    if (joursDepuis <= 30) return `${nom} reprend doucement, c'est très bien 🌱`
  }

  if (!lecons_completees || lecons_completees === 0) {
    return `${nom} est prêt(e) à découvrir une nouvelle langue ✨`
  }

  return `${nom} avance à son rythme, et c'est parfait 💜`
}
