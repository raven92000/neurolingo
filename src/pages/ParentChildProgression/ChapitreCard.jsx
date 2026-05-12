import { useState } from 'react'
import LeconRow from './LeconRow'

export default function ChapitreCard({ chapitre }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const { numero, niveau, titre, lecons, nbTotal, nbTerminees, pourcentage } = chapitre
  const estComplet = nbTotal > 0 && pourcentage === 100

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${estComplet ? 'rgba(88,204,2,0.25)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: '20px',
      overflow: 'hidden',
      transition: 'border-color 0.2s ease',
    }}>
      <button
        onClick={() => setIsExpanded(v => !v)}
        aria-expanded={isExpanded}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: '18px',
          textAlign: 'left',
          cursor: 'pointer',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* Ligne 1 : titre + badge ✅ + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontFamily: 'Nunito, sans-serif',
            fontSize: '11px',
            fontWeight: 800,
            color: '#A78BFA',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            Chapitre {numero}{niveau != null ? ` · Niveau ${niveau}` : ''}
          </span>

          {estComplet && (
            <span style={{
              background: 'rgba(88,204,2,0.15)',
              border: '1px solid rgba(88,204,2,0.35)',
              borderRadius: '999px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 800,
              color: '#86EFAC',
            }}>
              ✅ Terminé
            </span>
          )}

          <span style={{
            marginLeft: 'auto',
            color: 'rgba(255,255,255,0.35)',
            fontSize: '20px',
            transition: 'transform 0.2s ease',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            lineHeight: 1,
          }}>
            ›
          </span>
        </div>

        {/* Ligne 2 : titre chapitre */}
        <p style={{
          fontFamily: 'Nunito, sans-serif',
          fontSize: '16px',
          fontWeight: 800,
          color: '#FFFFFF',
          margin: 0,
          lineHeight: 1.3,
        }}>
          {titre || `Chapitre ${numero}`}
        </p>

        {/* Ligne 3 : compteur leçons */}
        <p style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '13px',
          color: 'rgba(255,255,255,0.55)',
          margin: 0,
        }}>
          {nbTerminees}/{nbTotal} leçon{nbTotal > 1 ? 's' : ''}
        </p>

        {/* Ligne 4 : barre de progression + pourcentage */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            flex: 1,
            height: '8px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '999px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${pourcentage}%`,
              height: '100%',
              background: estComplet
                ? 'linear-gradient(90deg, #58CC02 0%, #3DAD00 100%)'
                : 'linear-gradient(90deg, #8B5CF6 0%, #6D28D9 100%)',
              borderRadius: '999px',
              transition: 'width 0.5s ease',
            }} />
          </div>
          <span style={{
            fontFamily: 'Nunito, sans-serif',
            fontSize: '14px',
            fontWeight: 800,
            color: estComplet ? '#86EFAC' : '#A78BFA',
            minWidth: '44px',
            textAlign: 'right',
          }}>
            {pourcentage}%
          </span>
        </div>
      </button>

      {/* Liste des leçons (expand) */}
      {isExpanded && (
        <div style={{
          padding: '0 18px 14px',
        }}>
          {lecons.length === 0 ? (
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.4)',
              margin: '8px 0 0',
              fontStyle: 'italic',
            }}>
              Aucune leçon dans ce chapitre pour le moment.
            </p>
          ) : (
            <div>
              {lecons.map(l => (
                <LeconRow key={l.id} lecon={l} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
