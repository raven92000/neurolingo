import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Neuri3D from '../components/Neuri3D'
import BottomNav from '../components/BottomNav'

// ═══════════════════════════════════════════════════════════════════
// DONNÉES MOCKÉES
// ═══════════════════════════════════════════════════════════════════

const CHAPITRES = [
  { id: 'salutations', name: 'Salutations', status: 'complete' },
  { id: 'vetements', name: 'Vêtements', status: 'complete' },
  { id: 'animaux', name: 'Animaux', status: 'progress', progress: '3/5 leçons' },
  { id: 'objets', name: 'Objets', status: 'locked' },
  { id: 'couleurs', name: 'Couleurs', status: 'locked' }
]

const BONUS_ACTIFS = [
  { id: 'focus', icon: '🧠', name: 'Focus', boost: '+5%' },
  { id: 'vocab', icon: '📖', name: 'Vocab', boost: '+10%' },
  { id: 'streak', icon: '🔥', name: 'Streak', boost: '+5%' }
]

const CATEGORIES = [
  { id: 'vetements', label: 'Vêtements', icon: '👕' },
  { id: 'accessoires', label: 'Access.', icon: '👓' },
  { id: 'animaux', label: 'Animaux', icon: '🐾' },
  { id: 'objets', label: 'Objets', icon: '📦' }
]

const ITEMS = [
  { id: 'hoodie-violet', name: 'Hoodie Violet', category: 'vetements', subcategory: 'haut', priceXp: 250, requiredChapter: null, requiredXp: null, rarity: 'rare' },
  { id: 'tshirt-classique', name: 'T-shirt Classique', category: 'vetements', subcategory: 'haut', priceXp: 150, requiredChapter: null, requiredXp: null, rarity: 'commun' },
  { id: 'veste-street', name: 'Veste Street', category: 'vetements', subcategory: 'haut', priceXp: 500, requiredChapter: null, requiredXp: null, rarity: 'epique' },
  { id: 'casquette-neuri', name: 'Casquette Neuri', category: 'vetements', subcategory: 'chapeau', priceXp: 200, requiredChapter: null, requiredXp: null, rarity: 'commun' },
  { id: 'hoodie-vert', name: 'Hoodie Vert', category: 'vetements', subcategory: 'haut', priceXp: 250, requiredChapter: 'animaux', requiredXp: null, rarity: 'rare' },
  { id: 'veste-jaune', name: 'Veste Jaune', category: 'vetements', subcategory: 'haut', priceXp: 700, requiredChapter: null, requiredXp: 700, rarity: 'epique' },
  { id: 'pull-neuri', name: 'Pull Neuri', category: 'vetements', subcategory: 'haut', priceXp: 800, requiredChapter: 'objets', requiredXp: null, rarity: 'epique' },
  { id: 'tortue-verte', name: 'Tortue Verte', category: 'animaux', priceXp: 600, requiredChapter: null, requiredXp: null, rarity: 'rare' },
  { id: 'chat-roux', name: 'Chat Roux', category: 'animaux', priceXp: 800, requiredChapter: 'animaux', requiredXp: null, rarity: 'epique' },
  { id: 'lunettes-rondes', name: 'Lunettes rondes', category: 'accessoires', subcategory: 'lunettes', priceXp: 300, requiredChapter: null, requiredXp: null, rarity: 'commun' },
  { id: 'sac-violet', name: 'Sac à dos violet', category: 'accessoires', subcategory: 'sac', priceXp: 400, requiredChapter: null, requiredXp: null, rarity: 'rare' },
  { id: 'livre-magique', name: 'Livre magique', category: 'objets', priceXp: 500, requiredChapter: 'objets', requiredXp: null, rarity: 'rare' }
]

const RARETE_COLORS = {
  commun: '#55D600',
  rare: '#8B5CF6',
  epique: '#F59E0B',
  legendaire: '#EC4899'
}

// ═══════════════════════════════════════════════════════════════════
// CARTE D'ITEM (pour le carrousel)
// ═══════════════════════════════════════════════════════════════════

function ItemCard({ item, isOwned, isEquipped, canBuy, lockReason, onBuy, onEquip }) {
  const rareteColor = RARETE_COLORS[item.rarity]
  const locked = !!lockReason

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: 8,
      width: 110, minWidth: 110, flexShrink: 0,
      opacity: locked ? 0.6 : 1,
      scrollSnapAlign: 'start'
    }}>
      <div style={{
        width: '100%', aspectRatio: '1', borderRadius: 10,
        background: locked
          ? 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))'
          : 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))',
        marginBottom: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {locked ? (
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <rect x="9" y="14" width="14" height="12" rx="2" fill="rgba(255,255,255,0.3)"/>
            <path d="M12 14 L12 10 C12 8 13.5 6 16 6 C18.5 6 20 8 20 10 L20 14" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none"/>
          </svg>
        ) : (
          <span style={{ fontSize: 28, opacity: 0.4 }}>👕</span>
        )}
      </div>

      <p style={{ fontSize: 11, fontWeight: 700, color: '#FFFFFF', margin: '0 0 3px', textAlign: 'center', lineHeight: 1.2 }}>
        {item.name}
      </p>
      <p style={{ fontSize: 9, color: rareteColor, margin: '0 0 6px', textAlign: 'center', fontWeight: 600, textTransform: 'capitalize' }}>
        {item.rarity}
      </p>

      {locked ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '3px 0' }}>
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
            <rect x="3" y="6" width="6" height="5" rx="1" fill="rgba(255,255,255,0.5)"/>
            <path d="M4.5 6 L4.5 4 C4.5 3 5 2 6 2 C7 2 7.5 3 7.5 4 L7.5 6" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" fill="none"/>
          </svg>
          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)' }}>{lockReason}</span>
        </div>
      ) : (
        <>
          {!isOwned && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginBottom: 5 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 6, fontWeight: 800, color: '#FFFFFF' }}>XP</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#FFFFFF' }}>{item.priceXp}</span>
            </div>
          )}

          {isEquipped ? (
            <button disabled style={{
              width: '100%', height: 26, borderRadius: 7, border: 'none',
              background: 'rgba(85,214,0,0.15)', color: '#55D600',
              fontSize: 10, fontWeight: 700, cursor: 'default'
            }}>
              ✓ Équipé
            </button>
          ) : isOwned ? (
            <button onClick={() => onEquip(item)} style={{
              width: '100%', height: 26, borderRadius: 7, border: '1px solid #8B5CF6',
              background: 'transparent', color: '#8B5CF6',
              fontSize: 10, fontWeight: 700, cursor: 'pointer'
            }}>
              Équiper
            </button>
          ) : (
            <button
              onClick={() => onBuy(item)}
              disabled={!canBuy}
              style={{
                width: '100%', height: 26, borderRadius: 7, border: 'none',
                background: canBuy ? '#8B5CF6' : 'rgba(255,255,255,0.06)',
                color: canBuy ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                fontSize: 10, fontWeight: 700, cursor: canBuy ? 'pointer' : 'not-allowed'
              }}
            >
              {canBuy ? 'Acheter' : 'XP insuf.'}
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

export default function Shop() {
  const navigate = useNavigate()
  const [chargement, setChargement] = useState(true)
  const [profil, setProfil] = useState(null)
  const [categorieActive, setCategorieActive] = useState('vetements')

  const [inventaire, setInventaire] = useState({
    possedes: ['casquette-neuri'],
    equipes: {
      chapeau: 'casquette-neuri',
      haut: null,
      lunettes: null,
      compagnonObjet: null
    }
  })

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login'); return }
      const { data } = await supabase.from('profils').select('*').eq('user_id', user.id).single()
      setProfil(data)
      setChargement(false)
    }
    charger()
  }, [])

  const xpTotal = profil?.xp || 0

  const getLockReason = (item) => {
    if (item.requiredChapter) {
      const chap = CHAPITRES.find(c => c.id === item.requiredChapter)
      if (chap?.status !== 'complete') return `Chap. ${chap?.name || ''} requis`
    }
    if (item.requiredXp && xpTotal < item.requiredXp) return `${item.requiredXp} XP requis`
    return null
  }

  const canBuy = (item) => xpTotal >= item.priceXp

  const handleBuy = (item) => {
    setInventaire(inv => ({ ...inv, possedes: [...inv.possedes, item.id] }))
  }

  const handleEquip = (item) => {
    const slotKey = item.subcategory || (item.category === 'animaux' || item.category === 'objets' ? 'compagnonObjet' : item.category)
    setInventaire(inv => ({ ...inv, equipes: { ...inv.equipes, [slotKey]: item.id } }))
  }

  const itemsAffiches = ITEMS.filter(item => item.category === categorieActive)

  if (chargement) {
    return (
      <div style={{ minHeight: '100vh', background: '#080D18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(139,92,246,0.2)', borderTop: '3px solid #8B5CF6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}/>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#080D18',
      maxWidth: 430, margin: '0 auto', paddingBottom: 90,
      fontFamily: "'DM Sans', sans-serif"
    }}>

      {/* ═══ HEADER ═══ */}
      <div style={{ padding: '52px 16px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#FFFFFF', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
            🛍️ Boutique Neuri <span style={{ fontSize: 16 }}>✨</span>
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.4 }}>
            Gagne de l'XP, débloque des objets et personnalise ton Neuri.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: '6px 12px', flexShrink: 0, alignSelf: 'flex-start' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#FFFFFF' }}>XP</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>{xpTotal.toLocaleString('fr')}</span>
        </div>
      </div>

      {/* ═══ ZONE 3 COLONNES : CHAPITRES | NEURI | BONUS ═══ */}
      <div style={{
        padding: '0 10px 12px',
        display: 'grid',
        gridTemplateColumns: '1fr 1.3fr 1fr',
        gap: 6,
        alignItems: 'stretch'
      }}>

        {/* COLONNE GAUCHE : CHAPITRES */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: 10
        }}>
          <h3 style={{ fontSize: 11, fontWeight: 800, color: '#FFFFFF', margin: '0 0 10px', textAlign: 'center' }}>
            Chapitres
          </h3>
          {CHAPITRES.map((chap, i) => {
            const colors = {
              complete: { bg: 'rgba(85,214,0,0.2)', border: '#55D600', text: '#55D600' },
              progress: { bg: 'rgba(139,92,246,0.2)', border: '#8B5CF6', text: '#8B5CF6' },
              locked: { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.15)', text: 'rgba(255,255,255,0.4)' }
            }
            const c = colors[chap.status]
            const isLast = i === CHAPITRES.length - 1

            return (
              <div key={chap.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: isLast ? 0 : 8, position: 'relative' }}>
                {!isLast && (
                  <div style={{
                    position: 'absolute', left: 9, top: 20, bottom: -8, width: 1.5,
                    background: chap.status === 'locked' ? 'rgba(255,255,255,0.08)' : 'rgba(139,92,246,0.3)'
                  }}/>
                )}
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: c.bg, border: `1.5px solid ${c.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, zIndex: 1
                }}>
                  {chap.status === 'complete' && (
                    <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7 L6 10 L11 4" stroke={c.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {chap.status === 'progress' && <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.text }}/>}
                  {chap.status === 'locked' && (
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                      <rect x="3" y="6" width="6" height="5" rx="1" fill={c.text}/>
                      <path d="M4.5 6 L4.5 4 C4.5 3 5 2 6 2 C7 2 7.5 3 7.5 4 L7.5 6" stroke={c.text} strokeWidth="1.2" fill="none"/>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#FFFFFF', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {chap.name}
                  </p>
                  <p style={{ fontSize: 8, color: c.text, margin: '1px 0 0', fontWeight: 500 }}>
                    {chap.status === 'complete' && 'Complété'}
                    {chap.status === 'progress' && chap.progress}
                    {chap.status === 'locked' && 'Verrouillé'}
                  </p>
                </div>
              </div>
            )
          })}
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', margin: '10px 0 0', lineHeight: 1.3, textAlign: 'center', fontStyle: 'italic' }}>
            Termine les leçons pour débloquer de nouveaux objets !
          </p>
        </div>

        {/* COLONNE CENTRE : NEURI */}
        <div style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.25) 0%, transparent 70%)',
          borderRadius: 14,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: 250
        }}>
          <div style={{ width: '100%', height: 250 }}>
            <Neuri3D color="#8B5CF6" />
          </div>
        </div>

        {/* COLONNE DROITE : BONUS */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: 10
        }}>
          <h3 style={{ fontSize: 11, fontWeight: 800, color: '#FFFFFF', margin: '0 0 10px', textAlign: 'center' }}>
            Bonus actifs
          </h3>
          {BONUS_ACTIFS.map((bonus, i) => (
            <div key={bonus.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 6px', marginBottom: i === BONUS_ACTIFS.length - 1 ? 0 : 6,
              background: 'rgba(255,255,255,0.03)', borderRadius: 8
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                <span style={{ fontSize: 14 }}>{bonus.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {bonus.name}
                </span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#55D600', flexShrink: 0 }}>{bonus.boost}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ SLOTS ÉQUIPÉS (4 slots) ═══ */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: 10
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)', margin: '0 0 8px', textAlign: 'center', letterSpacing: '0.05em' }}>
            ÉQUIPÉ
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { key: 'chapeau', icon: '🧢' },
              { key: 'haut', icon: '👕' },
              { key: 'lunettes', icon: '👓' },
              { key: 'compagnonObjet', icon: '🎒' }
            ].map(slot => {
              const equipped = inventaire.equipes[slot.key]
              return (
                <div key={slot.key} style={{
                  aspectRatio: '1',
                  background: 'rgba(255,255,255,0.04)',
                  border: equipped ? '1.5px solid #8B5CF6' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, opacity: equipped ? 1 : 0.3
                }}>
                  {slot.icon}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ═══ ONGLETS CATÉGORIES ═══ */}
      <div style={{
        padding: '0 16px 12px',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6
      }}>
        {CATEGORIES.map(cat => {
          const active = categorieActive === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setCategorieActive(cat.id)}
              style={{
                background: active ? '#8B5CF6' : 'rgba(255,255,255,0.04)',
                border: active ? 'none' : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10, padding: '8px 4px',
                color: active ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2
              }}
            >
              <span style={{ fontSize: 14 }}>{cat.icon}</span>
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* ═══ CARROUSEL HORIZONTAL ═══ */}
      <div style={{ padding: '0 16px' }}>
        <div
          className="hide-scrollbar"
          style={{
            display: 'flex', gap: 10,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 12
          }}
        >
          {itemsAffiches.length === 0 ? (
            <p style={{ width: '100%', textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: 20 }}>
              Aucun item dans cette catégorie.
            </p>
          ) : (
            itemsAffiches.map(item => {
              const isOwned = inventaire.possedes.includes(item.id)
              const slotKey = item.subcategory || (item.category === 'animaux' || item.category === 'objets' ? 'compagnonObjet' : item.category)
              const isEquipped = inventaire.equipes[slotKey] === item.id
              const lockReason = getLockReason(item)
              return (
                <ItemCard
                  key={item.id}
                  item={item}
                  isOwned={isOwned}
                  isEquipped={isEquipped}
                  canBuy={canBuy(item)}
                  lockReason={lockReason}
                  onBuy={handleBuy}
                  onEquip={handleEquip}
                />
              )
            })
          )}
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <BottomNav />
    </div>
  )
}