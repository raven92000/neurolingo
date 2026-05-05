import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import BottomNav from '../components/BottomNav'
import { LANGUES, getLangueActive, setLangueActive, getLangueByCode } from '../utils/languages'

const EMOJI_LECON = {
  'Salutations': '👋',
  'Les Chiffres': '🔢',
  'Les Couleurs': '🎨',
  'Les Animaux': '🐾',
  'La Famille': '👨‍👩‍👧',
  'La Nourriture': '🍎',
  'Les Vêtements': '👕',
  'Les Émotions': '😊',
  'Les Jours': '📅',
  'La Maison': '🏠',
  'Le Corps': '🫀',
  'Les Transports': '🚌',
  'Le Travail': '💼',
  'La Nature': '🌿',
  'Les Sports': '⚽',
}

function ModalLangues({ codeActif, onChoisir, onFermer }) {
  return (
    <div onClick={onFermer} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px', animation: 'modalFadeIn 0.2s ease-out' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#0F1626', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '24px', maxWidth: '380px', width: '100%', animation: 'modalSlideUp 0.3s ease-out' }}>
        <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '22px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 6px', textAlign: 'center' }}>Choisis ta langue</h2>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: '0 0 22px' }}>La langue que tu veux apprendre</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {LANGUES.map((langue) => {
            const estActive = langue.code === codeActif
            const verrouillee = !langue.disponible
            return (
              <button key={langue.code} disabled={verrouillee} onClick={() => !verrouillee && onChoisir(langue.code)} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 18px', background: estActive ? 'rgba(139,92,246,0.15)' : verrouillee ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)', border: estActive ? '1.5px solid rgba(139,92,246,0.6)' : '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', cursor: verrouillee ? 'not-allowed' : 'pointer', opacity: verrouillee ? 0.5 : 1, textAlign: 'left', width: '100%', transition: 'all 0.2s ease' }}>
                <span style={{ fontSize: '32px', flexShrink: 0 }}>{langue.drapeau}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: '0 0 2px' }}>{langue.nom}</p>
                  {verrouillee && (
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>🔒 Bientôt disponible</p>
                  )}
                </div>
                {estActive && (
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7 L6 10.5 L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
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

export default function Learn() {
  const navigate = useNavigate()
  const [chapitres, setChapitres] = useState([])
  const [lecons, setLecons] = useState([])
  const [idsCompletes, setIdsCompletes] = useState(new Set())
  const [chargement, setChargement] = useState(true)
  const [codeLangue, setCodeLangue] = useState(getLangueActive())
  const [modalOuverte, setModalOuverte] = useState(false)

  const langueActuelle = getLangueByCode(codeLangue)

  useEffect(() => {
    async function charger() {
      setChargement(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login'); return }

      const { data: langue } = await supabase.from('langues').select('id').eq('code', codeLangue).single()

      if (!langue) {
        setChapitres([])
        setLecons([])
        setIdsCompletes(new Set())
        setChargement(false)
        return
      }

      const { data: chaps } = await supabase.from('chapitres').select('*').eq('langue_id', langue.id).order('numero')

      const chapitreIds = (chaps || []).map((c) => c.id)
      let lecs = []
      if (chapitreIds.length > 0) {
        const res = await supabase.from('lecons').select('*').in('chapitre_id', chapitreIds).order('ordre')
        lecs = res.data || []
      }

      const { data: progressions } = await supabase.from('progression').select('lecon_id').eq('user_id', user.id)

      setChapitres(chaps || [])
      setLecons(lecs)
      setIdsCompletes(new Set((progressions || []).map((p) => p.lecon_id)))
      setChargement(false)
    }
    charger()
  }, [codeLangue])

  const handleChoisirLangue = (code) => {
    setLangueActive(code)
    setCodeLangue(code)
    setModalOuverte(false)
  }

  if (chargement) {
    return (
      <div style={{ minHeight: '100vh', background: '#090E1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(139,92,246,0.2)', borderTop: '3px solid #8B5CF6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}/>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#090E1A', paddingBottom: '100px', maxWidth: '430px', margin: '0 auto' }}>
      <style>{`
        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ padding: '52px 24px 16px' }}>
        <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '28px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 4px' }}>Apprendre</h1>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Choisis ta leçon du jour</p>
      </div>

      <div style={{ padding: '0 24px 20px' }}>
        <button onClick={() => setModalOuverte(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: 'rgba(139,92,246,0.08)', border: '1.5px solid rgba(139,92,246,0.4)', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 0 20px rgba(139,92,246,0.12)' }}>
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

      {chapitres.length === 0 ? (
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
          <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '17px', fontWeight: '800', color: '#FFFFFF', margin: '0 0 6px' }}>Aucune leçon disponible</p>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Les leçons en {langueActuelle.nom.toLowerCase()} arrivent bientôt !</p>
        </div>
      ) : (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {chapitres.map((chapitre) => {
            const leconsChap = lecons.filter((l) => l.chapitre_id === chapitre.id)
            const nbCompletes = leconsChap.filter((l) => idsCompletes.has(l.id)).length
            const pourcentage = leconsChap.length > 0 ? Math.round((nbCompletes / leconsChap.length) * 100) : 0

            return (
              <div key={chapitre.id}>
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: '700', color: '#A78BFA', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 2px' }}>Chapitre {chapitre.numero}</p>
                      <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '18px', fontWeight: '900', color: '#FFFFFF', margin: 0 }}>{chapitre.titre}</h2>
                    </div>
                    <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '10px', padding: '4px 10px' }}>
                      <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: '13px', fontWeight: '800', color: '#A78BFA' }}>{nbCompletes}/{leconsChap.length}</span>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px' }}>
                    <div style={{ height: '100%', width: `${pourcentage}%`, background: pourcentage === 100 ? '#58CC02' : 'linear-gradient(90deg, #8B5CF6, #A78BFA)', borderRadius: '99px', transition: 'width 0.6s ease' }}/>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {leconsChap.map((lecon) => {
                    const complete = idsCompletes.has(lecon.id)
                    const emoji = EMOJI_LECON[lecon.titre] || '📖'

                    return (
                      <div key={lecon.id} onClick={() => navigate(`/lesson?lecon=${lecon.id}`)} style={{ background: complete ? 'rgba(88,204,2,0.06)' : 'rgba(255,255,255,0.04)', border: complete ? '1px solid rgba(88,204,2,0.2)' : '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', transition: 'all 0.2s ease' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: complete ? 'rgba(88,204,2,0.12)' : 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{emoji}</div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '15px', fontWeight: '800', color: '#FFFFFF', margin: '0 0 3px' }}>{lecon.titre}</p>
                          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{lecon.nombre_mots} mots · ~{lecon.duree_minutes} min</p>
                        </div>
                        <div style={{ flexShrink: 0 }}>
                          {complete ? (
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #58CC02, #3DAD00)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M2.5 7 L6 10.5 L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          ) : (
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(139,92,246,0.15)', border: '1.5px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M3.5 2 L7.5 5 L3.5 8" stroke="#A78BFA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          )}
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

      {modalOuverte && (
        <ModalLangues codeActif={codeLangue} onChoisir={handleChoisirLangue} onFermer={() => setModalOuverte(false)} />
      )}

      <BottomNav />
    </div>
  )
}