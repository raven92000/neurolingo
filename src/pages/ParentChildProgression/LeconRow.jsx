export default function LeconRow({ lecon }) {
  const { titre, statut } = lecon

  const configStatut = {
    terminee: {
      icone: '✅',
      couleurTitre: 'rgba(255,255,255,0.9)',
      label: 'Terminée',
      couleurLabel: '#58CC02',
    },
    en_cours: {
      icone: '⏳',
      couleurTitre: 'rgba(255,255,255,0.85)',
      label: 'En cours',
      couleurLabel: '#F59E0B',
    },
    non_commencee: {
      icone: '•',
      couleurTitre: 'rgba(255,255,255,0.4)',
      label: 'Non commencée',
      couleurLabel: 'rgba(255,255,255,0.35)',
    },
  }

  const config = configStatut[statut] || configStatut.non_commencee

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 4px',
      borderTop: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{
        fontSize: statut === 'non_commencee' ? '20px' : '16px',
        width: '22px',
        textAlign: 'center',
        color: statut === 'non_commencee' ? 'rgba(255,255,255,0.3)' : undefined,
        lineHeight: 1,
      }}>
        {config.icone}
      </span>

      <span style={{
        flex: 1,
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '14px',
        fontWeight: 600,
        color: config.couleurTitre,
      }}>
        {titre}
      </span>

      <span style={{
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '11px',
        fontWeight: 700,
        color: config.couleurLabel,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {config.label}
      </span>
    </div>
  )
}
