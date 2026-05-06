import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase'
import Neuri3D from '../components/Neuri3D'

// ═══════════════════════════════════════════════════════════════════
// COMPOSANT INPUT MOT DE PASSE AVEC ŒIL
// ═══════════════════════════════════════════════════════════════════

function PasswordInput({ value, onChange, placeholder, style }) {
  const [visible, setVisible] = useState(false)

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
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
  const [role, setRole] = useState('child') // 👈 NOUVEAU : par défaut enfant
  const [email, setEmail] = useState('')
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

      // Création du profil avec le rôle choisi
      await supabase.from('profils').insert({
        user_id: signUpData.user?.id,
        nom: `${prenom} ${nom}`,
        xp: 0,
        streak: 0,
        lecons_completees: 0,
        mots_appris: 0,
        temps_total_minutes: 0,
        profil_type: 'tdah',
        role: role, // 👈 NOUVEAU
      })

      // Redirection selon le rôle
      if (role === 'parent') {
        navigate('/parent-create-child') // 👈 NOUVEAU : parent crée le compte de son enfant
      } else {
        navigate('/onboarding') // Enfant continue normalement
      }
    } else {
      // CONNEXION : récupérer le rôle pour rediriger correctement
      const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password: motDePasse })
      if (error) { setErreur('Email ou mot de passe incorrect'); setChargement(false); return }

      const { data: profil } = await supabase.from('profils').select('role').eq('user_id', signInData.user.id).single()

      if (profil?.role === 'parent') {
        navigate('/parent-dashboard') // 👈 NOUVEAU
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

      {/* 👈 NOUVEAU : SÉLECTEUR DE RÔLE (uniquement en inscription) */}
      {mode === 'inscription' && (
        <div style={{ width: '100%', marginBottom: '14px' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: '0 0 10px 4px', fontWeight: '600' }}>Je suis :</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div
              onClick={() => setRole('child')}
              style={{
                flex: 1, padding: '14px 12px', borderRadius: '14px', cursor: 'pointer',
                background: role === 'child' ? 'rgba(139,92,246,0.14)' : 'rgba(255,255,255,0.04)',
                border: role === 'child' ? '1.5px solid rgba(139,92,246,0.55)' : '1px solid rgba(255,255,255,0.08)',
                boxShadow: role === 'child' ? '0 0 20px rgba(139,92,246,0.18)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}
            >
              <div style={{ fontSize: '22px' }}>🧒</div>
              <div>
                <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '15px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>Enfant</p>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: '2px 0 0' }}>J'apprends une langue</p>
              </div>
            </div>
            <div
              onClick={() => setRole('parent')}
              style={{
                flex: 1, padding: '14px 12px', borderRadius: '14px', cursor: 'pointer',
                background: role === 'parent' ? 'rgba(139,92,246,0.14)' : 'rgba(255,255,255,0.04)',
                border: role === 'parent' ? '1.5px solid rgba(139,92,246,0.55)' : '1px solid rgba(255,255,255,0.08)',
                boxShadow: role === 'parent' ? '0 0 20px rgba(139,92,246,0.18)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}
            >
              <div style={{ fontSize: '22px' }}>👨‍👩‍👧</div>
              <div>
                <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '15px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>Parent</p>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: '2px 0 0' }}>J'accompagne mon enfant</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>

        {mode === 'inscription' && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="text" placeholder="Prénom" value={prenom} onChange={e => setPrenom(e.target.value)} style={inputStyle}/>
            <input type="text" placeholder="Nom" value={nom} onChange={e => setNom(e.target.value)} style={inputStyle}/>
          </div>
        )}

        <input type="email" placeholder="Adresse email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle}/>

        <PasswordInput
          placeholder="Mot de passe"
          value={motDePasse}
          onChange={e => setMotDePasse(e.target.value)}
          style={inputStyle}
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