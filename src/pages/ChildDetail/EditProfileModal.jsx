import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import EditProfileForm from './EditProfileForm'
import ConfirmDiscardChanges from './ConfirmDiscardChanges'
import { PROFIL_IDS, NEURI_IDS } from './editProfileOptions'

// Duplication locale assumée : ParentCreateChild.jsx est hors-périmètre.
// À factoriser dans src/utils/age.js lors d'un futur sprint dédié.
function calculateAgeYears(birthDateString) {
  const birthDate = new Date(birthDateString)
  if (Number.isNaN(birthDate.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  const dayDiff = today.getDate() - birthDate.getDate()
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1
  return age
}

export default function EditProfileModal({ isOpen, onClose, enfant, onSuccess }) {
  const [valeursInitiales, setValeursInitiales] = useState(null)
  const [prenom, setPrenom] = useState('')
  const [dateNaissance, setDateNaissance] = useState('')
  const [profilType, setProfilType] = useState('tdah')
  const [neuriVersion, setNeuriVersion] = useState('enfant')
  const [erreurs, setErreurs] = useState({})
  const [confirmFermeture, setConfirmFermeture] = useState(false)
  const [enregistrement, setEnregistrement] = useState(false)

  // À l'ouverture, on pré-remplit les champs avec les valeurs actuelles de l'enfant.
  // Le setState synchrone dans l'effet est volontaire ici : c'est le pattern standard
  // pour "réinitialiser un formulaire local quand une modale s'ouvre".
  useEffect(() => {
    if (!isOpen || !enfant) return
    const initiales = {
      prenom: enfant.nom || '',
      dateNaissance: enfant.date_naissance || '',
      profilType: PROFIL_IDS.includes(enfant.profil_type) ? enfant.profil_type : 'tdah',
      neuriVersion: NEURI_IDS.includes(enfant.neuri_version) ? enfant.neuri_version : 'enfant',
    }
    /* eslint-disable react-hooks/set-state-in-effect */
    setValeursInitiales(initiales)
    setPrenom(initiales.prenom)
    setDateNaissance(initiales.dateNaissance)
    setProfilType(initiales.profilType)
    setNeuriVersion(initiales.neuriVersion)
    setErreurs({})
    setConfirmFermeture(false)
    setEnregistrement(false)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [isOpen, enfant])

  if (!isOpen) return null

  function aDesModifsNonSauvees() {
    if (!valeursInitiales) return false
    return (
      prenom.trim() !== valeursInitiales.prenom.trim() ||
      dateNaissance !== valeursInitiales.dateNaissance ||
      profilType !== valeursInitiales.profilType ||
      neuriVersion !== valeursInitiales.neuriVersion
    )
  }

  function handleClose() {
    if (enregistrement) return
    if (aDesModifsNonSauvees()) {
      setConfirmFermeture(true)
    } else {
      onClose()
    }
  }

  function quitterSansEnregistrer() {
    setConfirmFermeture(false)
    onClose()
  }

  async function validerEtSauvegarder() {
    const nouvellesErreurs = {}

    if (!prenom.trim()) {
      nouvellesErreurs.prenom = 'Le prénom est obligatoire.'
    }

    if (!dateNaissance) {
      nouvellesErreurs.dateNaissance = 'La date de naissance est obligatoire.'
    } else {
      const birth = new Date(dateNaissance)
      if (Number.isNaN(birth.getTime())) {
        nouvellesErreurs.dateNaissance = 'Date invalide.'
      } else if (birth > new Date()) {
        nouvellesErreurs.dateNaissance = 'La date ne peut pas être dans le futur.'
      } else {
        const age = calculateAgeYears(dateNaissance)
        if (age === null) {
          nouvellesErreurs.dateNaissance = 'Date invalide.'
        } else if (age >= 18) {
          nouvellesErreurs.dateNaissance = "L'enfant doit avoir moins de 18 ans."
        }
      }
    }

    if (!PROFIL_IDS.includes(profilType)) {
      nouvellesErreurs.profilType = 'Profil cognitif invalide.'
    }

    if (!NEURI_IDS.includes(neuriVersion)) {
      nouvellesErreurs.neuriVersion = 'Version de Neuri invalide.'
    }

    if (Object.keys(nouvellesErreurs).length > 0) {
      setErreurs(nouvellesErreurs)
      return
    }

    setErreurs({})
    setEnregistrement(true)
    try {
      const { error } = await supabase
        .from('profils')
        .update({
          nom: prenom.trim(),
          date_naissance: dateNaissance,
          profil_type: profilType,
          neuri_version: neuriVersion,
        })
        .eq('user_id', enfant.user_id)

      if (error) {
        console.error('Erreur UPDATE profil enfant', error)
        setErreurs({ global: 'Erreur lors de la sauvegarde, réessayez.' })
        return
      }

      onSuccess()
    } finally {
      setEnregistrement(false)
    }
  }

  const prenomAffiche = valeursInitiales?.prenom || enfant?.nom || 'Ton enfant'
  const peutEnregistrer = aDesModifsNonSauvees() && !enregistrement

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%', maxWidth: '400px', maxHeight: '85vh',
          background: '#0F1424',
          border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: '24px',
          boxShadow: '0 0 40px rgba(124,58,237,0.25)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 24px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '18px', fontWeight: '900', color: '#FFFFFF', margin: 0, lineHeight: 1.3 }}>
            Modifier le profil de {prenomAffiche}
          </h2>
          <button
            onClick={handleClose}
            disabled={enregistrement}
            aria-label="Fermer"
            style={{
              background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.6)', fontSize: '22px',
              cursor: enregistrement ? 'not-allowed' : 'pointer',
              padding: '4px 8px', marginLeft: '12px',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '20px 24px 24px', overflowY: 'auto', flex: 1 }}>
          <EditProfileForm
            prenom={prenom} setPrenom={setPrenom}
            dateNaissance={dateNaissance} setDateNaissance={setDateNaissance}
            profilType={profilType} setProfilType={setProfilType}
            neuriVersion={neuriVersion} setNeuriVersion={setNeuriVersion}
            erreurs={erreurs}
          />
        </div>

        <div style={{ padding: '12px 24px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={validerEtSauvegarder}
            disabled={!peutEnregistrer}
            style={{
              width: '100%', height: '52px',
              background: peutEnregistrer ? 'linear-gradient(135deg, #7C3AED, #6D28D9)' : 'rgba(124,58,237,0.25)',
              color: '#FFFFFF', border: 'none', borderRadius: '14px',
              fontFamily: 'Nunito, sans-serif', fontSize: '16px', fontWeight: '800',
              cursor: peutEnregistrer ? 'pointer' : 'not-allowed',
              boxShadow: peutEnregistrer ? '0 0 24px rgba(124,58,237,0.35)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>

        {confirmFermeture && (
          <ConfirmDiscardChanges
            onAnnuler={() => setConfirmFermeture(false)}
            onQuitter={quitterSansEnregistrer}
          />
        )}
      </div>
    </div>
  )
}
