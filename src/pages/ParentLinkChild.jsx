import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Neuri3D from '../components/Neuri3D'

export default function ParentLinkChild() {
  const navigate = useNavigate()
  const [codeEnfant, setCodeEnfant] = useState('')
  const [erreur, setErreur] = useState(null)
  const [chargement, setChargement] = useState(false)
  const [succes, setSucces] = useState(null)

  const handleLier = async () => {
    setErreur(null)

    const code = codeEnfant.trim().toUpperCase()
    if (!code.startsWith('NEURI-') || code.length < 8) {
      setErreur('Le code doit ressembler à NEURI-1234')
      return
    }

    setChargement(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login'); return }

      const { data: parentProfil } = await supabase
        .from('profils')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (parentProfil?.role !== 'parent') {
        setErreur('Seul un compte parent peut lier un enfant.')
        setChargement(false)
        return
      }

      // Lookup via RPC SECURITY DEFINER : contourne la RLS de manière sécurisée.
      // Sans ça, un parent ne peut pas lire un profil enfant tant qu'aucun lien n'existe
      // (typiquement après un délier, ou pour un tout premier lien).
      // La RPC fait déjà upper(trim()) et filtre role='child' côté serveur.
      const { data: enfantTrouve, error: errLookup } = await supabase
        .rpc('find_child_by_code', { p_code: code })
        .single()

      if (errLookup || !enfantTrouve) {
        setErreur("Aucun enfant trouvé avec ce code. Vérifiez et réessayez.")
        setChargement(false)
        return
      }

      // La RPC renvoie child_user_id (et non user_id) — c'est l'identifiant auth de l'enfant
      const { error: errLien } = await supabase.from('parent_child_links').insert({
        parent_id: user.id,
        child_id: enfantTrouve.child_user_id,
      })

      if (errLien) {
        if (errLien.code === '23505') {
          // 23505 = violation de contrainte unique : ce lien parent↔enfant existe déjà
          setErreur("Cet enfant est déjà lié à votre compte.")
        } else {
          setErreur("Erreur lors de la liaison. Réessayez dans un instant.")
        }
        setChargement(false)
        return
      }

      setSucces({ prenomEnfant: enfantTrouve.nom })
    } catch (e) {
      console.error('Erreur liaison:', e)
      setErreur("Une erreur est survenue. Réessayez.")
    }
    setChargement(false)
  }

  const handleChangeCode = (e) => {
    let val = e.target.value.toUpperCase().replace(/\s/g, '')
    if (val && !val.startsWith('NEURI') && /^\d/.test(val)) {
      val = 'NEURI-' + val
    }
    if (val.length > 10) val = val.slice(0, 10)
    setCodeEnfant(val)
  }

  // ─── ÉCRAN SUCCÈS ─────────────────────────────────────────
  if (succes) {
    return (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(85,214,0,0.12) 0%, #090E1A 55%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', maxWidth: '430px', margin: '0 auto' }}>

        <div style={{ width: '120px', height: '120px', marginBottom: '20px' }}>
          <Neuri3D color="#58CC02" />
        </div>

        <div style={{ background: 'rgba(85,214,0,0.15)', border: '1px solid rgba(85,214,0,0.3)', borderRadius: '20px', padding: '6px 16px', marginBottom: '16px' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: '700', color: '#86EFAC', margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>✅ Liaison réussie</p>
        </div>

        <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '26px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 12px', textAlign: 'center', lineHeight: 1.2 }}>
          {succes.prenomEnfant} est maintenant lié à votre compte
        </h1>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.6)', textAlign: 'center', margin: '0 0 32px', lineHeight: 1.5 }}>
          Vous pouvez maintenant suivre sa progression depuis votre espace parent.
        </p>

        <button
          onClick={() => navigate('/parent-dashboard')}
          style={{ width: '100%', height: '54px', background: 'linear-gradient(135deg, #58CC02, #3DAD00)', color: '#FFFFFF', border: 'none', borderRadius: '16px', fontSize: '17px', fontFamily: 'Nunito, sans-serif', fontWeight: '800', cursor: 'pointer', boxShadow: '0 0 28px rgba(88,204,2,0.35)' }}
        >
          Voir mon espace parent
        </button>
      </div>
    )
  }

  // ─── ÉCRAN PRINCIPAL ──────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(109,40,217,0.18) 0%, #090E1A 55%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', maxWidth: '430px', margin: '0 auto' }}>

      <div style={{ width: '100px', height: '100px', marginBottom: '16px' }}>
        <Neuri3D color="#8B5CF6" />
      </div>

      <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '26px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 6px', textAlign: 'center' }}>
        Lier un compte enfant
      </h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.55)', margin: '0 0 28px', textAlign: 'center', lineHeight: 1.5 }}>
        Entrez le code de liaison fourni par votre enfant.
      </p>

      <div style={{ width: '100%', marginBottom: '16px' }}>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: '700', color: '#A78BFA', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px 4px' }}>Code enfant</p>
        <input
          type="text"
          placeholder="NEURI-1234"
          value={codeEnfant}
          onChange={handleChangeCode}
          autoFocus
          style={{
            width: '100%', height: '64px',
            background: 'rgba(139,92,246,0.06)',
            border: codeEnfant.length === 10 ? '1.5px solid rgba(139,92,246,0.55)' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px', padding: '0 20px',
            fontFamily: 'Nunito, sans-serif', fontSize: '22px', fontWeight: '800',
            color: '#FFFFFF', outline: 'none', boxSizing: 'border-box',
            textAlign: 'center', letterSpacing: '0.1em',
            boxShadow: codeEnfant.length === 10 ? '0 0 28px rgba(139,92,246,0.18)' : 'none',
            transition: 'all 0.2s ease',
          }}
        />
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '8px 0 0 4px', lineHeight: 1.4 }}>
          💡 Le code se trouve dans l'espace de votre enfant. Format : NEURI-XXXX
        </p>
      </div>

      {erreur && (
        <div style={{ width: '100%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '12px 16px', marginBottom: '14px' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#FCA5A5', margin: 0 }}>{erreur}</p>
        </div>
      )}

      <button
        onClick={handleLier}
        disabled={chargement || codeEnfant.length < 10}
        style={{
          width: '100%', height: '54px',
          background: (chargement || codeEnfant.length < 10) ? 'rgba(124,58,237,0.3)' : 'linear-gradient(135deg, #7C3AED, #6D28D9)',
          color: '#FFFFFF', border: 'none', borderRadius: '16px',
          fontSize: '17px', fontFamily: 'Nunito, sans-serif', fontWeight: '800',
          cursor: (chargement || codeEnfant.length < 10) ? 'not-allowed' : 'pointer',
          marginBottom: '14px',
          boxShadow: codeEnfant.length === 10 ? '0 0 28px rgba(124,58,237,0.35)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {chargement ? 'Liaison en cours...' : "Lier l'enfant"}
      </button>

      <p
        onClick={() => navigate('/parent-dashboard')}
        style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', textAlign: 'center', margin: 0 }}
      >
        Retour à mon espace
      </p>

    </div>
  )
}