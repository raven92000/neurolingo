import { PROFIL_OPTIONS, NEURI_OPTIONS } from './editProfileOptions'

const labelStyle = {
  fontFamily: 'DM Sans, sans-serif',
  fontSize: '11px',
  fontWeight: '700',
  color: '#A78BFA',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  margin: '0 0 8px 4px',
}

const inputStyle = {
  width: '100%', height: '52px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '14px', padding: '0 18px',
  fontFamily: 'DM Sans, sans-serif', fontSize: '15px',
  color: '#FFFFFF', outline: 'none', boxSizing: 'border-box',
}

const erreurChampStyle = {
  fontFamily: 'DM Sans, sans-serif',
  fontSize: '12px',
  color: '#FCA5A5',
  margin: '6px 0 0 4px',
}

export default function EditProfileForm({
  prenom, setPrenom,
  dateNaissance, setDateNaissance,
  profilType, setProfilType,
  neuriVersion, setNeuriVersion,
  erreurs,
}) {
  return (
    <>
      {/* Prénom */}
      <div style={{ marginBottom: '16px' }}>
        <p style={labelStyle}>Prénom</p>
        <input
          type="text"
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          style={inputStyle}
          placeholder="Prénom de l'enfant"
        />
        {erreurs.prenom && <p style={erreurChampStyle}>{erreurs.prenom}</p>}
      </div>

      {/* Date de naissance */}
      <div style={{ marginBottom: '16px' }}>
        <p style={labelStyle}>Date de naissance</p>
        <input
          type="date"
          value={dateNaissance}
          onChange={(e) => setDateNaissance(e.target.value)}
          style={inputStyle}
        />
        {erreurs.dateNaissance && <p style={erreurChampStyle}>{erreurs.dateNaissance}</p>}
      </div>

      {/* Profil cognitif */}
      <div style={{ marginBottom: '16px' }}>
        <p style={labelStyle}>Profil cognitif</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          {PROFIL_OPTIONS.map(p => {
            const actif = profilType === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setProfilType(p.id)}
                style={{
                  flex: 1,
                  background: actif ? p.colorBg : 'rgba(255,255,255,0.04)',
                  border: actif ? `1.5px solid ${p.colorBorder}` : '1.5px solid rgba(255,255,255,0.07)',
                  borderRadius: '14px',
                  padding: '14px 10px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                }}
              >
                <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '15px', fontWeight: '800', color: actif ? p.color : 'rgba(255,255,255,0.5)', margin: '0 0 4px' }}>
                  {p.label}
                </p>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: actif ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)', margin: 0, lineHeight: 1.4 }}>
                  {p.desc}
                </p>
              </button>
            )
          })}
        </div>
        {erreurs.profilType && <p style={erreurChampStyle}>{erreurs.profilType}</p>}
      </div>

      {/* Version de Neuri */}
      <div style={{ marginBottom: '8px' }}>
        <p style={labelStyle}>Version de Neuri</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {NEURI_OPTIONS.map(n => {
            const actif = neuriVersion === n.id
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => setNeuriVersion(n.id)}
                style={{
                  background: actif ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
                  border: actif ? '1.5px solid rgba(139,92,246,0.5)' : '1.5px solid rgba(255,255,255,0.07)',
                  borderRadius: '14px',
                  padding: '12px',
                  cursor: 'pointer',
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '14px',
                  fontWeight: '800',
                  color: actif ? '#A78BFA' : 'rgba(255,255,255,0.6)',
                  transition: 'all 0.2s ease',
                }}
              >
                {n.label}
              </button>
            )
          })}
        </div>
        {erreurs.neuriVersion && <p style={erreurChampStyle}>{erreurs.neuriVersion}</p>}
      </div>

      {/* Erreur globale */}
      {erreurs.global && (
        <div style={{ background: 'rgba(252,165,165,0.08)', border: '1px solid rgba(252,165,165,0.25)', borderRadius: '12px', padding: '10px 12px', marginTop: '16px' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#FCA5A5', margin: 0 }}>{erreurs.global}</p>
        </div>
      )}
    </>
  )
}
