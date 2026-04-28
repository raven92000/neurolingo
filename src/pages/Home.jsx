import { useNavigate } from 'react-router-dom'
import Neuri3D from '../components/Neuri3D'

function Home() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      background: '#111827',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Halo lumineux */}
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -60%)',
        pointerEvents: 'none',
      }}/>

      {/* Logo */}
      <p style={{
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '13px',
        fontWeight: '500',
        color: '#64748B',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        marginBottom: '16px',
      }}>
        NeuroLingo
      </p>

      {/* Neuri 3D */}
      <div style={{ width: '260px', height: '260px', marginBottom: '8px' }}>
        <Neuri3D color="#8B5CF6" />
      </div>

      {/* Tagline */}
      <h1 style={{
        fontFamily: 'Nunito, sans-serif',
        fontSize: '32px',
        fontWeight: '900',
        color: '#F9FAFB',
        textAlign: 'center',
        margin: '0 0 12px',
        lineHeight: '1.2',
        maxWidth: '320px',
      }}>
        Apprends à ton rythme
      </h1>

      <p style={{
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '16px',
        color: '#94A3B8',
        textAlign: 'center',
        margin: '0 0 40px',
        lineHeight: '1.6',
        maxWidth: '280px',
      }}>
        Une app pensée pour les cerveaux neuroatypiques
      </p>

      {/* Boutons */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        maxWidth: '320px',
      }}>
        <button
          onClick={() => navigate('/login')}
          style={{
            background: '#58CC02',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            padding: '18px',
            fontSize: '17px',
            fontFamily: 'Nunito, sans-serif',
            fontWeight: '800',
            cursor: 'pointer',
          }}>
          Commencer gratuitement
        </button>

        <button
  onClick={() => navigate('/login?mode=connexion')}
  style={{
    background: 'transparent',
    color: '#94A3B8',
    border: '1.5px solid #2D3748',
    borderRadius: '16px',
    padding: '18px',
    fontSize: '16px',
    fontFamily: 'Nunito, sans-serif',
    fontWeight: '700',
    cursor: 'pointer',
  }}>
  J'ai déjà un compte
</button>
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: '24px', marginTop: '40px' }}>
        {['TDAH', 'Dyslexie', 'Tout âge'].map(tag => (
          <span key={tag} style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '12px',
            color: '#4B5563',
            fontWeight: '500',
          }}>
            ✦ {tag}
          </span>
        ))}
      </div>

    </div>
  )
}

export default Home