import { useState } from 'react'

export default function ConfirmUnlinkModal({ isOpen, onClose, onConfirm, prenomEnfant, erreur }) {
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  async function handleConfirm() {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  function handleOverlayClick() {
    if (!loading) onClose()
  }

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '360px',
          background: '#0F1424',
          border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 0 40px rgba(124,58,237,0.25)',
        }}
      >
        <h2 style={{
          fontFamily: 'Nunito, sans-serif',
          fontSize: '20px',
          fontWeight: '900',
          color: '#FFFFFF',
          margin: '0 0 16px',
          lineHeight: 1.3,
        }}>
          Délier {prenomEnfant} de ton compte ?
        </h2>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          margin: '0 0 18px',
        }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5 }}>
            ⚠️ Tu ne pourras plus voir sa progression.
          </p>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5 }}>
            💜 Son compte et ses leçons sont conservés.
          </p>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5 }}>
            🔗 Tu pourras la relier plus tard avec son code NEURI-XXXX.
          </p>
        </div>

        {erreur && (
          <div style={{
            background: 'rgba(252,165,165,0.08)',
            border: '1px solid rgba(252,165,165,0.25)',
            borderRadius: '12px',
            padding: '10px 12px',
            marginBottom: '14px',
          }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#FCA5A5', margin: 0, lineHeight: 1.4 }}>
              {erreur}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '14px',
              fontFamily: 'Nunito, sans-serif',
              fontSize: '15px',
              fontWeight: '800',
              padding: '14px 16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              boxShadow: loading ? 'none' : '0 0 20px rgba(124,58,237,0.35)',
              transition: 'opacity 0.15s ease',
            }}
          >
            Annuler
          </button>

          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              background: 'transparent',
              color: '#FCA5A5',
              border: '1px solid rgba(248,113,113,0.4)',
              borderRadius: '14px',
              fontFamily: 'Nunito, sans-serif',
              fontSize: '14px',
              fontWeight: '700',
              padding: '12px 16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'opacity 0.15s ease',
            }}
          >
            {loading ? 'Déliement en cours…' : 'Délier'}
          </button>
        </div>
      </div>
    </div>
  )
}
