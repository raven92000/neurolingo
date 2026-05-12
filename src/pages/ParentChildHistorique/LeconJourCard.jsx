export default function LeconJourCard({ titre, heure, duree, chapitre }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '18px',
        padding: '14px 16px',
      }}
    >
      <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '15px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px' }}>
        {titre}
      </p>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: '0 0 4px' }}>
        {heure}{duree ? ' · ' + duree + ' min' : ''}
      </p>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(167,139,250,0.9)', margin: 0 }}>
        Chapitre : {chapitre}
      </p>
    </div>
  )
}
