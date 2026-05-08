import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { buildChildFakeEmail, buildChildPassword, normalizeLogin } from '../utils/childAuth'
import Neuri3D from '../components/Neuri3D'

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
        aria-label={visible ? 'Masquer le PIN' : 'Afficher le PIN'}
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

function isLoginValid(login) {
  return /^[a-z0-9_]{3,20}$/.test(login)
}

function calculateAgeYears(birthDateString) {
  const birthDate = new Date(birthDateString)
  if (Number.isNaN(birthDate.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  const dayDiff = today.getDate() - birthDate.getDate()

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1
  }

  return age
}

export default function ParentCreateChild() {
  const navigate = useNavigate()
  const [prenomEnfant, setPrenomEnfant] = useState('')
  const [identifiantLogin, setIdentifiantLogin] = useState('')
  const [codePin, setCodePin] = useState('')
  const [confirmCodePin, setConfirmCodePin] = useState('')
  const [dateNaissance, setDateNaissance] = useState('')
  const [erreur, setErreur] = useState(null)
  const [chargement, setChargement] = useState(false)
  const [succes, setSucces] = useState(null)

  const restoreParentSession = async (parentSession) => {
    try {
      await supabase.auth.setSession({
        access_token: parentSession.access_token,
        refresh_token: parentSession.refresh_token,
      })
    } catch (restoreError) {
      console.error('Erreur restauration session parent :', restoreError)
    }
  }

  const rollbackChildProfile = async (childUserId) => {
    try {
      await supabase.from('profils').delete().eq('user_id', childUserId)
    } catch (rollbackError) {
      console.error('Erreur rollback profil enfant :', rollbackError)
    }
  }

  const handleCreer = async () => {
    setErreur(null)

    const trimmedPrenom = prenomEnfant.trim()
    const trimmedLogin = identifiantLogin.trim()
    const normalizedLogin = normalizeLogin(trimmedLogin)

    if (!trimmedPrenom) {
      setErreur('Merci d’indiquer le prénom de votre enfant.')
      return
    }

    if (!trimmedLogin) {
      setErreur('Merci de choisir un identifiant de connexion.')
      return
    }

    if (normalizedLogin.length < 3) {
      setErreur('L’identifiant doit contenir au moins 3 lettres ou chiffres.')
      return
    }

    if (!isLoginValid(normalizedLogin)) {
      setErreur('L’identifiant doit contenir uniquement des lettres minuscules, des chiffres ou un underscore, entre 3 et 20 caractères.')
      return
    }

    if (!/^[0-9]{4}$/.test(codePin)) {
      setErreur('Le code PIN doit contenir exactement 4 chiffres.')
      return
    }

    if (codePin !== confirmCodePin) {
      setErreur('La confirmation du PIN ne correspond pas.')
      return
    }

    if (!dateNaissance) {
      setErreur('Merci de renseigner la date de naissance de l’enfant.')
      return
    }

    const birthDate = new Date(dateNaissance)
    if (Number.isNaN(birthDate.getTime())) {
      setErreur('Date de naissance invalide.')
      return
    }

    const birthYear = birthDate.getFullYear()
    const currentYear = new Date().getFullYear()
    if (birthYear < 1900 || birthYear > currentYear) {
      setErreur('Date de naissance invalide.')
      return
    }

    const age = calculateAgeYears(dateNaissance)
    if (age === null) {
      setErreur('La date de naissance est invalide.')
      return
    }

    if (birthDate > new Date()) {
      setErreur('La date de naissance ne peut pas être dans le futur.')
      return
    }

    if (age >= 18) {
      setErreur('Pour les utilisateurs de 18 ans et plus, ils peuvent créer leur propre compte directement sur l’application.')
      return
    }

    setChargement(true)

    try {
      const { data: { session: parentSession }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !parentSession) {
        setErreur('Session expirée, veuillez vous reconnecter.')
        setChargement(false)
        return
      }

      const parentUserId = parentSession.user.id

      const { data: parentProfil, error: parentProfilError } = await supabase
        .from('profils')
        .select('identifiant_parent')
        .eq('user_id', parentUserId)
        .single()

      if (parentProfilError) {
        console.error('Erreur récupération profil parent :', parentProfilError)
        setErreur('Impossible de récupérer le profil parent. Réessayez.')
        setChargement(false)
        return
      }

      const { data: existingLogin, error: loginError } = await supabase
        .from('profils')
        .select('user_id')
        .eq('identifiant_login', normalizedLogin)
        .maybeSingle()

      if (loginError) {
        console.error('Erreur vérification identifiant :', loginError)
        setErreur('Impossible de vérifier l’identifiant. Réessayez.')
        setChargement(false)
        return
      }

      if (existingLogin) {
        setErreur('Cet identifiant est déjà utilisé. Choisissez-en un autre.')
        setChargement(false)
        return
      }

      const fakeEmail = buildChildFakeEmail(normalizedLogin)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: fakeEmail,
        password: buildChildPassword(normalizedLogin, codePin),
        options: { data: { prenom: trimmedPrenom } },
      })

      if (signUpError) {
        console.error('Erreur signUp enfant :', signUpError)
        setErreur(signUpError.message || 'Impossible de créer le compte enfant.')
        setChargement(false)
        return
      }

      const childUserId = signUpData.user?.id
      if (!childUserId) {
        setErreur('Erreur lors de la création du compte enfant. Réessayez.')
        setChargement(false)
        return
      }

      const { error: insertProfilError } = await supabase.from('profils').insert({
        user_id: childUserId,
        nom: trimmedPrenom,
        identifiant_login: normalizedLogin,
        code_pin: codePin,
        date_naissance: dateNaissance,
        xp: 0,
        streak: 0,
        lecons_completees: 0,
        mots_appris: 0,
        temps_total_minutes: 0,
        profil_type: 'tdah',
        role: 'child',
      })

      if (insertProfilError) {
        console.error('Erreur insertion profil enfant :', insertProfilError)
        await restoreParentSession(parentSession)
        setErreur('La création a échoué lors de l’enregistrement du profil. Réessayez.')
        setChargement(false)
        return
      }

      const { data: childProfil, error: childProfilError } = await supabase
        .from('profils')
        .select('code_enfant')
        .eq('user_id', childUserId)
        .single()

      if (childProfilError || !childProfil?.code_enfant) {
        console.error('Erreur récupération code enfant :', childProfilError)
        await rollbackChildProfile(childUserId)
        await restoreParentSession(parentSession)
        setErreur('La création a échoué. Réessayez.')
        setChargement(false)
        return
      }

      await restoreParentSession(parentSession)

      const { error: linkError } = await supabase.from('parent_child_links').insert({
        parent_id: parentUserId,
        child_id: childUserId,
      })

      if (linkError) {
        console.error('Erreur création lien parent-enfant :', linkError)
        await rollbackChildProfile(childUserId)
        setErreur('La création a échoué lors de la liaison parent-enfant. Réessayez.')
        setChargement(false)
        return
      }

      setSucces({
        codeEnfant: childProfil.code_enfant,
        identifiantLogin: normalizedLogin,
        identifiantParent: parentProfil?.identifiant_parent,
        prenomEnfant: trimmedPrenom,
      })
    } catch (e) {
      console.error('Erreur création enfant :', e)
      setErreur('La création a échoué, merci de réessayer.')
    } finally {
      setChargement(false)
    }
  }

  const inputStyle = {
    width: '100%', height: '52px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px', padding: '0 18px',
    fontFamily: 'DM Sans, sans-serif', fontSize: '15px',
    color: '#FFFFFF', outline: 'none', boxSizing: 'border-box',
  }

  // ─── ÉCRAN DE SUCCÈS ─────────────────────────────────────
  if (succes) {
    return (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(85,214,0,0.12) 0%, #090E1A 55%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', maxWidth: '430px', margin: '0 auto' }}>

        <div style={{ width: '120px', height: '120px', marginBottom: '20px' }}>
          <Neuri3D color="#58CC02" />
        </div>

        <div style={{ background: 'rgba(85,214,0,0.15)', border: '1px solid rgba(85,214,0,0.3)', borderRadius: '20px', padding: '6px 16px', marginBottom: '16px' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: '700', color: '#86EFAC', margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>🎉 Compte créé avec succès</p>
        </div>

        <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '26px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 12px', textAlign: 'center', lineHeight: 1.2 }}>
          Le compte de {succes.prenomEnfant} est prêt !
        </h1>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.6)', textAlign: 'center', margin: '0 0 28px', lineHeight: 1.5 }}>
          Notez bien ces identifiants, votre enfant les utilisera pour se connecter.
        </p>

        <div style={{ width: '100%', background: 'rgba(139,92,246,0.08)', border: '1.5px solid rgba(139,92,246,0.4)', borderRadius: '20px', padding: '20px', marginBottom: '14px', boxShadow: '0 0 28px rgba(139,92,246,0.18)' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: '700', color: '#A78BFA', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>Identifiant de connexion</p>
          <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '28px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 6px', letterSpacing: '0.05em' }}>{succes.identifiantLogin}</p>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.4 }}>
            Ce login sera utilisé par votre enfant pour se connecter avec son code PIN.
          </p>
        </div>

        <div style={{ width: '100%', background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.4)', borderRadius: '20px', padding: '20px', marginBottom: '14px', boxShadow: '0 0 28px rgba(59,130,246,0.16)' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: '700', color: '#60A5FA', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>Code NEURI</p>
          <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '28px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 6px', letterSpacing: '0.05em' }}>{succes.codeEnfant}</p>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.4 }}>
            Ce code permet de retrouver le compte et de le lier si nécessaire.
          </p>
        </div>

        {succes.identifiantParent && (
          <div style={{ width: '100%', background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.4)', borderRadius: '20px', padding: '20px', marginBottom: '28px' }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: '700', color: '#60A5FA', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>Votre identifiant parent</p>
            <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '28px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 6px', letterSpacing: '0.05em' }}>{succes.identifiantParent}</p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.4 }}>
              Votre identifiant personnel pour gérer les comptes enfants liés.
            </p>
          </div>
        )}

        <button
          onClick={() => navigate('/parent-dashboard')}
          style={{ width: '100%', height: '54px', background: 'linear-gradient(135deg, #58CC02, #3DAD00)', color: '#FFFFFF', border: 'none', borderRadius: '16px', fontSize: '17px', fontFamily: 'Nunito, sans-serif', fontWeight: '800', cursor: 'pointer', boxShadow: '0 0 28px rgba(88,204,2,0.35)' }}
        >
          Accéder à mon espace parent
        </button>
      </div>
    )
  }

  // ─── ÉCRAN DE CRÉATION ───────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(109,40,217,0.18) 0%, #090E1A 55%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', maxWidth: '430px', margin: '0 auto' }}>

      <div style={{ width: '100px', height: '100px', marginBottom: '16px' }}>
        <Neuri3D color="#8B5CF6" />
      </div>

      <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '26px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 6px', textAlign: 'center', lineHeight: 1.2 }}>
        Créer le compte<br />de votre <span style={{ color: '#A78BFA' }}>enfant</span>
      </h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.55)', margin: '0 0 28px', textAlign: 'center', lineHeight: 1.5 }}>
        Vous pourrez suivre sa progression<br />depuis votre espace parent.
      </p>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Prénom de votre enfant"
          value={prenomEnfant}
          onChange={e => setPrenomEnfant(e.target.value)}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="matheo_08"
          value={identifiantLogin}
          onChange={e => setIdentifiantLogin(e.target.value)}
          style={inputStyle}
        />
        <PasswordInput
          placeholder="Code PIN (4 chiffres)"
          value={codePin}
          onChange={e => setCodePin(e.target.value.replace(/[^0-9]/g, ''))}
          style={inputStyle}
          inputMode="numeric"
          maxLength={4}
        />
        <PasswordInput
          placeholder="Confirmer le code PIN"
          value={confirmCodePin}
          onChange={e => setConfirmCodePin(e.target.value.replace(/[^0-9]/g, ''))}
          style={{
            ...inputStyle,
            border: confirmCodePin && codePin !== confirmCodePin
              ? '1px solid rgba(239,68,68,0.5)'
              : confirmCodePin && codePin === confirmCodePin
              ? '1px solid rgba(88,204,2,0.5)'
              : '1px solid rgba(255,255,255,0.1)',
          }}
          inputMode="numeric"
          maxLength={4}
        />
        {confirmCodePin && (
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: codePin === confirmCodePin ? '#86EFAC' : '#FCA5A5', margin: '0 0 4px 4px' }}>
            {codePin === confirmCodePin ? '✓ Les codes PIN correspondent' : '✗ Les codes PIN ne correspondent pas'}
          </p>
        )}
        <input
          type="date"
          placeholder="Date de naissance"
          value={dateNaissance}
          onChange={e => setDateNaissance(e.target.value)}
          style={inputStyle}
        />
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0 4px', lineHeight: 1.4, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
            <circle cx="12" cy="12" r="10" stroke="#A78BFA" strokeWidth="2" fill="rgba(167,139,250,0.15)"/>
            <circle cx="12" cy="8" r="1.2" fill="#A78BFA"/>
            <path d="M12 11.5 L12 16.5" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>Notez bien ces identifiants : votre enfant les utilisera pour se connecter à NeuroLingo.</span>
        </p>
      </div>

      {erreur && (
        <div style={{ width: '100%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '12px 16px', marginBottom: '14px' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#FCA5A5', margin: 0 }}>{erreur}</p>
        </div>
      )}

      <button
        onClick={handleCreer}
        disabled={chargement}
        style={{ width: '100%', height: '54px', background: chargement ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: '#FFFFFF', border: 'none', borderRadius: '16px', fontSize: '17px', fontFamily: 'Nunito, sans-serif', fontWeight: '800', cursor: chargement ? 'not-allowed' : 'pointer', marginBottom: '14px', boxShadow: '0 0 28px rgba(124,58,237,0.35)' }}
      >
        {chargement ? 'Création en cours...' : 'Créer le compte enfant'}
      </button>
    </div>
  )
}