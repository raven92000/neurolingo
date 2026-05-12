// Overlay interne affiché par EditProfileModal quand l'utilisateur tente de fermer
// avec des modifications non enregistrées. Position absolue dans la carte parente.
export default function ConfirmDiscardChanges({ onAnnuler, onQuitter }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(15,20,36,0.96)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px', borderRadius: '24px',
    }}>
      <h3 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '18px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 12px', textAlign: 'center', lineHeight: 1.3 }}>
        Modifications non enregistrées
      </h3>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: '0 0 24px', textAlign: 'center', lineHeight: 1.5 }}>
        Vous avez des modifications non enregistrées. Quitter quand même ?
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '280px' }}>
        <button
          onClick={onAnnuler}
          style={{
            background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
            color: '#FFFFFF', border: 'none', borderRadius: '14px',
            fontFamily: 'Nunito, sans-serif', fontSize: '15px', fontWeight: '800',
            padding: '14px 16px', cursor: 'pointer',
            boxShadow: '0 0 20px rgba(124,58,237,0.35)',
          }}
        >
          Annuler
        </button>
        <button
          onClick={onQuitter}
          style={{
            background: 'transparent',
            color: '#FCA5A5',
            border: '1px solid rgba(248,113,113,0.4)',
            borderRadius: '14px',
            fontFamily: 'Nunito, sans-serif', fontSize: '14px', fontWeight: '700',
            padding: '12px 16px', cursor: 'pointer',
          }}
        >
          Quitter sans enregistrer
        </button>
      </div>
    </div>
  )
}
