import { formatDateRelative } from './formatDateRelative'

export default function ChildDetailActivity({ activites, prenom }) {
  const aucune = !activites || activites.length === 0
  const prenomAffiche = prenom || 'Ton enfant'

  return (
    <div>
      <h3 style={{
        fontFamily: 'Nunito, sans-serif',
        fontSize: '16px',
        fontWeight: '800',
        color: '#FFFFFF',
        margin: '0 0 12px',
      }}>
        Activité récente
      </h3>

      {aucune ? (
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '18px',
          padding: '16px 18px',
        }}>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.6)',
            margin: 0,
            lineHeight: 1.5,
          }}>
            {prenomAffiche} n'a pas encore terminé de leçon — ses premières aventures arrivent ✨
          </p>
        </div>
      ) : (
        <ul style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '18px',
          overflow: 'hidden',
        }}>
          {activites.map((a, i) => (
            <li
              key={a.id || i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '12px 16px',
                borderBottom: i < activites.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}
            >
              <span style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '14px',
                fontWeight: '700',
                color: '#FFFFFF',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {a.titre || 'Leçon'}
              </span>
              <span style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.45)',
                flexShrink: 0,
              }}>
                {formatDateRelative(a.completee_le)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
