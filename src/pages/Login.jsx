import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Neuri3D from '../components/Neuri3D'

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('inscription')
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [nom, setNom] = useState('')
  const [erreur, setErreur] = useState(null)
  const [chargement, setChargement] = useState(false)

  const handleSubmit = async () => {
    setErreur(null)
    setChargement(true)

    if (mode === 'inscription') {
      const { error } = await supabase.auth.signUp({
        email,
        password: motDePasse,
        options: { data: { nom } }
      })
      if (error) {
        setErreur(error.message)
        setChargement(false)
        return
      }
      // Créer le profil dans la base
      await supabase.from('profils').insert({
        nom: nom || 'Utilisateur',
        xp: 0, streak: 0,
        lecons_completees: 0,
        mots_appris: 0,
        temps_total_minutes: 0,
        profil_type: 'tdah',
      })
      navigate('/onboarding')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse })
      if (error) {
        setErreur('Email ou mot de passe incorrect')
        setChargement(false)
        return
      }
      navigate('/dashboard')
    }
    setChargement(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(109,40,217,0.18) 0%, #090E1A 55%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', maxWidth: '430px', margin: '0 auto' }}>

      {/* Neuri */}
      <div style={{ width: '120px', height: '120px', marginBottom: '16px' }}>
        <Neuri3D color="#8B5CF6" />
      </div>

      <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '28px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 8px', textAlign: 'center' }}>
        {mode === 'inscription' ? 'Créer mon compte' : 'Bon retour !'}
      </h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', color: 'rgba(255,255,255,0.45)', margin: '0 0 36px', textAlign: 'center' }}>
        {mode === 'inscription' ? 'Commence à apprendre gratuitement' : 'Connecte-toi pour continuer'}
      </p>

      {/* Formulaire */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>

        {mode === 'inscription' && (
          <input
            type="text"
            placeholder="Ton prénom"
            value={nom}
            onChange={e => setNom(e.target.value)}
            style={{ width: '100%', height: '52px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '0 18px', fontFamily: 'DM Sans, sans-serif', fontSize: '15px', color: '#FFFFFF', outline: 'none', boxSizing: 'border-box' }}
          />
        )}

        <input
          type="email"
          placeholder="Ton adresse email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', height: '52px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '0 18px', fontFamily: 'DM Sans, sans-serif', fontSize: '15px', color: '#FFFFFF', outline: 'none', boxSizing: 'border-box' }}
        />

        <input
          type="password"
          placeholder="Ton mot de passe"
          value={motDePasse}
          onChange={e => setMotDePasse(e.target.value)}
          style={{ width: '100%', height: '52px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '0 18px', fontFamily: 'DM Sans, sans-serif', fontSize: '15px', color: '#FFFFFF', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Erreur */}
      {erreur && (
        <div style={{ width: '100%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#FCA5A5', margin: 0 }}>{erreur}</p>
        </div>
      )}

      {/* Bouton principal */}
      <button
        onClick={handleSubmit}
        disabled={chargement}
        style={{ width: '100%', height: '54px', background: chargement ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: '#FFFFFF', border: 'none', borderRadius: '16px', fontSize: '17px', fontFamily: 'Nunito, sans-serif', fontWeight: '800', cursor: chargement ? 'not-allowed' : 'pointer', marginBottom: '16px', boxShadow: '0 0 28px rgba(124,58,237,0.35)' }}
      >
        {chargement ? 'Chargement...' : mode === 'inscription' ? 'Créer mon compte' : 'Se connecter'}
      </button>

      {/* Switcher mode */}
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0, textAlign: 'center' }}>
        {mode === 'inscription' ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
        <span
          onClick={() => { setMode(mode === 'inscription' ? 'connexion' : 'inscription'); setErreur(null) }}
          style={{ color: '#A78BFA', cursor: 'pointer', fontWeight: '600' }}
        >
          {mode === 'inscription' ? 'Se connecter' : "S'inscrire"}
        </span>
      </p>

    </div>
  )
}