import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Neuri3D from '../components/Neuri3D'

export default function ParentCreateChild() {
  const navigate = useNavigate()
  const [prenomEnfant, setPrenomEnfant] = useState('')
  const [emailEnfant, setEmailEnfant] = useState('')
  const [motDePasseEnfant, setMotDePasseEnfant] = useState('')
  const [erreur, setErreur] = useState(null)
  const [chargement, setChargement] = useState(false)
  const [succes, setSucces] = useState(null) // { codeEnfant, identifiantParent }

  const handleCreer = async () => {
    setErreur(null)

    if (!prenomEnfant.trim()) { setErreur("Merci d'indiquer le prénom de votre enfant."); return }
    if (!emailEnfant.trim()) { setErreur("Merci d'indiquer un email pour le compte enfant."); return }
    if (motDePasseEnfant.length < 6) { setErreur('Le mot de passe doit contenir au moins 6 caractères.'); return }

    setChargement(true)

    try {
      // Sauvegarder la session parent actuelle
      const { data: { session: parentSession } } = await supabase.auth.getSession()
      if (!parentSession) { setErreur('Session expirée, veuillez vous reconnecter.'); setChargement(false); return }
      const parentUserId = parentSession.user.id

      // Récupérer l'identifiant_parent du parent
      const { data: parentProfil } = await supabase
        .from('profils')
        .select('identifiant_parent')
        .eq('user_id', parentUserId)
        .single()

      // Créer le compte enfant (cela va déconnecter le parent automatiquement)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: emailEnfant,
        password: motDePasseEnfant,
        options: { data: { prenom: prenomEnfant } }
      })

      if (signUpError) { setErreur(signUpError.message); setChargement(false); return }

      const childUserId = signUpData.user?.id
      if (!childUserId) { setErreur("Erreur lors de la création du compte enfant."); setChargement(false); return }

      // Créer le profil enfant
      await supabase.from('profils').insert({
        user_id: childUserId,
        nom: prenomEnfant,
        xp: 0,
        streak: 0,
        lecons_completees: 0,
        mots_appris: 0,
        temps_total_minutes: 0,
        profil_type: 'tdah',
        role: 'child',
      })

      // Récupérer le code enfant qui vient d'être généré par le trigger
      const { data: childProfil } = await supabase
        .from('profils')
        .select('code_enfant')
        .eq('user_id', childUserId)
        .single()

      // Créer le lien parent ↔ enfant
      // ⚠️ Important : on doit le faire pendant que l'enfant est connecté car les RLS peuvent bloquer sinon
      // On crée d'abord le lien
      await supabase.from('parent_child_links').insert({
        parent_id: parentUserId,
        child_id: childUserId,
      })

      // Reconnecter le parent (signUp connecte automatiquement le nouvel utilisateur)
      // On force la session du parent à reprendre
      await supabase.auth.setSession({
        access_token: parentSession.access_token,
        refresh_token: parentSession.refresh_token,
      })

      setSucces({
        codeEnfant: childProfil?.code_enfant,
        identifiantParent: parentProfil?.identifiant_parent,
        prenomEnfant: prenomEnfant.trim(),
      })
    } catch (e) {
      console.error('Erreur création enfant:', e)
      setErreur("Une erreur est survenue. Réessayez.")
    }
    setChargement(false)
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
          Voici les codes à conserver précieusement.
        </p>

        {/* CODE ENFANT */}
        <div style={{ width: '100%', background: 'rgba(139,92,246,0.08)', border: '1.5px solid rgba(139,92,246,0.4)', borderRadius: '20px', padding: '20px', marginBottom: '14px', boxShadow: '0 0 28px rgba(139,92,246,0.18)' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: '700', color: '#A78BFA', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>Code enfant</p>
          <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '28px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 6px', letterSpacing: '0.05em' }}>{succes.codeEnfant}</p>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.4 }}>
            Code à conserver. Il sert à lier le compte de votre enfant à un autre parent si besoin.
          </p>
        </div>

        {/* IDENTIFIANT PARENT */}
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

      <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '26px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 6px', textAlign: 'center' }}>
        Créer le compte de votre enfant
      </h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.55)', margin: '0 0 28px', textAlign: 'center', lineHeight: 1.5 }}>
        Vous pourrez suivre sa progression depuis votre espace parent.
      </p>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        <input type="text" placeholder="Prénom de votre enfant" value={prenomEnfant} onChange={e => setPrenomEnfant(e.target.value)} style={inputStyle}/>
        <input type="email" placeholder="Email du compte enfant" value={emailEnfant} onChange={e => setEmailEnfant(e.target.value)} style={inputStyle}/>
        <input type="password" placeholder="Mot de passe (6 caractères min.)" value={motDePasseEnfant} onChange={e => setMotDePasseEnfant(e.target.value)} style={inputStyle}/>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0 4px', lineHeight: 1.4 }}>
          💡 Notez bien ces identifiants : votre enfant les utilisera pour se connecter à NeuroLingo.
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

      <p
        onClick={() => navigate('/parent-dashboard')}
        style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', textAlign: 'center', margin: 0 }}
      >
        Je le ferai plus tard
      </p>

    </div>
  )
}