import { useMemo } from 'react'

const MOIS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const JOURS_HEADER = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function pad2(n) {
  return String(n).padStart(2, '0')
}

function formatYMD(date) {
  return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate())
}

function estMemeJour(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

function memeMois(a, b) {
  return a.annee === b.annee && a.mois === b.mois
}

// Construit la grille du mois affiché.
// On commence toujours par un lundi (peut être un jour du mois précédent),
// on génère 42 cellules (6 semaines), puis on tronque à 35 si la 6e ligne
// est entièrement hors du mois affiché.
function getJoursGrille(annee, mois) {
  const premierDuMois = new Date(annee, mois, 1)
  // getDay() : 0 = dimanche, 1 = lundi, ..., 6 = samedi
  // on veut le décalage avec lundi en début de semaine
  const decalage = (premierDuMois.getDay() + 6) % 7
  const debutGrille = new Date(annee, mois, 1 - decalage)
  const today = new Date()
  const jours = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(debutGrille)
    d.setDate(d.getDate() + i)
    jours.push({
      date: d,
      key: formatYMD(d),
      dansLeMois: d.getMonth() === mois && d.getFullYear() === annee,
      estAujourdhui: estMemeJour(d, today),
    })
  }
  const semaine6Hors = jours.slice(35).every(j => !j.dansLeMois)
  return semaine6Hors ? jours.slice(0, 35) : jours
}

function getIntensite(nb) {
  if (nb === 0) return null
  if (nb === 1) return 'rgba(167,139,250,0.15)'
  if (nb <= 3) return 'rgba(167,139,250,0.4)'
  if (nb <= 5) return 'rgba(167,139,250,0.7)'
  return 'rgba(139,92,246,1)'
}

export default function CalendrierMois({
  moisAffiche,
  changerMois,
  leconsParJour,
  jourSelectionne,
  setJourSelectionne,
  moisMin,
  moisMax,
}) {
  const jours = useMemo(
    () => getJoursGrille(moisAffiche.annee, moisAffiche.mois),
    [moisAffiche]
  )

  const peutReculer = !memeMois(moisAffiche, moisMin)
  const peutAvancer = !memeMois(moisAffiche, moisMax)

  function moisPrecedent() {
    if (!peutReculer) return
    const m = moisAffiche.mois === 0 ? 11 : moisAffiche.mois - 1
    const a = moisAffiche.mois === 0 ? moisAffiche.annee - 1 : moisAffiche.annee
    changerMois({ annee: a, mois: m })
  }

  function moisSuivant() {
    if (!peutAvancer) return
    const m = moisAffiche.mois === 11 ? 0 : moisAffiche.mois + 1
    const a = moisAffiche.mois === 11 ? moisAffiche.annee + 1 : moisAffiche.annee
    changerMois({ annee: a, mois: m })
  }

  const styleChevron = (actif) => ({
    background: actif ? 'rgba(255,255,255,0.06)' : 'transparent',
    border: '1px solid ' + (actif ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'),
    borderRadius: '10px',
    width: '36px',
    height: '36px',
    color: actif ? '#FFFFFF' : 'rgba(255,255,255,0.2)',
    fontSize: '14px',
    cursor: actif ? 'pointer' : 'default',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  })

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '24px',
        padding: '20px',
        boxShadow: '0 0 40px rgba(138,92,255,0.06)',
      }}
    >
      {/* Header navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <button
          onClick={moisPrecedent}
          disabled={!peutReculer}
          style={styleChevron(peutReculer)}
          aria-label="Mois précédent"
        >
          ◀
        </button>
        <h3 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '17px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
          {MOIS_FR[moisAffiche.mois]} {moisAffiche.annee}
        </h3>
        <button
          onClick={moisSuivant}
          disabled={!peutAvancer}
          style={styleChevron(peutAvancer)}
          aria-label="Mois suivant"
        >
          ▶
        </button>
      </div>

      {/* En-tête L M M J V S D */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '8px' }}>
        {JOURS_HEADER.map((j, i) => (
          <div
            key={i}
            style={{
              textAlign: 'center',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.4)',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 700,
              letterSpacing: '0.05em',
              paddingBottom: '4px',
            }}
          >
            {j}
          </div>
        ))}
      </div>

      {/* Grille */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
        {jours.map(j => {
          const nb = leconsParJour[j.key]?.length || 0
          const intensite = getIntensite(nb)
          const cliquable = j.dansLeMois && nb > 0
          const selectionne = cliquable && j.key === jourSelectionne

          let fond = 'transparent'
          if (j.dansLeMois) {
            fond = intensite || 'rgba(255,255,255,0.02)'
          }

          let border = '1px solid rgba(255,255,255,0.05)'
          if (selectionne) border = '2px solid #FFFFFF'
          else if (j.estAujourdhui && j.dansLeMois) border = '2px solid #A78BFA'

          return (
            <div
              key={j.key}
              onClick={() => cliquable && setJourSelectionne(j.key)}
              style={{
                aspectRatio: '1 / 1',
                background: fond,
                border,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: cliquable ? 'pointer' : 'default',
                fontFamily: 'Nunito, sans-serif',
                fontSize: '13px',
                fontWeight: 700,
                color: j.dansLeMois ? '#FFFFFF' : 'rgba(255,255,255,0.2)',
                userSelect: 'none',
                transition: 'transform 0.1s ease',
              }}
            >
              {j.date.getDate()}
            </div>
          )
        })}
      </div>

      {/* Légende intensité */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          marginTop: '18px',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.4)',
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        <span>Moins</span>
        <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'rgba(167,139,250,0.15)' }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'rgba(167,139,250,0.4)' }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'rgba(167,139,250,0.7)' }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'rgba(139,92,246,1)' }} />
        <span>Plus</span>
      </div>
    </div>
  )
}
