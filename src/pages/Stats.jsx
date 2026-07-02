import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Neuri2D from '../components/Neuri2D'
import { useProfil } from '../context/ProfilContext'
import { useContenu } from '../context/ContenuContext'
import { useProgression } from '../context/ProgressionContext'
import BottomNav from '../components/BottomNav'
import Skeleton from '../components/Skeleton'
import { getVersionFromDate } from '../utils/neuriUtils'
import './Stats.css'

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const NIVEAUX_CONFIG = [
  { numero: 1, nom: 'Découverte', chapitresNumeros: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
  { numero: 2, nom: 'Les Bases', chapitresNumeros: [9] },
  { numero: 3, nom: 'Le Quotidien', chapitresNumeros: [10] },
  { numero: 4, nom: "L'Autonomie", chapitresNumeros: [11] },
]

function calculerNiveauActuel(chapitres, lecons, progressions) {
  const idsCompletes = new Set((progressions || []).filter(p => p.partie_completee === 2).map(p => p.lecon_id))
  let niveauActuel = NIVEAUX_CONFIG[0]
  let progressionCourante = { fait: 0, total: 0 }

  for (const niv of NIVEAUX_CONFIG) {
    const chapsIds = (chapitres || []).filter(c => niv.chapitresNumeros.includes(c.numero)).map(c => c.id)
    const lecsLevel = (lecons || []).filter(l => chapsIds.includes(l.chapitre_id))
    if (lecsLevel.length === 0) continue
    const fait = lecsLevel.filter(l => idsCompletes.has(l.id)).length
    const total = lecsLevel.length
    niveauActuel = niv
    progressionCourante = { fait, total }
    if (fait < total) break
  }
  return { niveau: niveauActuel, progression: progressionCourante }
}

function calculerXPParJour(progressions, motsParLecon) {
  const aujourdhui = new Date()
  const jours = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(aujourdhui)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    const dateStr = date.toISOString().split('T')[0]
    const xpJour = (progressions || []).reduce((acc, p) => {
      if (!p.completee_le) return acc
      const datePr = new Date(p.completee_le).toISOString().split('T')[0]
      if (datePr === dateStr) {
        const nbMots = motsParLecon[p.lecon_id] || 5
        return acc + (nbMots * 10)
      }
      return acc
    }, 0)
    jours.push({
      date: dateStr,
      label: date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''),
      xp: xpJour,
    })
  }
  return jours
}

function calculerStreak(progressions) {
  if (!progressions || progressions.length === 0) return 0
  const datesUniques = [...new Set(progressions.filter(p => p.completee_le).map(p => new Date(p.completee_le).toISOString().split('T')[0]))].sort().reverse()
  if (datesUniques.length === 0) return 0

  const aujourdhui = new Date().toISOString().split('T')[0]
  const hier = new Date()
  hier.setDate(hier.getDate() - 1)
  const hierStr = hier.toISOString().split('T')[0]

  if (datesUniques[0] !== aujourdhui && datesUniques[0] !== hierStr) return 0

  let streak = 1
  for (let i = 0; i < datesUniques.length - 1; i++) {
    const d1 = new Date(datesUniques[i])
    const d2 = new Date(datesUniques[i + 1])
    const diff = Math.round((d1 - d2) / (1000 * 60 * 60 * 24))
    if (diff === 1) streak++
    else break
  }
  return streak
}

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function Stats() {
  const navigate = useNavigate()
  const { user, profil, chargementProfil, refreshProfil } = useProfil()
  const { chargerLeconsToutes } = useContenu()
  const { progression, refreshProgression } = useProgression()
  const [leconsToutes, setLeconsToutes] = useState(null) // null = pas encore chargées

  // Redirige si non connecté ; rafraîchit le profil (XP) en arrière-plan
  useEffect(() => {
    if (!chargementProfil && !user) navigate('/login')
  }, [chargementProfil, user, navigate])
  useEffect(() => { refreshProfil() }, [refreshProfil])

  // Leçons (en cache après la 1re fois) + revalidation de la progression en
  // arrière-plan (« affiche tout de suite, rafraîchis en arrière-plan »).
  useEffect(() => {
    if (!profil?.user_id) return
    let actif = true
    ;(async () => {
      const lecs = await chargerLeconsToutes()
      if (!actif) return
      setLeconsToutes(lecs)
    })()
    refreshProgression()
    return () => { actif = false }
  }, [profil?.user_id])

  // Stats dérivées — recalculées quand la progression est revalidée en arrière-plan.
  // chapitres = [] : la requête d'origine (langue_id code vs colonne UUID) renvoie
  // TOUJOURS vide (12/12 enfants ont un code) → on préserve exactement ce comportement
  // (niveau figé) sans faire un aller-retour réseau inutile. Quirk laissé tel quel.
  const { xpParJour, streak, niveauData } = useMemo(() => {
    if (leconsToutes === null || progression === null) {
      return { xpParJour: [], streak: 0, niveauData: { niveau: NIVEAUX_CONFIG[0], progression: { fait: 0, total: 0 } } }
    }
    const motsParLecon = (leconsToutes || []).reduce((acc, l) => ({ ...acc, [l.id]: l.nombre_mots }), {})
    return {
      xpParJour: calculerXPParJour(progression, motsParLecon),
      streak: calculerStreak(progression),
      niveauData: calculerNiveauActuel([], leconsToutes, progression),
    }
  }, [leconsToutes, progression])

  // Squelette seulement s'il n'y a encore RIEN à montrer. En navigation répétée
  // (leçons en cache + dernière progression connue), on affiche directement.
  if ((chargementProfil && !profil) || leconsToutes === null || progression === null) {
    return (
      <div style={{ minHeight: '100vh', background: '#090E1A', paddingBottom: '100px', maxWidth: '430px', margin: '0 auto' }}>
        <div style={{ padding: '52px 24px 16px' }}>
          <Skeleton width={160} height={28} />
          <div style={{ height: 8 }} />
          <Skeleton width={220} height={16} />
        </div>
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Skeleton height={150} radius={20} />
          <Skeleton height={120} radius={20} />
          <Skeleton height={90} radius={16} />
        </div>
        <BottomNav />
      </div>
    )
  }

  const xpMax = Math.max(...xpParJour.map(j => j.xp), 60)
  const objectifXP = (profil?.objectif_minutes || 10) * 6

  // Calcul XP du niveau actuel (300 XP par niveau)
  const xpParNiveau = 300
  const xpActuel = (profil?.xp || 0) % xpParNiveau
  const xpRestant = xpParNiveau - xpActuel
  const pourcentageNiveau = (xpActuel / xpParNiveau) * 100

  // Message motivant adapté
  const messageMotivant =
    xpActuel === 0
      ? `C'est parti ! Atteins ${xpParNiveau} XP pour passer au Niveau ${niveauData.niveau.numero + 1}.`
      : pourcentageNiveau < 30
      ? "Bon démarrage ! Continue comme ça."
      : pourcentageNiveau < 70
      ? "Super ! Chaque jour te rapproche de tes objectifs."
      : `Bientôt le Niveau ${niveauData.niveau.numero + 1} ! Encore un effort 🔥`

  return (
    <div style={{ minHeight: '100vh', background: '#090E1A', paddingBottom: '100px', maxWidth: '430px', margin: '0 auto' }}>

      <div style={{ padding: '52px 24px 16px' }}>
        <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '28px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 4px' }}>Progression</h1>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Ta progression cette semaine</p>
      </div>

      {/* HERO PROGRESSION - Premium Card */}
      <section className="hero-progress">
        {/* Glow violet derrière Neuri */}
        <div className="hero-progress__glow" aria-hidden="true" />

        {/* Particules lumineuses */}
        <span className="hero-progress__sparkle hero-progress__sparkle--1" aria-hidden="true">✦</span>
        <span className="hero-progress__sparkle hero-progress__sparkle--2" aria-hidden="true">✦</span>
        <span className="hero-progress__sparkle hero-progress__sparkle--3" aria-hidden="true">✦</span>

        {/* Overlay de fondu */}
        <div className="hero-progress__overlay" aria-hidden="true" />

        <div className="hero-progress__content">
          {/* TEXTE */}
          <div className="hero-progress__text">
            <p className="hero-progress__label">Niveau actuel</p>
            <h2 className="hero-progress__title">Niveau {niveauData.niveau.numero}</h2>
            <p className="hero-progress__subtitle">{niveauData.niveau.nom}</p>

            <div className="hero-progress__xp-info">
              <span className="hero-progress__xp-text">
                ✨ <strong>{xpRestant} XP</strong> avant le Niveau {niveauData.niveau.numero + 1}
              </span>
            </div>

            {/* Barre de progression avec shimmer */}
            <div className="hero-progress__bar">
              <div
                className="hero-progress__bar-fill"
                style={{ width: `${pourcentageNiveau}%` }}
              />
            </div>
            <p className="hero-progress__bar-label">{xpActuel} / {xpParNiveau} XP</p>

            {/* Carte motivation */}
            <div className="hero-progress__motivation">
              <p className="hero-progress__motivation-text">{messageMotivant}</p>
              <span className="hero-progress__heart" aria-hidden="true">💜</span>
            </div>
          </div>

          {/* NEURI à droite */}
          <div className="hero-progress__neuri">
            <Neuri2D
              version={profil?.neuri_version || getVersionFromDate(profil?.date_naissance)}
              angle="face"
              equipes={{ chapeau: null, haut: null, lunettes: null, compagnonObjet: null }}
              size={170}
            />
          </div>
        </div>
      </section>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(124,58,237,0.08) 100%)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '24px', padding: '28px 24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '24px', opacity: 0.3 }}>⚡</div>
          <p style={{ fontSize: '12px', fontWeight: '700', color: '#A78BFA', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>XP total</p>
          <p style={{ fontSize: '52px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 6px', lineHeight: 1 }}>{profil?.xp || 0}</p>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', margin: 0 }}>
            {(profil?.xp || 0) === 0 ? 'Commence ta première leçon !' : (profil?.xp || 0) < 100 ? 'Bon démarrage 💪' : (profil?.xp || 0) < 500 ? 'Tu progresses bien' : 'Tu cartonnes ! 🚀'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { label: 'Leçons', value: profil?.lecons_completees || 0, color: '#58CC02', icon: '📚' },
            { label: 'Mots appris', value: profil?.mots_appris || 0, color: '#3B82F6', icon: '🔤' },
            { label: 'Temps total', value: `${profil?.temps_total_minutes || 0}min`, color: '#F59E0B', icon: '⏱️' },
            { label: 'Streak', value: streak, color: '#EF4444', icon: '🔥' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '16px' }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>{s.icon}</div>
              <p style={{ fontSize: '24px', fontWeight: '900', color: s.color, margin: '0 0 2px', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '20px' }}>
          <p style={{ fontSize: '14px', fontWeight: '800', color: '#FFFFFF', margin: '0 0 18px' }}>XP cette semaine</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '120px', gap: '6px' }}>
            {xpParJour.map((j, i) => {
              const hauteur = j.xp === 0 ? 4 : Math.max((j.xp / xpMax) * 100, 8)
              const estAujourdhui = i === xpParJour.length - 1
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%' }}>
                  <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ width: '100%', height: `${hauteur}%`, background: estAujourdhui ? 'linear-gradient(180deg, #8B5CF6 0%, #6D28D9 100%)' : j.xp > 0 ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.06)', borderRadius: '8px', transition: 'height 0.6s ease', position: 'relative' }}>
                      {j.xp > 0 && (
                        <span style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', fontWeight: '700', color: estAujourdhui ? '#A78BFA' : 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{j.xp}</span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: estAujourdhui ? '#A78BFA' : 'rgba(255,255,255,0.4)', fontWeight: estAujourdhui ? '700' : '500' }}>{j.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <p style={{ fontSize: '14px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>Objectif quotidien</p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{objectifXP} XP/jour</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px' }}>
            {xpParJour.map((j, i) => {
              const atteint = j.xp >= objectifXP
              const estAujourdhui = i === xpParJour.length - 1
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: atteint ? 'linear-gradient(135deg, #58CC02, #3DAD00)' : 'rgba(255,255,255,0.06)', border: estAujourdhui && !atteint ? '2px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.4s ease' }}>
                    {atteint && (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8 L7 12 L13 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: '10px', color: estAujourdhui ? '#A78BFA' : 'rgba(255,255,255,0.35)', fontWeight: estAujourdhui ? '700' : '500' }}>{j.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '20px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '52px', height: '52px', flexShrink: 0 }}>
            <Neuri2D size={52} glowColor="#8B5CF6" />
          </div>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.5 }}>
            {streak >= 3
              ? `Bravo, ${streak} jours d'affilée ! Tu as pris le rythme.`
              : (profil?.xp || 0) === 0
              ? "Lance ta première leçon, c'est parti !"
              : "Continue comme ça, 5 minutes par jour suffisent pour progresser."}
          </p>
        </div>

      </div>

      <BottomNav />
    </div>
  )
}