import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Neuri3D from '../components/Neuri3D'

// ═══════════════════════════════════════════════════════════════════
// COMPOSANTS RÉUTILISABLES
// ═══════════════════════════════════════════════════════════════════

function BottomNav({ actif }) {
  const navigate = useNavigate()
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(8,13,24,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 0 24px', display: 'flex', justifyContent: 'space-around', maxWidth: 430, margin: '0 auto', zIndex: 100 }}>
      {[
        { label: 'Accueil', page: '/dashboard', icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 11 L11 4 L19 11 L19 19 L13 19 L13 14 L9 14 L9 19 L3 19 Z" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" strokeLinejoin="round" fill="none"/></svg> },
        { label: 'Apprendre', page: '/learn', icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 3 L19 8 L19 16 L11 21 L3 16 L3 8 Z" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinejoin="round" fill="none"/></svg> },
        { label: 'Progression', page: '/stats', icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 17 L8 12 L12 15 L19 7" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg> },
        { label: 'Profil', page: '/profile', icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="8" r="3.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none"/><path d="M4 19 C4 15 7 13 11 13 C15 13 18 15 18 19" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg> },
        { label: 'Paramètres', page: '/settings', actif: true, icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="3" stroke="#8B5CF6" strokeWidth="1.5" fill="rgba(139,92,246,0.1)"/><path d="M11 2 L11 5 M11 17 L11 20 M2 11 L5 11 M17 11 L20 11 M4.5 4.5 L6.5 6.5 M15.5 15.5 L17.5 17.5 M4.5 17.5 L6.5 15.5 M15.5 6.5 L17.5 4.5" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round"/></svg> },
      ].map((nav, i) => (
        <div key={i} onClick={() => navigate(nav.page)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          {nav.icon}
          <span style={{ fontSize: 11, fontWeight: nav.actif ? 700 : 500, color: nav.actif ? '#8B5CF6' : 'rgba(255,255,255,0.4)' }}>{nav.label}</span>
        </div>
      ))}
    </div>
  )
}

function Toggle({ value, onChange, color = '#8B5CF6' }) {
  return (
    <div onClick={(e) => { e.stopPropagation(); onChange(!value) }} style={{
      width: 46, height: 26, borderRadius: 13, cursor: 'pointer',
      background: value ? color : 'rgba(255,255,255,0.12)',
      position: 'relative', transition: 'background 0.25s ease', flexShrink: 0
    }}>
      <div style={{
        position: 'absolute', top: 3, left: value ? 23 : 3,
        width: 20, height: 20, borderRadius: '50%', background: '#FFFFFF',
        transition: 'left 0.25s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
      }} />
    </div>
  )
}

function PillSelector({ options, value, onChange, color = '#8B5CF6' }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {options.map(opt => (
        <button key={opt} onClick={(e) => { e.stopPropagation(); onChange(opt) }} style={{
          padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 700,
          background: value === opt ? color : 'rgba(255,255,255,0.08)',
          color: value === opt ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
          transition: 'all 0.2s ease'
        }}>{opt}</button>
      ))}
    </div>
  )
}

function DetailRow({ label, value, onClick, children, danger, last }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 0',
      borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.05)',
      cursor: onClick ? 'pointer' : 'default'
    }}>
      <span style={{ fontSize: 14, fontWeight: 500, color: danger ? '#FF6B6B' : '#FFFFFF' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {value && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{value}</span>}
        {children}
        {onClick && <ChevronRight />}
      </div>
    </div>
  )
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 3L9 7L5 11" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ChevronToggle({ open, color }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease', flexShrink: 0 }}>
      <path d="M6 4L10 8L6 12" stroke={open ? color : 'rgba(255,255,255,0.4)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════
// CONFIG SECTIONS
// ═══════════════════════════════════════════════════════════════════

const SECTIONS = {
  apprentissage: { num: '2', title: 'Apprentissage', sub: "Adapte l'apprentissage à ton profil.", color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
  accessibilite: { num: '3', title: 'Accessibilité', sub: "Ajuste l'affichage pour un confort optimal.", color: '#55D600', bg: 'rgba(85,214,0,0.15)' },
  audio: { num: '4', title: 'Audio & voix', sub: 'Personnalise la lecture audio et la voix.', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  neuri: { num: '5', title: 'Neuri', sub: "Configure l'accompagnement de Neuri.", color: '#FF6B00', bg: 'rgba(255,107,0,0.15)' },
  notifications: { num: '6', title: 'Notifications & routine', sub: 'Gère tes rappels et notifications.', color: '#A78BFA', bg: 'rgba(167,139,250,0.15)' },
  objectifs: { num: '7', title: 'Objectifs & progression', sub: 'Fixe tes objectifs et suis tes progrès.', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  compte: { num: '8', title: 'Compte', sub: 'Gère ton compte et ta sécurité.', color: '#14B8A6', bg: 'rgba(20,184,166,0.15)' },
  confidentialite: { num: '9', title: 'Confidentialité & données', sub: 'Tes données, ton choix.', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
}

function SectionIcon({ sectionKey, color }) {
  const icons = {
    apprentissage: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8" stroke={color} strokeWidth="1.8"/><circle cx="11" cy="11" r="4" stroke={color} strokeWidth="1.8"/><circle cx="11" cy="11" r="1.5" fill={color}/></svg>,
    accessibilite: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M2 11 C5 5 8 4 11 4 C14 4 17 5 20 11 C17 17 14 18 11 18 C8 18 5 17 2 11 Z" stroke={color} strokeWidth="1.8" fill="none"/><circle cx="11" cy="11" r="3" fill={color}/></svg>,
    audio: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 9 L3 13 L7 13 L11 17 L11 5 L7 9 Z" fill={color}/><path d="M14 8 C16 10 16 12 14 14" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/><path d="M16 6 C19 9 19 13 16 16" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/></svg>,
    neuri: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8" stroke={color} strokeWidth="1.8" fill="none"/><circle cx="8" cy="9" r="1" fill={color}/><circle cx="14" cy="9" r="1" fill={color}/><path d="M7 13 C9 15 13 15 15 13" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/></svg>,
    notifications: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M5 16 L17 16 L15 13 L15 9 C15 6 13 4 11 4 C9 4 7 6 7 9 L7 13 Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none"/><circle cx="11" cy="18" r="1.5" fill={color}/></svg>,
    objectifs: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8" stroke={color} strokeWidth="1.8" fill="none"/><path d="M7 11 L10 14 L15 8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>,
    compte: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="8" r="3.5" stroke={color} strokeWidth="1.8" fill="none"/><path d="M4 19 C4 15 7 13 11 13 C15 13 18 15 18 19" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/></svg>,
    confidentialite: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 3 L18 6 L18 11 C18 15 15 18 11 19 C7 18 4 15 4 11 L4 6 Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none"/><path d="M8 11 L10 13 L14 9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>,
  }
  return icons[sectionKey] || null
}

// ═══════════════════════════════════════════════════════════════════
// LIGNE SELECTOR (label + pills)
// ═══════════════════════════════════════════════════════════════════

function SelectorRow({ label, options, value, onChange, color, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 0',
      borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.05)'
    }}>
      <span style={{ fontSize: 14, fontWeight: 500, color: '#FFFFFF' }}>{label}</span>
      <PillSelector options={options} value={value} onChange={onChange} color={color} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

export default function Settings() {
  const navigate = useNavigate()
  const [openSection, setOpenSection] = useState(null)

  // États
  const [profil, setProfil] = useState('TDAH')
  const [dureeSession, setDureeSession] = useState('5 min')
  const [modeFocus, setModeFocus] = useState(true)
  const [repetitionEspacee, setRepetitionEspacee] = useState(true)
  const [tailleTexte, setTailleTexte] = useState('Moyenne')
  const [policeDyslexie, setPoliceDyslexie] = useState(true)
  const [contrasteEleve, setContrasteEleve] = useState(true)
  const [espacementTexte, setEspacementTexte] = useState('Moyen')
  const [modeSimplified, setModeSimplified] = useState(false)
  const [vitesseLecture, setVitesseLecture] = useState('1.0x')
  const [repetitionAuto, setRepetitionAuto] = useState(true)
  const [voix, setVoix] = useState('Féminine')
  const [volume, setVolume] = useState(80)
  const [frequenceNeuri, setFrequenceNeuri] = useState('Normal')
  const [typeFeedback, setTypeFeedback] = useState('Motivant')
  const [animationsNeuri, setAnimationsNeuri] = useState(true)
  const [rappelQuotidien, setRappelQuotidien] = useState(true)
  const [heureRappel, setHeureRappel] = useState('19:00')
  const [streakReminder, setStreakReminder] = useState(true)
  const [notifPedagogiques, setNotifPedagogiques] = useState(true)
  const [objectifXP, setObjectifXP] = useState('60 XP')
  const [afficherStreak, setAfficherStreak] = useState(true)

  const handleUpgrade = () => navigate('/pricing')
  const handleManageSubscription = () => navigate('/pricing')
  const handleLogout = () => { console.log('Logout placeholder'); navigate('/login') }
  const handleDeleteAccount = () => console.log('Delete account placeholder')
  const handleResetProgress = () => console.log('Reset progress placeholder')

  const toggleSection = (key) => {
    setOpenSection(openSection === key ? null : key)
  }

  // ─── Contenus des sections ────────────────────────────────────
  const renderSectionContent = (key, color) => {
    switch (key) {
      case 'apprentissage':
        return <>
          <SelectorRow label="Type de profil" options={['TDAH', 'Dyslexie', 'Standard']} value={profil} onChange={setProfil} color={color} />
          <SelectorRow label="Durée des sessions" options={['3 min', '5 min', '10 min']} value={dureeSession} onChange={setDureeSession} color={color} />
          <DetailRow label="Mode focus"><Toggle value={modeFocus} onChange={setModeFocus} color={color} /></DetailRow>
          <DetailRow label="Répétition espacée" last><Toggle value={repetitionEspacee} onChange={setRepetitionEspacee} color={color} /></DetailRow>
        </>
      case 'accessibilite':
        return <>
          <SelectorRow label="Taille du texte" options={['Petite', 'Moyenne', 'Grande']} value={tailleTexte} onChange={setTailleTexte} color={color} />
          <DetailRow label="Police adaptée dyslexie"><Toggle value={policeDyslexie} onChange={setPoliceDyslexie} color={color} /></DetailRow>
          <DetailRow label="Contraste élevé"><Toggle value={contrasteEleve} onChange={setContrasteEleve} color={color} /></DetailRow>
          <SelectorRow label="Espacement du texte" options={['Compact', 'Moyen', 'Large']} value={espacementTexte} onChange={setEspacementTexte} color={color} />
          <DetailRow label="Mode simplifié" last><Toggle value={modeSimplified} onChange={setModeSimplified} color={color} /></DetailRow>
        </>
      case 'audio':
        return <>
          <SelectorRow label="Vitesse de lecture" options={['0.75x', '1.0x', '1.25x']} value={vitesseLecture} onChange={setVitesseLecture} color={color} />
          <DetailRow label="Répétition automatique"><Toggle value={repetitionAuto} onChange={setRepetitionAuto} color={color} /></DetailRow>
          <SelectorRow label="Voix" options={['Féminine', 'Masculine']} value={voix} onChange={setVoix} color={color} />
          <div style={{ padding: '14px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#FFFFFF' }}>Volume</span>
              <span style={{ fontSize: 13, color }}>{volume}%</span>
            </div>
            <input type="range" min={0} max={100} value={volume} onChange={e => setVolume(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: color, cursor: 'pointer' }} />
          </div>
        </>
      case 'neuri':
        return <>
          <SelectorRow label="Fréquence d'apparition" options={['Faible', 'Normal', 'Élevée']} value={frequenceNeuri} onChange={setFrequenceNeuri} color={color} />
          <SelectorRow label="Type de feedback" options={['Doux', 'Motivant', 'Minimal']} value={typeFeedback} onChange={setTypeFeedback} color={color} />
          <DetailRow label="Animations de Neuri" last><Toggle value={animationsNeuri} onChange={setAnimationsNeuri} color={color} /></DetailRow>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: '14px 0 0', lineHeight: 1.5, fontStyle: 'italic' }}>
            Neuri t'encourage sans te mettre la pression.
          </p>
        </>
      case 'notifications':
        return <>
          <DetailRow label="Rappel quotidien"><Toggle value={rappelQuotidien} onChange={setRappelQuotidien} color={color} /></DetailRow>
          <DetailRow label="Heure du rappel">
            <select value={heureRappel} onChange={e => setHeureRappel(e.target.value)} style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10, padding: '6px 10px', color: '#FFFFFF', fontSize: 13, cursor: 'pointer'
            }}>
              {['07:00','08:00','09:00','12:00','17:00','18:00','19:00','20:00','21:00'].map(h => (
                <option key={h} value={h} style={{ background: '#1a1a2e' }}>{h}</option>
              ))}
            </select>
          </DetailRow>
          <DetailRow label="Rappel de streak"><Toggle value={streakReminder} onChange={setStreakReminder} color={color} /></DetailRow>
          <DetailRow label="Notifications pédagogiques" last><Toggle value={notifPedagogiques} onChange={setNotifPedagogiques} color={color} /></DetailRow>
        </>
      case 'objectifs':
        return <>
          <SelectorRow label="Objectif quotidien" options={['30 XP', '60 XP', '100 XP']} value={objectifXP} onChange={setObjectifXP} color={color} />
          <DetailRow label="Afficher le streak"><Toggle value={afficherStreak} onChange={setAfficherStreak} color={color} /></DetailRow>
          <DetailRow label="Réinitialiser progression" onClick={handleResetProgress} last />
        </>
      case 'compte':
        return <>
          <DetailRow label="Adresse email" value="alex@example.com" onClick={() => {}} />
          <DetailRow label="Mot de passe" onClick={() => {}} />
          <DetailRow label="Déconnexion" onClick={handleLogout} />
          <DetailRow label="Supprimer le compte" onClick={handleDeleteAccount} danger last />
        </>
      case 'confidentialite':
        return <>
          <DetailRow label="Politique de confidentialité" onClick={() => {}} />
          <DetailRow label="Gestion des données" onClick={() => {}} />
          <DetailRow label="Exporter mes données" onClick={() => {}} />
          <DetailRow label="Supprimer mes données" onClick={handleDeleteAccount} danger last />
        </>
      default:
        return null
    }
  }

  // ─── RENDER ───────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#080D18', paddingBottom: 100, maxWidth: 430, margin: '0 auto', fontFamily: "'DM Sans', sans-serif" }}>

      {/* HEADER */}
      <div style={{ padding: '52px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '0.02em' }}>PARAMÈTRES</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>Personnalise ton expérience NeuroLingo</p>
        </div>
        <div style={{ width: 80, height: 80, marginTop: -10, flexShrink: 0 }}>
          <Neuri3D color="#8B5CF6" />
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* ── 1. ABONNEMENT (carte spéciale, lien vers Pricing) ── */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20, padding: 20, marginBottom: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245,158,11,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2 L12.5 7.5 L18 8 L14 12 L15 18 L10 15 L5 18 L6 12 L2 8 L7.5 7.5 Z" fill="#F59E0B"/>
                </svg>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#A78BFA', margin: 0 }}>1. Abonnement</h3>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Gratuit</div>
          </div>

          <p style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', margin: '8px 0 4px' }}>Tu es en version gratuite</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 16px', lineHeight: 1.4 }}>
            Passe à Premium pour débloquer toutes les fonctionnalités avancées.
          </p>

          <button onClick={handleUpgrade} style={{
            width: '100%', height: 48, borderRadius: 14, border: 'none',
            background: '#55D600', color: '#FFFFFF',
            fontSize: 15, fontWeight: 800, cursor: 'pointer', marginBottom: 8
          }}>Passer à Premium</button>

          <div onClick={handleManageSubscription} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 4px 4px', cursor: 'pointer',
            borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8
          }}>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>Gérer abonnement</span>
            <ChevronRight />
          </div>
        </div>

        {/* ── SECTIONS 2 à 9 — ACCORDÉON ─────────────────────── */}
        {Object.entries(SECTIONS).map(([key, sec]) => {
          const isOpen = openSection === key
          return (
            <div key={key} style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${isOpen ? sec.bg.replace('0.15', '0.4') : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 20, marginBottom: 12, overflow: 'hidden',
              transition: 'border 0.25s ease'
            }}>
              {/* Header de section (cliquable) */}
              <div onClick={() => toggleSection(key)} style={{
                padding: '16px 18px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: sec.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <SectionIcon sectionKey={key} color={sec.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: sec.color, margin: '0 0 2px' }}>
                    {sec.num}. {sec.title}
                  </h3>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.4 }}>{sec.sub}</p>
                </div>
                <ChevronToggle open={isOpen} color={sec.color} />
              </div>

              {/* Contenu déroulant */}
              {isOpen && (
                <div style={{
                  padding: '0 18px 8px',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  animation: 'slideDown 0.25s ease'
                }}>
                  {renderSectionContent(key, sec.color)}
                </div>
              )}
            </div>
          )
        })}

        {/* ── FOOTER NEURI ───────────────────────────────────── */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20, padding: '16px 20px', marginTop: 16,
          display: 'flex', alignItems: 'center', gap: 14
        }}>
          <div style={{ width: 64, height: 64, flexShrink: 0 }}>
            <Neuri3D color="#8B5CF6" />
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.4, flex: 1 }}>
            <span style={{ color: '#A78BFA', fontWeight: 700 }}>Neuri</span> est là pour t'accompagner, pas pour te juger. <span style={{ color: '#8B5CF6' }}>💜</span>
          </p>
        </div>

        {/* ── DÉCONNEXION ────────────────────────────────────── */}
        <button onClick={handleLogout} style={{
          width: '100%', height: 52, borderRadius: 16, marginTop: 16,
          background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.25)',
          color: '#FF6B6B', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 13 L6 9 L11 5" stroke="#FF6B6B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 9 L15 9" stroke="#FF6B6B" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Déconnexion
        </button>

      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 600px; }
        }
      `}</style>

      <BottomNav />
    </div>
  )
}