import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Neuri2D from '../components/Neuri2D'
import BottomNav from '../components/BottomNav'
import Skeleton from '../components/Skeleton'
import { supabase } from '../supabase'
import { useProfil } from '../context/ProfilContext'

// ═══════════════════════════════════════════════════════════════════
// COMPOSANTS RÉUTILISABLES
// ═══════════════════════════════════════════════════════════════════

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

function PopupConfirm({ title, message, onConfirm, onCancel, confirmLabel, danger }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
      <div style={{ background: '#0F1626', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 28, maxWidth: 340, width: '100%' }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#FFFFFF', margin: '0 0 12px', textAlign: 'center' }}>{title}</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', margin: '0 0 24px', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, height: 48, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
          <button onClick={onConfirm} style={{ flex: 1, height: 48, background: danger ? '#FF6B6B' : '#8B5CF6', border: 'none', color: '#FFFFFF', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{confirmLabel || 'Confirmer'}</button>
        </div>
      </div>
    </div>
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
function PasswordInputWithEye({ value, onChange, placeholder, style }) {
  const [visible, setVisible] = useState(false)

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: 10 }}>
      <input
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{ ...style, paddingRight: '46px', marginBottom: 0 }}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? 'Masquer' : 'Afficher'}
        style={{
          position: 'absolute', right: '12px', top: '50%',
          transform: 'translateY(-50%)', background: 'transparent',
          border: 'none', cursor: 'pointer', padding: '4px',
          display: 'flex', alignItems: 'center'
        }}
      >
        {visible ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M2 12 C5 6 8 5 12 5 C16 5 19 6 22 12 C19 18 16 19 12 19 C8 19 5 18 2 12 Z" stroke="rgba(255,255,255,0.6)" strokeWidth="1.6" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="3" stroke="rgba(255,255,255,0.6)" strokeWidth="1.6"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M2 12 C5 6 8 5 12 5 C16 5 19 6 22 12 C19 18 16 19 12 19 C8 19 5 18 2 12 Z" stroke="rgba(255,255,255,0.4)" strokeWidth="1.6" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="3" stroke="rgba(255,255,255,0.4)" strokeWidth="1.6"/>
            <path d="M4 4 L20 20" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        )}
      </button>
    </div>
  )
}
function PopupChangePassword({ onClose, onSuccess }) {
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError(null)

    if (newPwd.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères.')
      return
    }
    if (newPwd !== confirmPwd) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password: newPwd })
    setLoading(false)

    if (err) {
      setError(err.message)
      return
    }
    onSuccess()
    onClose()
  }

  const inputStyle = {
    width: '100%', height: 46, padding: '0 14px',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, color: '#FFFFFF', fontSize: 14, fontFamily: 'inherit',
    marginBottom: 10, boxSizing: 'border-box', outline: 'none'
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
      <div style={{ background: '#0F1626', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 28, maxWidth: 360, width: '100%' }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#FFFFFF', margin: '0 0 8px', textAlign: 'center' }}>Modifier le mot de passe</h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: '0 0 20px' }}>
          Choisis un nouveau mot de passe d'au moins 8 caractères.
        </p>

        <PasswordInputWithEye placeholder="Nouveau mot de passe" value={newPwd}
  onChange={e => setNewPwd(e.target.value)} style={inputStyle} />
        <PasswordInputWithEye placeholder="Confirmer le nouveau mot de passe" value={confirmPwd}
  onChange={e => setConfirmPwd(e.target.value)} style={inputStyle} />

        {error && (
          <p style={{ fontSize: 13, color: '#FF6B6B', margin: '0 0 12px', textAlign: 'center' }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button onClick={onClose} disabled={loading} style={{ flex: 1, height: 48, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
          <button onClick={handleSubmit} disabled={loading} style={{ flex: 1, height: 48, background: '#8B5CF6', border: 'none', color: '#FFFFFF', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? '...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

export default function Settings() {
  const navigate = useNavigate()
  const { user, profil: profilData, chargementProfil } = useProfil()
  const [openSection, setOpenSection] = useState(null)
  const [profilId, setProfilId] = useState(null)
  const [popupChangePwd, setPopupChangePwd] = useState(false)
  const [popupDelete, setPopupDelete] = useState(false)
  const [toast, setToast] = useState(null)

  // États synchronisés avec Supabase
  const [profil, setProfil] = useState('TDAH')
  const [profilUtilisateur, setProfilUtilisateur] = useState(null)
  const [dureeSession, setDureeSession] = useState('5 min')
  const [modeFocus, setModeFocus] = useState(false)
  const [repetitionEspacee, setRepetitionEspacee] = useState(true)
  const [tailleTexte, setTailleTexte] = useState('Moyenne')
  const [policeDyslexie, setPoliceDyslexie] = useState(false)
  const [contrasteEleve, setContrasteEleve] = useState(false)
  const [espacementTexte, setEspacementTexte] = useState('Moyen')
  const [modeSimplified, setModeSimplified] = useState(false)
  const [vitesseLecture, setVitesseLecture] = useState('1.0x')
  const [repetitionAuto, setRepetitionAuto] = useState(true)
  const [voix, setVoix] = useState('Féminine')
  const [volume, setVolume] = useState(80)
  const [frequenceNeuri, setFrequenceNeuri] = useState('Normal')
  const [typeFeedback, setTypeFeedback] = useState('Motivant')
  const [animationsNeuri, setAnimationsNeuri] = useState(true)
  const [neuriVersion, setNeuriVersion] = useState('Auto')
  const [rappelQuotidien, setRappelQuotidien] = useState(true)
  const [heureRappel, setHeureRappel] = useState('19:00')
  const [streakReminder, setStreakReminder] = useState(true)
  const [notifPedagogiques, setNotifPedagogiques] = useState(true)
  const [objectifXP, setObjectifXP] = useState('60 XP')
  const [afficherStreak, setAfficherStreak] = useState(true)

  // Mappers entre format affichage <-> format DB
  const profilToDB = { 'TDAH': 'tdah', 'Dyslexie': 'dyslexie', 'Standard': 'standard' }
  const profilToUI = { 'tdah': 'TDAH', 'dyslexie': 'Dyslexie', 'standard': 'Standard' }
  const dureeToDB = { '3 min': 3, '5 min': 5, '10 min': 10 }
  const dureeToUI = { 3: '3 min', 5: '5 min', 10: '10 min' }
  const xpToDB = { '30 XP': 30, '60 XP': 60, '100 XP': 100 }
  const xpToUI = { 30: '30 XP', 60: '60 XP', 100: '100 XP' }
  const neuriVersionToDB = { 'Auto': null, 'Enfant': 'enfant', 'Ado': 'ado', 'Adulte': 'adulte', 'Mature': 'mature' }
  const neuriVersionToUI = { null: 'Auto', 'enfant': 'Enfant', 'ado': 'Ado', 'adulte': 'Adulte', 'mature': 'Mature' }

  // Redirige si non connecté
  useEffect(() => {
    if (!chargementProfil && !user) navigate('/login')
  }, [chargementProfil, user, navigate])

  // ─── Alimenter les réglages depuis la mémoire partagée du profil ─────
  useEffect(() => {
    const data = profilData
    if (!data) return
    {
      setProfilUtilisateur(data)
      setProfilId(data.id)
      setProfil(profilToUI[data.profil_type] || 'TDAH')
      setDureeSession(dureeToUI[data.objectif_minutes] || '5 min')
      setModeFocus(data.mode_focus ?? false)
      setRepetitionEspacee(data.repetition_espacee ?? true)
      setTailleTexte(data.taille_texte || 'Moyenne')
      setPoliceDyslexie(data.police_dyslexie ?? false)
      setContrasteEleve(data.contraste_eleve ?? false)
      setEspacementTexte(data.espacement_texte || 'Moyen')
      setModeSimplified(data.mode_simplifie ?? false)
      setVitesseLecture(data.vitesse_lecture || '1.0x')
      setRepetitionAuto(data.repetition_auto ?? true)
      setVoix(data.voix || 'Féminine')
      setVolume(data.volume ?? 80)
      setFrequenceNeuri(data.frequence_neuri || 'Normal')
      setTypeFeedback(data.type_feedback || 'Motivant')
      setAnimationsNeuri(data.animations_neuri ?? true)
      setNeuriVersion(neuriVersionToUI[data.neuri_version] || 'Auto')
      setRappelQuotidien(data.rappel_quotidien ?? true)
      setHeureRappel(data.heure_rappel || '19:00')
      setStreakReminder(data.streak_reminder ?? true)
      setNotifPedagogiques(data.notif_pedagogiques ?? true)
      setObjectifXP(xpToUI[data.objectif_xp_quotidien] || '60 XP')
      setAfficherStreak(data.afficher_streak ?? true)
    }
  }, [profilData])

  // ─── Helper pour sauvegarder une colonne ─────────────────────
  const sauvegarder = async (colonne, valeur) => {
    if (!user || !profilId) return
    const { error } = await supabase.from('profils').update({ [colonne]: valeur }).eq('id', profilId)
    if (error) console.error('Erreur sauvegarde :', error)
    else showToast('Sauvegardé ✓')
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 1500)
  }

  // ─── Wrappers qui sauvegardent à chaque changement ───────────
  const setProfilSync = (v) => { setProfil(v); sauvegarder('profil_type', profilToDB[v]) }
  const setDureeSessionSync = (v) => { setDureeSession(v); sauvegarder('objectif_minutes', dureeToDB[v]) }
  const setModeFocusSync = (v) => { setModeFocus(v); sauvegarder('mode_focus', v) }
  const setRepetitionEspaceeSync = (v) => { setRepetitionEspacee(v); sauvegarder('repetition_espacee', v) }
  const setTailleTexteSync = (v) => { setTailleTexte(v); sauvegarder('taille_texte', v) }
  const setPoliceDyslexieSync = (v) => { setPoliceDyslexie(v); sauvegarder('police_dyslexie', v) }
  const setContrasteEleveSync = (v) => { setContrasteEleve(v); sauvegarder('contraste_eleve', v) }
  const setEspacementTexteSync = (v) => { setEspacementTexte(v); sauvegarder('espacement_texte', v) }
  const setModeSimplifiedSync = (v) => { setModeSimplified(v); sauvegarder('mode_simplifie', v) }
  const setVitesseLectureSync = (v) => { setVitesseLecture(v); sauvegarder('vitesse_lecture', v) }
  const setRepetitionAutoSync = (v) => { setRepetitionAuto(v); sauvegarder('repetition_auto', v) }
  const setVoixSync = (v) => { setVoix(v); sauvegarder('voix', v) }
  const setVolumeSync = (v) => { setVolume(v); sauvegarder('volume', v) }
  const setFrequenceNeuriSync = (v) => { setFrequenceNeuri(v); sauvegarder('frequence_neuri', v) }
  const setTypeFeedbackSync = (v) => { setTypeFeedback(v); sauvegarder('type_feedback', v) }
  const setAnimationsNeuriSync = (v) => { setAnimationsNeuri(v); sauvegarder('animations_neuri', v) }
  const setNeuriVersionSync = (v) => { setNeuriVersion(v); sauvegarder('neuri_version', neuriVersionToDB[v]) }
  const setRappelQuotidienSync = (v) => { setRappelQuotidien(v); sauvegarder('rappel_quotidien', v) }
  const setHeureRappelSync = (v) => { setHeureRappel(v); sauvegarder('heure_rappel', v) }
  const setStreakReminderSync = (v) => { setStreakReminder(v); sauvegarder('streak_reminder', v) }
  const setNotifPedagogiquesSync = (v) => { setNotifPedagogiques(v); sauvegarder('notif_pedagogiques', v) }
  const setObjectifXPSync = (v) => { setObjectifXP(v); sauvegarder('objectif_xp_quotidien', xpToDB[v]) }
  const setAfficherStreakSync = (v) => { setAfficherStreak(v); sauvegarder('afficher_streak', v) }

  // ─── Actions de compte ───────────────────────────────────────
  const handleUpgrade = () => navigate('/pricing')
  const handleManageSubscription = () => navigate('/pricing')

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleDeleteAccount = async () => {
    if (!user || !profilId) return
    await supabase.from('progression').delete().eq('user_id', user.id)
    await supabase.from('profils').delete().eq('id', profilId)
    await supabase.auth.signOut()
    setPopupDelete(false)
    navigate('/login')
  }

  const handleResetProgress = async () => {
    if (!user || !profilId) return
    await supabase.from('progression').delete().eq('user_id', user.id)
    await supabase.from('profils').update({
      lecons_completees: 0, mots_appris: 0, xp: 0, streak: 0, temps_total_minutes: 0
    }).eq('id', profilId)
    showToast('Progression réinitialisée ✓')
  }

  const toggleSection = (key) => {
    setOpenSection(openSection === key ? null : key)
  }

  // ─── Squelette (chargement à froid uniquement) ───────────────
  if (chargementProfil && !profilData) {
    return (
      <div style={{ minHeight: '100vh', background: '#080D18', paddingBottom: '100px', maxWidth: '430px', margin: '0 auto' }}>
        <div style={{ padding: '52px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width={160} height={30} />
          <Skeleton width={80} height={80} radius={16} />
        </div>
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} height={56} radius={16} />)}
        </div>
        <BottomNav />
      </div>
    )
  }

  // ─── Contenus des sections ───────────────────────────────────
  const renderSectionContent = (key, color) => {
    switch (key) {
      case 'apprentissage':
        return <>
          <SelectorRow label="Type de profil" options={['TDAH', 'Dyslexie', 'Standard']} value={profil} onChange={setProfilSync} color={color} />
          <SelectorRow label="Durée des sessions" options={['5 min', '10 min']} value={dureeSession} onChange={setDureeSessionSync} color={color} />
          <DetailRow label="Répétition espacée" last><Toggle value={repetitionEspacee} onChange={setRepetitionEspaceeSync} color={color} /></DetailRow>
        </>
      case 'accessibilite':
        return <>
          <SelectorRow label="Taille du texte" options={['Petite', 'Moyenne', 'Grande']} value={tailleTexte} onChange={setTailleTexteSync} color={color} />
          <DetailRow label="Police adaptée dyslexie"><Toggle value={policeDyslexie} onChange={setPoliceDyslexieSync} color={color} /></DetailRow>
          <DetailRow label="Contraste élevé"><Toggle value={contrasteEleve} onChange={setContrasteEleveSync} color={color} /></DetailRow>
          <SelectorRow label="Espacement du texte" options={['Compact', 'Moyen', 'Large']} value={espacementTexte} onChange={setEspacementTexteSync} color={color} />
          <DetailRow label="Mode simplifié" last><Toggle value={modeSimplified} onChange={setModeSimplifiedSync} color={color} /></DetailRow>
        </>
      case 'audio':
        return <>
          <SelectorRow label="Vitesse de lecture" options={['0.75x', '1.0x', '1.25x']} value={vitesseLecture} onChange={setVitesseLectureSync} color={color} />
          <DetailRow label="Répétition automatique"><Toggle value={repetitionAuto} onChange={setRepetitionAutoSync} color={color} /></DetailRow>
          <SelectorRow label="Voix" options={['Féminine', 'Masculine']} value={voix} onChange={setVoixSync} color={color} />
          <div style={{ padding: '14px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#FFFFFF' }}>Volume</span>
              <span style={{ fontSize: 13, color }}>{volume}%</span>
            </div>
            <input type="range" min={0} max={100} value={volume}
              onChange={e => setVolume(parseInt(e.target.value))}
              onMouseUp={e => sauvegarder('volume', parseInt(e.target.value))}
              onTouchEnd={e => sauvegarder('volume', volume)}
              style={{ width: '100%', accentColor: color, cursor: 'pointer' }} />
          </div>
        </>
      case 'neuri':
        return <>
          <SelectorRow label="Fréquence d'apparition" options={['Faible', 'Normal', 'Élevée']} value={frequenceNeuri} onChange={setFrequenceNeuriSync} color={color} />
          <SelectorRow label="Type de feedback" options={['Doux', 'Motivant', 'Minimal']} value={typeFeedback} onChange={setTypeFeedbackSync} color={color} />
          <DetailRow label="Animations de Neuri"><Toggle value={animationsNeuri} onChange={setAnimationsNeuriSync} color={color} /></DetailRow>

          {/* ─── APPARENCE NEURI (NOUVEAU) ──────────────────── */}
          <div style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#FFFFFF' }}>Apparence de Neuri</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                {neuriVersion === 'Auto' ? 'Selon mon âge' : 'Manuel'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {['Auto', 'Enfant', 'Ado', 'Adulte', 'Mature'].map(opt => (
                <button
                  key={opt}
                  onClick={(e) => { e.stopPropagation(); setNeuriVersionSync(opt) }}
                  style={{
                    padding: '10px 4px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontSize: 11, fontWeight: 700,
                    background: neuriVersion === opt ? color : 'rgba(255,255,255,0.08)',
                    color: neuriVersion === opt ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                    transition: 'all 0.2s ease'
                  }}
                >{opt}</button>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: '14px 0 0', lineHeight: 1.5, fontStyle: 'italic' }}>
            Neuri t'encourage sans te mettre la pression.
          </p>
        </>
      case 'notifications':
        return <>
          <DetailRow label="Rappel quotidien"><Toggle value={rappelQuotidien} onChange={setRappelQuotidienSync} color={color} /></DetailRow>
          <DetailRow label="Heure du rappel">
            <select value={heureRappel} onChange={e => setHeureRappelSync(e.target.value)} style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10, padding: '6px 10px', color: '#FFFFFF', fontSize: 13, cursor: 'pointer'
            }}>
              {['07:00','08:00','09:00','12:00','17:00','18:00','19:00','20:00','21:00'].map(h => (
                <option key={h} value={h} style={{ background: '#1a1a2e' }}>{h}</option>
              ))}
            </select>
          </DetailRow>
          <DetailRow label="Rappel de streak"><Toggle value={streakReminder} onChange={setStreakReminderSync} color={color} /></DetailRow>
          <DetailRow label="Notifications pédagogiques" last><Toggle value={notifPedagogiques} onChange={setNotifPedagogiquesSync} color={color} /></DetailRow>
        </>
      case 'objectifs':
        return <>
          <SelectorRow label="Objectif quotidien" options={['30 XP', '60 XP', '100 XP']} value={objectifXP} onChange={setObjectifXPSync} color={color} />
          <DetailRow label="Afficher le streak"><Toggle value={afficherStreak} onChange={setAfficherStreakSync} color={color} /></DetailRow>
          <DetailRow label="Réinitialiser progression" onClick={handleResetProgress} last />
        </>
      case 'compte':
        return <>
          {profilUtilisateur?.role === 'child' ? (
            <DetailRow label="Identifiant" value={profilUtilisateur?.identifiant_login || 'Non défini'} />
          ) : (
            <DetailRow label="Adresse email" value={user?.email || ''} />
          )}
          <DetailRow label="Modifier le mot de passe" onClick={() => setPopupChangePwd(true)} />
          <DetailRow label="Déconnexion" onClick={handleLogout} />
          <DetailRow label="Supprimer le compte" onClick={() => setPopupDelete(true)} danger last />
        </>
      case 'confidentialite':
        return <>
          <DetailRow label="Politique de confidentialité" onClick={() => window.open('https://neurolingo.vercel.app/privacy', '_blank')} />
          <DetailRow label="Gestion des données" onClick={() => {}} />
          <DetailRow label="Exporter mes données" onClick={() => {}} />
          <DetailRow label="Supprimer mes données" onClick={() => setPopupDelete(true)} danger last />
        </>
      default:
        return null
    }
  }

  // ─── RENDER ──────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#080D18', paddingBottom: 100, maxWidth: 430, margin: '0 auto', fontFamily: "'DM Sans', sans-serif" }}>

      <div style={{ padding: '52px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>

  {/* ─── BOUTON RETOUR ──────────────────────────── */}
  <button onClick={() => navigate('/profile')} aria-label="Retour au profil" style={{
    position: 'absolute', top: '52px', left: '20px',
    width: '40px', height: '40px', borderRadius: '12px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', padding: 0, transition: 'background 0.2s ease'
  }}
  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
  <path d="M6 6 L18 18 M18 6 L6 18" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round"/>
</svg>
  </button>

  <div style={{ marginLeft: '52px' }}>
    <h1 style={{ fontSize: 28, fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '0.02em' }}>PARAMÈTRES</h1>
    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>Personnalise ton expérience NeuroLingo</p>
  </div>
  <div style={{ width: 80, height: 80, marginTop: -10, flexShrink: 0 }}>
    <Neuri2D size={80} glowColor="#8B5CF6" />
  </div>
</div>

      <div style={{ padding: '0 16px' }}>

        {/* 1. ABONNEMENT */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 20, marginBottom: 16 }}>
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
          <button onClick={handleUpgrade} style={{ width: '100%', height: 48, borderRadius: 14, border: 'none', background: '#55D600', color: '#FFFFFF', fontSize: 15, fontWeight: 800, cursor: 'pointer', marginBottom: 8 }}>Passer à Premium</button>
          <div onClick={handleManageSubscription} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 4px 4px', cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8 }}>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>Gérer abonnement</span>
            <ChevronRight />
          </div>
        </div>

        {/* SECTIONS 2 à 9 — ACCORDÉON */}
        {Object.entries(SECTIONS).map(([key, sec]) => {
          const isOpen = openSection === key
          return (
            <div key={key} style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${isOpen ? sec.bg.replace('0.15', '0.4') : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 20, marginBottom: 12, overflow: 'hidden',
              transition: 'border 0.25s ease'
            }}>
              <div onClick={() => toggleSection(key)} style={{ padding: '16px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
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
              {isOpen && (
                <div style={{ padding: '0 18px 8px', borderTop: '1px solid rgba(255,255,255,0.05)', animation: 'slideDown 0.25s ease' }}>
                  {renderSectionContent(key, sec.color)}
                </div>
              )}
            </div>
          )
        })}

        {/* FOOTER NEURI */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '16px 20px', marginTop: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 64, height: 64, flexShrink: 0 }}>
            <Neuri2D size={64} glowColor="#8B5CF6" />
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.4, flex: 1 }}>
            <span style={{ color: '#A78BFA', fontWeight: 700 }}>Neuri</span> est là pour t'accompagner, pas pour te juger. <span style={{ color: '#8B5CF6' }}>💜</span>
          </p>
        </div>

        {/* DÉCONNEXION */}
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

      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 110, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(85,214,0,0.95)', color: '#FFFFFF',
          padding: '10px 20px', borderRadius: 24, fontSize: 13, fontWeight: 700,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)', zIndex: 200,
          animation: 'fadeInUp 0.3s ease'
        }}>{toast}</div>
      )}

      {/* POPUPS */}
      {popupChangePwd && (
  <PopupChangePassword
    onClose={() => setPopupChangePwd(false)}
    onSuccess={() => showToast('Mot de passe modifié ✓')}
  />
)}
      {popupDelete && (
        <PopupConfirm
          title="Supprimer ton compte ?"
          message="Cette action est irréversible. Toutes tes données et ta progression seront perdues."
          confirmLabel="Supprimer"
          danger
          onConfirm={handleDeleteAccount}
          onCancel={() => setPopupDelete(false)}
        />
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 600px; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      <BottomNav />
    </div>
  )
}