import { useState } from 'react'

const STUBS = [
  { icon: '✏️', label: 'Modifier le profil' },
  { icon: '📊', label: 'Voir progression détaillée' },
  { icon: '🌍', label: 'Ajouter une langue' },
]

export default function ChildDetailActions({ enfant }) {
  const [copie, setCopie] = useState(false)

  async function copierCode() {
    const code = enfant?.code_enfant
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    } catch (err) {
      console.error('Erreur copie code enfant', err)
      alert('Impossible de copier, réessaye')
    }
  }

  function actionStub() {
    alert('Bientôt disponible')
  }

  const code = enfant?.code_enfant
  const prenom = enfant?.nom?.split(' ')[0] || 'Ton enfant'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h3 style={{
        fontFamily: 'Nunito, sans-serif',
        fontSize: '16px',
        fontWeight: '800',
        color: '#FFFFFF',
        margin: '0',
      }}>
        Gestion
      </h3>

      {code && (
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '20px',
          padding: '18px',
        }}>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '11px',
            fontWeight: '700',
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            margin: '0 0 10px',
          }}>
            Code de connexion enfant
          </p>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
            <div style={{
              flex: 1,
              background: 'rgba(139,92,246,0.10)',
              border: '1px solid rgba(139,92,246,0.25)',
              borderRadius: '12px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '20px',
                fontWeight: '900',
                color: '#FFFFFF',
                letterSpacing: '0.08em',
              }}>
                {code}
              </span>
            </div>

            <button
              onClick={copierCode}
              style={{
                flexShrink: 0,
                background: copie ? 'linear-gradient(135deg, #58CC02, #4CAD00)' : 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                fontFamily: 'Nunito, sans-serif',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                padding: '0 14px',
                boxShadow: copie ? '0 0 20px rgba(88,204,2,0.35)' : '0 0 20px rgba(124,58,237,0.35)',
                transition: 'background 0.2s ease, box-shadow 0.2s ease',
                minWidth: '92px',
              }}
            >
              {copie ? '✓ Copié !' : '📋 Copier'}
            </button>
          </div>

          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.5)',
            margin: '10px 0 0',
            lineHeight: 1.4,
          }}>
            {prenom} peut se connecter avec ce code.
          </p>
        </div>
      )}

      {STUBS.map((s, i) => (
        <button
          key={i}
          onClick={actionStub}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '18px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            textAlign: 'left',
            color: '#FFFFFF',
            transition: 'background 0.15s ease',
          }}
        >
          <span style={{ fontSize: '20px' }}>{s.icon}</span>
          <span style={{ flex: 1 }}>
            <span style={{
              display: 'block',
              fontFamily: 'Nunito, sans-serif',
              fontSize: '14px',
              fontWeight: '800',
              color: '#FFFFFF',
            }}>
              {s.label}
            </span>
            <span style={{
              display: 'block',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.4)',
              marginTop: '2px',
            }}>
              Bientôt disponible
            </span>
          </span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '18px' }}>›</span>
        </button>
      ))}

      <button
        onClick={actionStub}
        style={{
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '18px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'rgba(255,255,255,0.55)',
          transition: 'background 0.15s ease',
          marginTop: '4px',
        }}
      >
        <span style={{ fontSize: '18px' }}>🔓</span>
        <span style={{ flex: 1 }}>
          <span style={{
            display: 'block',
            fontFamily: 'Nunito, sans-serif',
            fontSize: '13px',
            fontWeight: '700',
            color: 'rgba(255,255,255,0.6)',
          }}>
            Délier l'enfant
          </span>
          <span style={{
            display: 'block',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.35)',
            marginTop: '2px',
          }}>
            Bientôt disponible
          </span>
        </span>
      </button>
    </div>
  )
}
