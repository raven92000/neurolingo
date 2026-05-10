import Neuri2D from '../../components/Neuri2D'
import { getVersionFromDate } from '../../utils/neuriUtils'

const DRAPEAUX = { en: '🇬🇧', es: '🇪🇸', de: '🇩🇪', pt: '🇵🇹' }
const NOMS_LANGUES = { en: 'Anglais', es: 'Espagnol', de: 'Allemand', pt: 'Portugais' }

const LIBELLE_PROFIL = {
  tdah: 'TDAH',
  dyslexie: 'Dyslexie',
}

export default function ChildDetailHero({ enfant, messageEmotionnel }) {
  const versionNeuri = enfant?.neuri_version || getVersionFromDate(enfant?.date_naissance)
  const prenom = enfant?.nom?.split(' ')[0] || 'Ton enfant'

  const codeLangue = enfant?.langues?.code || enfant?.langue_id
  const drapeau = enfant?.langues?.emoji || DRAPEAUX[codeLangue] || '🌍'
  const nomLangue = enfant?.langues?.nom || NOMS_LANGUES[codeLangue] || 'Langue à définir'

  const profilType = enfant?.profil_type
  const libelleProfil = profilType ? (LIBELLE_PROFIL[profilType] || profilType.toUpperCase()) : null

  const streak = enfant?.streak || 0

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(88, 49, 196, 0.35), rgba(16, 18, 40, 0.95))',
      border: '1px solid rgba(138, 92, 255, 0.25)',
      borderRadius: '24px',
      padding: '24px 20px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 0 40px rgba(138,92,255,0.12)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: '12px',
    }}>
      <Neuri2D
        version={versionNeuri}
        angle="face"
        equipes={{ chapeau: null, haut: null, lunettes: null, compagnonObjet: null }}
        size={120}
      />

      <h2 style={{
        fontFamily: 'Nunito, sans-serif',
        fontSize: '30px',
        fontWeight: '900',
        color: '#FFFFFF',
        margin: 0,
        lineHeight: 1.1,
      }}>
        {prenom}
      </h2>

      {libelleProfil && (
        <div style={{
          display: 'inline-block',
          background: 'rgba(167,139,250,0.15)',
          border: '1px solid rgba(167,139,250,0.3)',
          borderRadius: '999px',
          padding: '4px 12px',
        }}>
          <span style={{
            fontFamily: 'Nunito, sans-serif',
            fontSize: '12px',
            fontWeight: '800',
            color: '#A78BFA',
            letterSpacing: '0.04em',
          }}>
            {libelleProfil}
          </span>
        </div>
      )}

      {codeLangue && (
        <p style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          color: 'rgba(255,255,255,0.75)',
          margin: 0,
        }}>
          {drapeau} {nomLangue} en apprentissage
        </p>
      )}

      {streak > 0 && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(245,158,11,0.12)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: '999px',
          padding: '5px 12px',
        }}>
          <span style={{ fontSize: '14px' }}>🔥</span>
          <span style={{
            fontFamily: 'Nunito, sans-serif',
            fontSize: '13px',
            fontWeight: '800',
            color: '#FCD34D',
          }}>
            {streak} jour{streak > 1 ? 's' : ''} d'apprentissage
          </span>
        </div>
      )}

      <p style={{
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '14px',
        color: 'rgba(255,255,255,0.85)',
        margin: '4px 0 0',
        lineHeight: 1.45,
        maxWidth: '320px',
      }}>
        {messageEmotionnel}
      </p>
    </div>
  )
}
