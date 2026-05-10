export default function ChildDetailStats({ enfant }) {
  const stats = [
    { label: 'XP total',          value: enfant?.xp || 0,                 icon: '🌟', color: '#A78BFA' },
    { label: 'Leçons terminées',  value: enfant?.lecons_completees || 0,  icon: '📚', color: '#58CC02' },
    { label: 'Mots appris',       value: enfant?.mots_appris || 0,        icon: '🔤', color: '#3B82F6' },
    { label: 'Temps total appris', value: formatTemps(enfant?.temps_total_minutes || 0), icon: '⏱️', color: '#F59E0B' },
  ]

  return (
    <div>
      <h3 style={{
        fontFamily: 'Nunito, sans-serif',
        fontSize: '16px',
        fontWeight: '800',
        color: '#FFFFFF',
        margin: '0 0 12px',
      }}>
        Sa progression
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '18px',
            padding: '14px',
          }}>
            <div style={{ fontSize: '20px', marginBottom: '6px' }}>{s.icon}</div>
            <p style={{
              fontFamily: 'Nunito, sans-serif',
              fontSize: '24px',
              fontWeight: '900',
              color: s.color,
              margin: '0 0 2px',
              lineHeight: 1,
            }}>
              {s.value}
            </p>
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.45)',
              margin: 0,
            }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatTemps(minutes) {
  if (!minutes || minutes <= 0) return '0 min'
  if (minutes < 60) return `${minutes} min`
  const heures = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${heures} h`
  return `${heures}h${String(mins).padStart(2, '0')}`
}
