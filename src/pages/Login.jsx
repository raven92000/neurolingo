import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { normalizeLogin, buildChildFakeEmail, buildChildPassword } from '../utils/childAuth'
import Neuri3D from '../components/Neuri3D'

// ═══════════════════════════════════════════════════════════════════
// COMPOSANT INPUT MOT DE PASSE AVEC ŒIL
// ═══════════════════════════════════════════════════════════════════

function PasswordInput({ value, onChange, placeholder, style, inputMode, maxLength }) {
  const [visible, setVisible] = useState(false)

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        inputMode={inputMode}
        maxLength={maxLength}
        style={{ ...style, paddingRight: '48px' }}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        style={{
          position: 'absolute', right: '12px', top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent', border: 'none',
          cursor: 'pointer', padding: '6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        {visible ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M2 12 C5 6 8 5 12 5 C16 5 19 6 22 12 C19 18 16 19 12 19 C8 19 5 18 2 12 Z" stroke="rgba(255,255,255,0.6)" strokeWidth="1.6" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="3" stroke="rgba(255,255,255,0.6)" strokeWidth="1.6"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M2 12 C5 6 8 5 12 5 C16 5 19 6 22 12 C19 18 16 19 12 19 C8 19 5 18 2 12 Z" stroke="rgba(255,255,255,0.4)" strokeWidth="1.6" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="3" stroke="rgba(255,255,255,0.4)" strokeWidth="1.6"/>
            <path d="M4 4 L20 20" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        )}
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MODALE "MOT DE PASSE OUBLIÉ"
// ═══════════════════════════════════════════════════════════════════

function PopupForgotPassword({ onClose }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!email) return
    setLoading(true)
    await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)
    setSuccess(true)
  }

  const inputStyle = {
    width: '100%', height: '50px', padding: '0 16px',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px', color: '#FFFFFF', fontSize: '15px',
    fontFamily: 'DM Sans, sans-serif',
    boxSizing: 'border-box', outline: 'none', marginBottom: '14px'
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
      <div style={{ background: '#0F1626', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 28, maxWidth: 360, width: '100%' }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#FFFFFF', margin: '0 0 8px', textAlign: 'center', fontFamily: 'Nunito, sans-serif' }}>
          Mot de passe oublié ?
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: '0 0 20px', lineHeight: 1.5, fontFamily: 'DM Sans, sans-serif' }}>
          Entre ton adresse email pour recevoir un lien de réinitialisation.
        </p>

        {success ? (
          <>
            <div style={{ background: 'rgba(85,214,0,0.1)', border: '1px solid rgba(85,214,0,0.3)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: '#86EFAC', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
                Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.
              </p>
            </div>
            <button onClick={onClose} style={{ width: '100%', height: 48, background: '#8B5CF6', border: 'none', color: '#FFFFFF', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              Fermer
            </button>
          </>
        ) : (
          <>
            <input
              type="email"
              placeholder="Adresse email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} disabled={loading} style={{ flex: 1, height: 48, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Annuler</button>
              <button onClick={handleSubmit} disabled={loading || !email} style={{ flex: 1, height: 48, background: '#8B5CF6', border: 'none', color: '#FFFFFF', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', opacity: (loading || !email) ? 0.6 : 1, fontFamily: 'DM Sans, sans-serif' }}>
                {loading ? '...' : 'Envoyer'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState(searchParams.get('mode') || 'inscription')
  const [isParent, setIsParent] = useState(false)
  const [email, setEmail] = useState('')
  const isChildMode = !email.includes('@')
  const [motDePasse, setMotDePasse] = useState('')
  const [confirmMotDePasse, setConfirmMotDePasse] = useState('')
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [erreur, setErreur] = useState(null)
  const [chargement, setChargement] = useState(false)
  const [popupForgot, setPopupForgot] = useState(false)

  const handleSubmit = async () => {
    setErreur(null)

    if (mode === 'inscription') {
      if (!prenom || !nom) { setErreur('Merci de renseigner ton prénom et ton nom.'); return }
      if (!email) { setErreur('Merci de renseigner ton email.'); return }
      if (motDePasse.length < 6) { setErreur('Le mot de passe doit contenir au moins 6 caractères.'); return }
      if (motDePasse !== confirmMotDePasse) { setErreur('Les mots de passe ne correspondent pas.'); return }
    }

    setChargement(true)

    if (mode === 'inscription') {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password: motDePasse,
        options: { data: { prenom, nom } }
      })
      if (error) { setErreur(error.message); setChargement(false); return }

      const role = isParent ? 'parent' : 'child'

      await supabase.from('profils').insert({
        user_id: signUpData.user?.id,
        nom: `${prenom} ${nom}`,
        xp: 0,
        streak: 0,
        lecons_completees: 0,
        mots_appris: 0,
        temps_total_minutes: 0,
        profil_type: 'tdah',
        role: role,
      })

      if (role === 'parent') {
        navigate('/parent-create-child')
      } else {
        navigate('/onboarding')
      }
    } else {
      const signInPayload = isChildMode
        ? {
            email: buildChildFakeEmail(normalizeLogin(email)),
            password: buildChildPassword(normalizeLogin(email), motDePasse),
          }
        : { email, password: motDePasse }

      const { data: signInData, error } = await supabase.auth.signInWithPassword(signInPayload)
      if (error) { setErreur('Email ou mot de passe incorrect'); setChargement(false); return }

      const { data: profil } = await supabase.from('profils').select('role').eq('user_id', signInData.user.id).single()

      if (profil?.role === 'parent') {
        navigate('/parent-dashboard')
      } else {
        navigate('/dashboard')
      }
    }
    setChargement(false)
  }

  const inputStyle = {
    width: '100%',
    height: '52px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px',
    padding: '0 18px',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '15px',
    color: '#FFFFFF',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(109,40,217,0.18) 0%, #090E1A 55%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', maxWidth: '430px', margin: '0 auto' }}>

      <div style={{ width: '100px', height: '100px', marginBottom: '16px' }}>
        <Neuri3D color="#8B5CF6" />
      </div>

      <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '26px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 6px', textAlign: 'center' }}>
        {mode === 'inscription' ? 'Créer mon compte' : 'Bon retour !'}
      </h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.45)', margin: '0 0 28px', textAlign: 'center' }}>
        {mode === 'inscription' ? 'Commence à apprendre gratuitement' : 'Connecte-toi pour continuer'}
      </p>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>

        {mode === 'inscription' && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="text" placeholder="Prénom" value={prenom} onChange={e => setPrenom(e.target.value)} style={inputStyle}/>
            <input type="text" placeholder="Nom" value={nom} onChange={e => setNom(e.target.value)} style={inputStyle}/>
          </div>
        )}

        <input type="text" placeholder="Email ou identifiant" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle}/>

        <PasswordInput
          placeholder={isChildMode ? 'PIN (4 chiffres)' : 'Mot de passe'}
          value={motDePasse}
          onChange={e => setMotDePasse(isChildMode ? e.target.value.replace(/[^0-9]/g, '') : e.target.value)}
          style={inputStyle}
          inputMode={isChildMode ? 'numeric' : undefined}
          maxLength={isChildMode ? 4 : undefined}
        />

        {mode === 'inscription' && (
          <PasswordInput
            placeholder="Confirmer le mot de passe"
            value={confirmMotDePasse}
            onChange={e => setConfirmMotDePasse(e.target.value)}
            style={{
              ...inputStyle,
              border: confirmMotDePasse && motDePasse !== confirmMotDePasse
                ? '1px solid rgba(239,68,68,0.5)'
                : confirmMotDePasse && motDePasse === confirmMotDePasse
                ? '1px solid rgba(88,204,2,0.5)'
                : '1px solid rgba(255,255,255,0.1)',
            }}
          />
        )}

        {mode === 'inscription' && confirmMotDePasse && (
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: motDePasse === confirmMotDePasse ? '#86EFAC' : '#FCA5A5', margin: '0 0 4px 4px' }}>
            {motDePasse === confirmMotDePasse ? '✓ Les mots de passe correspondent' : '✗ Les mots de passe ne correspondent pas'}
          </p>
        )}
      </div>

      {mode === 'inscription' && (
        <div
          onClick={() => setIsParent(!isParent)}
          style={{
            width: '100%',
            padding: '10px 14px',
            marginBottom: '20px',
            background: isParent ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.04)',
            border: isParent ? '1.5px solid rgba(139,92,246,0.55)' : '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'all 0.2s ease',
            boxShadow: isParent ? '0 0 20px rgba(139,92,246,0.18)' : 'none',
          }}
        >
          <div style={{
            width: '22px',
            height: '22px',
            borderRadius: '6px',
            border: isParent ? '2px solid #8B5CF6' : '2px solid rgba(139,92,246,0.5)',
            background: isParent ? '#8B5CF6' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s ease',
          }}>
            {isParent && (
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M2 7 L6 11 L12 3" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>

          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="9" cy="8" r="3" stroke="#A78BFA" strokeWidth="1.8" fill="rgba(167,139,250,0.15)"/>
            <circle cx="16" cy="9" r="2.5" stroke="#A78BFA" strokeWidth="1.6" fill="rgba(167,139,250,0.15)"/>
            <path d="M3 19 C3 16 5 14 9 14 C13 14 15 16 15 19" stroke="#A78BFA" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M14 19 C14 17 15.5 15.5 18 15.5 C20 15.5 21 17 21 19" stroke="#A78BFA" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '13px', fontWeight: '700', color: '#FFFFFF', margin: 0, lineHeight: 1.25, whiteSpace: 'nowrap' }}>
              Je crée un compte pour mon enfant
            </p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '10px', color: 'rgba(255,255,255,0.55)', margin: '2px 0 0', lineHeight: 1.3, whiteSpace: 'nowrap' }}>
              Je pourrai suivre sa progression dans l'espace parent.
            </p>
          </div>
        </div>
      )}

      {mode === 'connexion' && (
        <p
          onClick={() => setPopupForgot(true)}
          style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: '13px',
            color: '#A78BFA', cursor: 'pointer', fontWeight: '600',
            margin: '0 0 16px', textAlign: 'right', width: '100%'
          }}
        >
          Mot de passe oublié ?
        </p>
      )}

      {erreur && (
        <div style={{ width: '100%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '12px 16px', marginBottom: '14px' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#FCA5A5', margin: 0 }}>{erreur}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={chargement}
        style={{ width: '100%', height: '54px', background: chargement ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: '#FFFFFF', border: 'none', borderRadius: '16px', fontSize: '17px', fontFamily: 'Nunito, sans-serif', fontWeight: '800', cursor: chargement ? 'not-allowed' : 'pointer', marginBottom: '16px', boxShadow: '0 0 28px rgba(124,58,237,0.35)' }}
      >
        {chargement ? 'Chargement...' : mode === 'inscription' ? 'Créer mon compte' : 'Se connecter'}
      </button>

      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0, textAlign: 'center' }}>
        {mode === 'inscription' ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
        <span onClick={() => { setMode(mode === 'inscription' ? 'connexion' : 'inscription'); setErreur(null) }} style={{ color: '#A78BFA', cursor: 'pointer', fontWeight: '600' }}>
          {mode === 'inscription' ? 'Se connecter' : "S'inscrire"}
        </span>
      </p>

      {popupForgot && <PopupForgotPassword onClose={() => setPopupForgot(false)} />}

    </div>
  )
}