import { useState } from 'react'
import { supabase } from '../../supabase'

// Modale de réinitialisation du code PIN d'un enfant par son parent.
// Le parent ne peut PAS revoir l'ancien PIN : il en saisit un nouveau.
// L'appel passe par la fonction sécurisée `reset_child_pin` côté base,
// qui vérifie que l'appelant est bien le parent lié à cet enfant.
export default function ResetPinModal({ isOpen, onClose, childUserId, prenom, onSuccess }) {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const fermer = () => {
    if (loading) return
    setPin('')
    setConfirmPin('')
    setError(null)
    setVisible(false)
    onClose()
  }

  const handleSubmit = async () => {
    setError(null)

    if (!/^[0-9]{4}$/.test(pin)) {
      setError('Le code PIN doit contenir exactement 4 chiffres.')
      return
    }
    if (pin !== confirmPin) {
      setError('Les deux codes PIN ne correspondent pas.')
      return
    }

    setLoading(true)
    const { error: rpcError } = await supabase.rpc('reset_child_pin', {
      p_child: childUserId,
      p_new_pin: pin,
    })
    setLoading(false)

    if (rpcError) {
      console.error('Erreur réinitialisation PIN', rpcError)
      setError("La réinitialisation a échoué. Réessaye dans un instant.")
      return
    }

    setPin('')
    setConfirmPin('')
    setVisible(false)
    onSuccess?.()
  }

  const inputStyle = {
    width: '100%', height: 50, padding: '0 16px',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, color: '#FFFFFF', fontSize: 18, letterSpacing: '0.3em',
    fontFamily: 'Nunito, sans-serif', fontWeight: 800, textAlign: 'center',
    boxSizing: 'border-box', outline: 'none', marginBottom: 10,
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
      <div style={{ background: '#0F1626', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 28, maxWidth: 360, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 28 }}>🔑</span>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#FFFFFF', margin: '0 0 8px', textAlign: 'center', fontFamily: 'Nunito, sans-serif' }}>
          Réinitialiser le code PIN
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: '0 0 20px', lineHeight: 1.5, fontFamily: 'DM Sans, sans-serif' }}>
          Choisis un nouveau code PIN à 4 chiffres pour {prenom || 'ton enfant'}. L'ancien ne fonctionnera plus.
        </p>

        <input
          type={visible ? 'text' : 'password'}
          inputMode="numeric"
          maxLength={4}
          placeholder="Nouveau PIN"
          value={pin}
          onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ''))}
          style={inputStyle}
        />
        <input
          type={visible ? 'text' : 'password'}
          inputMode="numeric"
          maxLength={4}
          placeholder="Confirmer le PIN"
          value={confirmPin}
          onChange={e => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
          style={{
            ...inputStyle,
            border: confirmPin && pin !== confirmPin
              ? '1px solid rgba(239,68,68,0.5)'
              : confirmPin && pin === confirmPin
              ? '1px solid rgba(88,204,2,0.5)'
              : '1px solid rgba(255,255,255,0.1)',
          }}
        />

        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          style={{ background: 'transparent', border: 'none', color: '#A78BFA', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', margin: '0 0 14px', padding: 0 }}
        >
          {visible ? 'Masquer les chiffres' : 'Afficher les chiffres'}
        </button>

        {error && (
          <p style={{ fontSize: 13, color: '#FCA5A5', margin: '0 0 12px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif' }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fermer} disabled={loading} style={{ flex: 1, height: 48, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={loading} style={{ flex: 1, height: 48, background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', border: 'none', color: '#FFFFFF', borderRadius: 14, fontSize: 14, fontWeight: 800, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: 'DM Sans, sans-serif' }}>
            {loading ? '...' : 'Réinitialiser'}
          </button>
        </div>
      </div>
    </div>
  )
}
