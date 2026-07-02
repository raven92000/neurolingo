import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useProfil } from '../context/ProfilContext'
import { useContenu } from '../context/ContenuContext'
import BottomNav from '../components/BottomNav'
import Skeleton from '../components/Skeleton'
import { LANGUES, getLangueActive, setLangueActive, getLangueByCode } from '../utils/languages'

// ═══════════════════════════════════════════════════════════════
// HELPER : tranche d'âge depuis une date de naissance
// ═══════════════════════════════════════════════════════════════
const SUPABASE_URL = 'https://mpdobvqulzbtvtdfeahf.supabase.co'
const CACHE_BUST = Date.now() // force le rechargement des images à chaque session

function getTrancheAge(neuriVersion, dateNaissance) {
  // 1. Priorité : si l'utilisateur a forcé une apparence Neuri (Réglages → Neuri)
  if (neuriVersion && neuriVersion !== 'auto') {
    const map = {
      'enfant': '5-10',
      'ado': '11-17',
      'adulte': '18-35',
      'mature': '36-plus',
    }
    const tranche = map[neuriVersion.toLowerCase()]
    if (tranche) return tranche
  }
  // 2. Sinon fallback sur la date de naissance
  if (!dateNaissance) return '18-35'
  const naissance = new Date(dateNaissance)
  const aujourdhui = new Date()
  let age = aujourdhui.getFullYear() - naissance.getFullYear()
  const m = aujourdhui.getMonth() - naissance.getMonth()
  if (m < 0 || (m === 0 && aujourdhui.getDate() < naissance.getDate())) age--
  if (age <= 10) return '5-10'
  if (age <= 17) return '11-17'
  if (age <= 35) return '18-35'
  return '36-plus'
}

function getImageNiveau(numeroNiveau, tranche) {
  return `${SUPABASE_URL}/storage/v1/object/public/niveaux/${tranche}/niveau-${numeroNiveau}.png?t=${CACHE_BUST}`
}

// ═══════════════════════════════════════════════════════════════
// CONFIG DES 4 NIVEAUX (mondes)
// ═══════════════════════════════════════════════════════════════
const NIVEAUX = [
  {
    numero: 1,
    nom: 'Découverte',
    description: 'Apprends les bases du vocabulaire',
    chapitresNumeros: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    chapitresRequis: [1, 2, 3, 4, 5, 6, 7, 8],
    seuilDeblocage: 6,
    emoji: '🏜️',
    gradient: 'linear-gradient(180deg, rgba(245,158,11,0.18), rgba(180,83,9,0.05))',
  },
  {
    numero: 2,
    nom: 'Les Bases',
    description: 'Construis tes premières phrases',
    chapitresNumeros: [9],
    chapitresRequis: [9],
    seuilDeblocage: 1,
    emoji: '📚',
    gradient: 'linear-gradient(180deg, rgba(168,85,247,0.18), rgba(88,28,135,0.05))',
  },
  {
    numero: 3,
    nom: 'Le Quotidien',
    description: 'Comprends et exprime ton quotidien',
    chapitresNumeros: [10],
    chapitresRequis: [10],
    seuilDeblocage: 1,
    emoji: '🏠',
    gradient: 'linear-gradient(180deg, rgba(16,185,129,0.18), rgba(6,95,70,0.05))',
  },
  {
    numero: 4,
    nom: "L'Autonomie",
    description: 'Sois à l\'aise dans toutes les situations',
    chapitresNumeros: [11],
    chapitresRequis: [11],
    seuilDeblocage: 1,
    emoji: '🏔️',
    gradient: 'linear-gradient(180deg, rgba(99,102,241,0.18), rgba(49,46,129,0.05))',
  },
]

const EMOJI_LECON = {
  "L'Alphabet": '🔤', 'El Alfabeto': '🔤', 'Das Alphabet': '🔤', 'O Alfabeto': '🔤',
  'Les Salutations': '👋', 'Les Chiffres': '🔢', 'Les Couleurs': '🎨',
  'Les Animaux': '🐾', 'La Famille': '👨‍👩‍👧', 'La Nourriture': '🍎',
  'Les Vêtements': '👕', 'Les Émotions': '😊', 'Les Jours': '📅',
  'La Maison': '🏠', 'Les Métiers': '💼', 'La Santé': '🫀',
  'Les Sports': '⚽', 'La Météo': '☁️', 'Les Pays': '🌍',
  'Les Pronoms': '🙋', 'Les Verbes essentiels': '⚙️', 'Les Adjectifs': '✨',
  'Les Lieux de la ville': '🏙️', 'Les Transports': '🚌', 'Les Objets du quotidien': '📱',
  'Les Boissons': '🥤', 'Le Petit-déjeuner': '🥐', 'Les Mois': '📆',
  'Les Heures': '⏰', 'Direction & Position': '📍', 'Les Questions': '❓',
  "Les Verbes d'action": '🏃', 'Les Quantités': '🔢', 'La Politesse': '🤝',
  'Se présenter': '👋', 'Ma famille': '👨‍👩‍👧', 'Mes goûts': '❤️', 'Mon quotidien': '🌅',
}

// ═══════════════════════════════════════════════════════════════
// MODAL DES LANGUES
// ═══════════════════════════════════════════════════════════════
function ModalLangues({ codeActif, onChoisir, onFermer }) {
  return (
    <div onClick={onFermer} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px', animation: 'modalFadeIn 0.2s ease-out' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#0F1626', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '24px', maxWidth: '380px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', animation: 'modalSlideUp 0.3s ease-out' }}>
        <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '22px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 6px', textAlign: 'center' }}>Choisis ta langue</h2>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: '0 0 22px' }}>La langue que tu veux apprendre</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', overflowY: 'auto', flex: 1, paddingRight: '4px', WebkitOverflowScrolling: 'touch' }}>
          {LANGUES.map((langue) => {
            const estActive = langue.code === codeActif
            const verrouillee = !langue.disponible
            return (
              <button key={langue.code} disabled={verrouillee} onClick={() => !verrouillee && onChoisir(langue.code)} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 18px', background: estActive ? 'rgba(139,92,246,0.15)' : verrouillee ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)', border: estActive ? '1.5px solid rgba(139,92,246,0.6)' : '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', cursor: verrouillee ? 'not-allowed' : 'pointer', opacity: verrouillee ? 0.5 : 1, textAlign: 'left', width: '100%', transition: 'all 0.2s ease' }}>
                <span style={{ fontSize: '32px', flexShrink: 0 }}>{langue.drapeau}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: '0 0 2px' }}>{langue.nom}</p>
                  {verrouillee && (<p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>🔒 Bientôt disponible</p>)}
                </div>
                {estActive && (
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2.5 7 L6 10.5 L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
        <button onClick={onFermer} style={{ width: '100%', height: '46px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderRadius: '14px', fontSize: '14px', fontFamily: 'Nunito, sans-serif', fontWeight: '700', cursor: 'pointer' }}>Fermer</button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CARD NIVEAU (image plein cadre + overlays)
// ═══════════════════════════════════════════════════════════════
function CardNiveau({ niveau, etat, progression, isSelected, onClick, trancheAge }) {
  const verrouille = etat === 'locked'
  const termine = etat === 'completed'
  const actif = etat === 'active'

  const opacity = verrouille ? 0.4 : 1
  const filter = verrouille ? 'saturate(0.4) brightness(0.7)' : 'none'

  return (
    <div
      onClick={() => !verrouille && onClick()}
      style={{
        flexShrink: 0,
        width: '180px',
        height: '290px',
        borderRadius: '20px',
        cursor: verrouille ? 'not-allowed' : 'pointer',
        opacity,
        filter,
        boxShadow: actif && isSelected ? '0 0 12px rgba(139,92,246,0.25)' : 'none',
        transition: 'all 0.3s ease',
        scrollSnapAlign: 'start',
        position: 'relative',
        overflow: 'hidden',
        border: isSelected ? '2px solid rgba(139,92,246,0.7)' : '1px solid rgba(255,255,255,0.08)',
        background: '#0F1626',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ZONE HAUTE : IMAGE */}
      <div style={{ position: 'relative', width: '100%', height: '170px', background: niveau.gradient, overflow: 'hidden' }}>
        {/* Dégradé bas pour fondre l'image avec la zone sombre */}
        <div style={{
          position: 'absolute',
          bottom: -1,
          left: 0,
          right: 0,
          height: '30px',
          background: 'linear-gradient(180deg, transparent 0%, rgba(15,22,38,0.5) 60%, #0F1626 100%)',
          zIndex: 2,
          pointerEvents: 'none',
        }}/>
        <img
          src={getImageNiveau(niveau.numero, trancheAge)}
          alt={niveau.nom}
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
          }}
        />
        {/* Fallback emoji */}
        <div style={{
          display: 'none',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '70px',
        }}>
          {niveau.emoji}
        </div>

        {/* Numéro en haut à gauche */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', width: '32px', height: '32px', borderRadius: '50%', background: actif ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)' : termine ? 'linear-gradient(135deg, #58CC02, #3DAD00)' : 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
          <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: '14px', fontWeight: '900', color: '#FFFFFF' }}>{niveau.numero}</span>
        </div>

        {/* Badge en haut à droite */}
        {verrouille && (
          <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="7" width="10" height="7" rx="1.5" fill="rgba(255,255,255,0.7)"/>
              <path d="M5 7 V5 a3 3 0 0 1 6 0 V7" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none"/>
            </svg>
          </div>
        )}
        {termine && (
          <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(88,204,2,0.95)', borderRadius: '8px', padding: '2px 8px' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: '#FFFFFF', fontFamily: 'Nunito' }}>✓ Terminé</span>
          </div>
        )}
        {actif && progression.fait === 0 && (
          <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(168,85,247,0.95)', borderRadius: '8px', padding: '2px 8px' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: '#FFFFFF', fontFamily: 'Nunito' }}>NOUVEAU</span>
          </div>
        )}
      </div>

      {/* ZONE BASSE : INFOS + BOUTON */}
      <div style={{ flex: 1, padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.85)', margin: '0 0 2px', fontWeight: '700' }}>Niveau {niveau.numero}</p>
          <h3 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '17px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 8px' }}>{niveau.nom}</h3>

          <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', marginBottom: '4px' }}>
            <div style={{ height: '100%', width: progression.total > 0 ? `${(progression.fait / progression.total) * 100}%` : '0%', background: termine ? '#58CC02' : 'linear-gradient(90deg, #8B5CF6, #A78BFA)', borderRadius: '99px', transition: 'width 0.6s ease' }} />
          </div>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: 0, textAlign: 'right', fontWeight: '600' }}>
            {progression.fait}/{progression.total}
          </p>
        </div>

        {/* Bouton */}
        {verrouille ? (
          <div style={{ width: '100%', height: '34px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="7" width="10" height="7" rx="1.5" fill="rgba(255,255,255,0.5)"/>
              <path d="M5 7 V5 a3 3 0 0 1 6 0 V7" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none"/>
            </svg>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', fontFamily: 'Nunito' }}>Verrouillé</span>
          </div>
        ) : termine ? (
          <div style={{ width: '100%', height: '34px', background: 'rgba(88,204,2,0.15)', border: '1px solid rgba(88,204,2,0.4)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7 L6 10.5 L11.5 4" stroke="#86EFAC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#86EFAC', fontFamily: 'Nunito' }}>Terminé</span>
          </div>
        ) : (
          <div style={{ width: '100%', height: '34px', background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#FFFFFF', fontFamily: 'Nunito' }}>{progression.fait === 0 ? 'Commencer' : 'Continuer'}</span>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M3 6 L8 6 M6 3 L8 6 L6 9" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function Learn() {
  const navigate = useNavigate()
  const { user, profil, chargementProfil, refreshProfil } = useProfil()
  const { chargerContenu } = useContenu()
  const [chapitres, setChapitres] = useState([])
  const [lecons, setLecons] = useState([])
  const [progressions, setProgressions] = useState([])
  const [niveauSelectionne, setNiveauSelectionne] = useState(1)
  const [chargement, setChargement] = useState(true)
  const [codeLangue, setCodeLangue] = useState(getLangueActive())
  const [modalOuverte, setModalOuverte] = useState(false)
  const [objectifMinutes, setObjectifMinutes] = useState(5)
  const [trancheAge, setTrancheAge] = useState('18-35')
  const carouselRef = useRef(null)

  const langueActuelle = getLangueByCode(codeLangue)

  // Redirige si non connecté
  useEffect(() => {
    if (!chargementProfil && !user) navigate('/login')
  }, [chargementProfil, user, navigate])

  // Objectif + tranche d'âge lus depuis la mémoire partagée du profil
  useEffect(() => {
    if (profil?.objectif_minutes) setObjectifMinutes(profil.objectif_minutes)
    setTrancheAge(getTrancheAge(profil?.neuri_version, profil?.date_naissance))
  }, [profil?.objectif_minutes, profil?.neuri_version, profil?.date_naissance])

  // Aligne la langue affichée sur celle fixée par la mémoire partagée (depuis le
  // profil), une fois le profil chargé. Remplace l'ancien reload de Dashboard.
  useEffect(() => {
    if (!chargementProfil) setCodeLangue(getLangueActive())
  }, [chargementProfil])

  // Données propres (mondes / leçons / progression) — indexées sur la langue.
  // Logique de déverrouillage inchangée : mêmes requêtes qu'avant.
  // Gate sur `chargementProfil` pour être sûr que la langue est alignée.
  useEffect(() => {
    if (chargementProfil || !user?.id) return
    let actif = true
    ;(async () => {
      setChargement(true)
      // Contenu (chapitres/leçons, souvent déjà en cache) EN PARALLÈLE de la
      // progression (toujours fraîche). Déverrouillage inchangé : mêmes données.
      const [contenu, progRes] = await Promise.all([
        chargerContenu(codeLangue),
        supabase.from('progression').select('lecon_id, partie_completee').eq('user_id', user.id),
      ])
      if (!actif) return
      setChapitres(contenu.chapitres)
      setLecons(contenu.lecons)
      setProgressions(progRes.data || [])
      setChargement(false)
    })()
    return () => { actif = false }
  }, [codeLangue, user?.id, chargementProfil])

  const handleChoisirLangue = async (code) => {
    setLangueActive(code)
    setCodeLangue(code)
    setModalOuverte(false)
    const { data: { user: u } } = await supabase.auth.getUser()
    if (u) {
      const { data: langue } = await supabase.from('langues').select('id').eq('code', code).single()
      if (langue) await supabase.from('profils').update({ langue_id: langue.id }).eq('user_id', u.id)
      refreshProfil() // garde la mémoire partagée du profil à jour (langue)
    }
  }

  const handleClickLecon = (lecon) => {
    if (lecon.type === 'alphabet') navigate('/alphabet')
    else if (lecon.type === 'sentence') navigate(`/lesson-sentence?lecon=${lecon.id}`)
    else navigate(`/lesson?lecon=${lecon.id}`)
  }

  const idsCompletes = new Set(progressions.filter(p => p.partie_completee === 2).map(p => p.lecon_id))

  const getEtatChapitre = (chapitreNumero) => {
    const chap = chapitres.find(c => c.numero === chapitreNumero)
    if (!chap) return { fait: 0, total: 0, complet: false }
    const leconsChap = lecons.filter(l => l.chapitre_id === chap.id)
    const fait = leconsChap.filter(l => idsCompletes.has(l.id)).length
    return { fait, total: leconsChap.length, complet: leconsChap.length > 0 && fait === leconsChap.length }
  }

  const getEtatNiveau = (niveau) => {
    const chapitresN = niveau.chapitresRequis.map(getEtatChapitre)
    const totalLecons = chapitresN.reduce((acc, c) => acc + c.total, 0)
    const faitLecons = chapitresN.reduce((acc, c) => acc + c.fait, 0)
    const chapitresComplets = chapitresN.filter(c => c.complet).length
    return { fait: faitLecons, total: totalLecons, chapitresComplets, chapitresTotal: niveau.chapitresRequis.length }
  }

  const niveauEstDebloque = (numero) => {
    if (numero === 1) return true
    const niveauPrecedent = NIVEAUX.find(n => n.numero === numero - 1)
    if (!niveauPrecedent) return false
    const etat = getEtatNiveau(niveauPrecedent)
    return etat.chapitresComplets >= niveauPrecedent.seuilDeblocage
  }

  const getEtatLib = (numero) => {
    if (!niveauEstDebloque(numero)) return 'locked'
    const niveau = NIVEAUX.find(n => n.numero === numero)
    if (!niveau) return 'locked'
    const etat = getEtatNiveau(niveau)
    if (etat.total > 0 && etat.fait === etat.total) return 'completed'
    return 'active'
  }

  const niveauActuel = NIVEAUX.find(n => n.numero === niveauSelectionne)
  const chapitresNiveau = chapitres.filter(c => niveauActuel?.chapitresNumeros.includes(c.numero))
  const etatNiveauActuel = niveauActuel ? getEtatNiveau(niveauActuel) : { fait: 0, total: 0 }

  // Squelette pendant le chargement des mondes/leçons — barre du bas visible.
  if (chargement) {
    return (
      <div style={{ minHeight: '100vh', background: '#090E1A', paddingBottom: '100px', maxWidth: '430px', margin: '0 auto' }}>
        <div style={{ padding: '52px 24px 16px' }}>
          <Skeleton width={140} height={28} />
          <div style={{ height: 8 }} />
          <Skeleton width={200} height={16} />
        </div>
        <div style={{ padding: '0 24px 20px' }}>
          <Skeleton height={56} radius={16} />
        </div>
        <div style={{ display: 'flex', gap: '12px', padding: '4px 24px 16px', overflow: 'hidden' }}>
          {[0, 1, 2].map(i => <Skeleton key={i} width={150} height={180} radius={18} style={{ flexShrink: 0 }} />)}
        </div>
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[0, 1, 2].map(i => <Skeleton key={i} height={80} radius={16} />)}
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#090E1A', paddingBottom: '100px', maxWidth: '430px', margin: '0 auto' }}>
      <style>{`
        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .carousel-niveaux::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{ padding: '52px 24px 16px' }}>
        <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '28px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 4px' }}>Apprendre</h1>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Choisis ta leçon du jour</p>
      </div>

      <div style={{ padding: '0 24px 20px' }}>
        <button onClick={() => setModalOuverte(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: 'rgba(139,92,246,0.08)', border: '1.5px solid rgba(139,92,246,0.4)', borderRadius: '16px', cursor: 'pointer', boxShadow: '0 0 20px rgba(139,92,246,0.12)' }}>
          <span style={{ fontSize: '24px' }}>{langueActuelle.drapeau}</span>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: '700', color: '#A78BFA', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 2px' }}>Tu apprends</p>
            <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>{langueActuelle.nom}</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 8 L10 13 L15 8" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div style={{ padding: '0 24px 12px' }}>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: '700', color: '#A78BFA', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Tes niveaux</p>
      </div>

      <div ref={carouselRef} className="carousel-niveaux" style={{ display: 'flex', gap: '12px', padding: '4px 24px 16px', overflowX: 'auto', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
        {NIVEAUX.map(n => {
          const etat = getEtatLib(n.numero)
          const progN = getEtatNiveau(n)
          return (
            <CardNiveau
              key={n.numero}
              niveau={n}
              etat={etat}
              progression={progN}
              isSelected={niveauSelectionne === n.numero}
              onClick={() => setNiveauSelectionne(n.numero)}
              trancheAge={trancheAge}
            />
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '24px' }}>
        {NIVEAUX.map(n => (
          <div key={n.numero} style={{
            width: niveauSelectionne === n.numero ? '20px' : '6px',
            height: '6px',
            borderRadius: '99px',
            background: niveauSelectionne === n.numero ? '#8B5CF6' : 'rgba(255,255,255,0.15)',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px 18px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '15px', fontWeight: '900', color: '#FFFFFF', fontFamily: 'Nunito' }}>{niveauActuel?.numero}</span>
              </div>
              <div>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '10px', fontWeight: '700', color: '#A78BFA', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 2px' }}>Niveau {niveauActuel?.numero}</p>
                <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '18px', fontWeight: '900', color: '#FFFFFF', margin: 0 }}>{niveauActuel?.nom}</h2>
              </div>
            </div>
            <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '10px', padding: '4px 10px' }}>
              <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: '13px', fontWeight: '800', color: '#A78BFA' }}>{etatNiveauActuel.fait}/{etatNiveauActuel.total}</span>
            </div>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px' }}>
            <div style={{ height: '100%', width: etatNiveauActuel.total > 0 ? `${(etatNiveauActuel.fait / etatNiveauActuel.total) * 100}%` : '0%', background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)', borderRadius: '99px', transition: 'width 0.6s ease' }}/>
          </div>
          {!niveauEstDebloque(niveauActuel?.numero) && niveauActuel?.numero > 1 && (() => {
            const niveauPrec = NIVEAUX.find(n => n.numero === niveauActuel.numero - 1)
            const etatPrec = niveauPrec ? getEtatNiveau(niveauPrec) : { chapitresComplets: 0 }
            return (
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '10px 0 0', textAlign: 'center' }}>
                🔒 {etatPrec.chapitresComplets}/{niveauPrec?.seuilDeblocage} chapitres pour débloquer
              </p>
            )
          })()}
        </div>

        {chapitresNiveau.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>{niveauActuel?.emoji}</div>
            <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '15px', fontWeight: '800', color: '#FFFFFF', margin: '0 0 4px' }}>Bientôt disponible</p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Le contenu de ce niveau arrive prochainement</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {chapitresNiveau.map(chapitre => {
              const leconsChap = lecons.filter(l => l.chapitre_id === chapitre.id)
              const niveauDeb = niveauEstDebloque(niveauActuel?.numero)

              return (
                <div key={chapitre.id}>
                  <div style={{ marginBottom: '10px' }}>
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '10px', fontWeight: '700', color: 'rgba(167,139,250,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 2px' }}>Chapitre {chapitre.numero}</p>
                    <h3 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '15px', fontWeight: '900', color: '#FFFFFF', margin: 0 }}>{chapitre.titre}</h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {leconsChap.map(lecon => {
                      const complete = idsCompletes.has(lecon.id)
                      const emoji = EMOJI_LECON[lecon.titre] || '📖'
                      return (
                        <div
                          key={lecon.id}
                          onClick={() => niveauDeb && handleClickLecon(lecon)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '14px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '14px',
                            cursor: niveauDeb ? 'pointer' : 'not-allowed',
                            opacity: niveauDeb ? 1 : 0.4,
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: complete ? 'rgba(88,204,2,0.12)' : 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{emoji}</div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '15px', fontWeight: '800', color: '#FFFFFF', margin: '0 0 3px' }}>{lecon.titre}</p>
                            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                              {lecon.type === 'alphabet' ? `${lecon.nombre_mots} lettres` : `${lecon.nombre_mots} ${lecon.type === 'sentence' ? 'phrases' : 'mots'} · ~${lecon.duree_minutes} min`}
                            </p>
                          </div>
                          <div style={{ flexShrink: 0 }}>
                            {(() => {
                              const progLecon = progressions.find(p => p.lecon_id === lecon.id)
                              const partie = progLecon?.partie_completee || 0
                              const enMode5min = objectifMinutes === 5 && lecon.type !== 'alphabet'

                              if (complete) {
                                return (
                                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #58CC02, #3DAD00)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7 L6 10.5 L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  </div>
                                )
                              }

                              if (enMode5min && partie === 1) {
                                return (
                                  <div style={{ minWidth: '36px', height: '28px', borderRadius: '14px', background: 'rgba(245,158,11,0.15)', border: '1.5px solid rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#FCD34D', fontFamily: 'Nunito' }}>1/2</span>
                                  </div>
                                )
                              }

                              if (enMode5min && partie === 0) {
                                return (
                                  <div style={{ minWidth: '36px', height: '28px', borderRadius: '14px', background: 'rgba(139,92,246,0.15)', border: '1.5px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#A78BFA', fontFamily: 'Nunito' }}>0/2</span>
                                  </div>
                                )
                              }

                              return (
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(139,92,246,0.15)', border: '1.5px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3.5 2 L7.5 5 L3.5 8" stroke="#A78BFA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                              )
                            })()}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modalOuverte && (
        <ModalLangues codeActif={codeLangue} onChoisir={handleChoisirLangue} onFermer={() => setModalOuverte(false)} />
      )}

      <BottomNav />
    </div>
  )
}