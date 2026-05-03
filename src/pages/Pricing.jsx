import { useNavigate } from 'react-router-dom'
import Neuri3D from '../components/Neuri3D'

function Check({ color = '#55D600' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="7" cy="7" r="6" fill="rgba(85,214,0,0.15)" stroke={color} strokeWidth="1.2"/>
      <path d="M4.5 7L6.5 9L9.5 5.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function PricingCard({ title, subtitle, price, priceUnit, priceSub, features, ctaLabel, ctaColor, popular, badge, accentColor, onCta }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: popular ? `2px solid ${accentColor}` : '1px solid rgba(255,255,255,0.07)',
      borderRadius: 22, padding: 24, marginBottom: 16,
      position: 'relative'
    }}>
      {badge && (
        <div style={{
          position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
          background: accentColor, padding: '6px 14px', borderRadius: 20,
          fontSize: 12, fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap'
        }}>{badge}</div>
      )}
      <h3 style={{ fontSize: 20, fontWeight: 900, color: popular ? accentColor : '#FFFFFF', textAlign: 'center', margin: '8px 0 4px', letterSpacing: '0.04em' }}>{title}</h3>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: '0 0 16px' }}>{subtitle}</p>

      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 36, fontWeight: 900, color: popular ? accentColor : '#FFFFFF' }}>{price}</span>
        {priceUnit && <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginLeft: 4 }}>{priceUnit}</span>}
      </div>
      {priceSub && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: '0 0 20px' }}>{priceSub}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Check />
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{f}</span>
          </div>
        ))}
      </div>

      <button onClick={onCta} style={{
        width: '100%', height: 50, borderRadius: 14, border: popular ? 'none' : '1px solid rgba(255,255,255,0.2)',
        background: ctaColor || 'transparent', color: '#FFFFFF',
        fontSize: 15, fontWeight: 800, cursor: 'pointer'
      }}>{ctaLabel}</button>
    </div>
  )
}

function ReassuranceCard({ icon, title, sub, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: 14, textAlign: 'center', flex: 1
    }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
        {icon}
      </div>
      <p style={{ fontSize: 12, fontWeight: 800, color, margin: '0 0 2px' }}>{title}</p>
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.4 }}>{sub}</p>
    </div>
  )
}

export default function Pricing() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: '#080D18', paddingBottom: 60, maxWidth: 430, margin: '0 auto', fontFamily: "'DM Sans', sans-serif" }}>

      {/* HEADER */}
      <div style={{ padding: '52px 20px 16px' }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, width: 38, height: 38, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '0.01em', lineHeight: 1.2 }}>PRICING & STRATÉGIE D'OFFRE</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '8px 0 0', lineHeight: 1.4 }}>
              Une offre simple, juste et pensée pour tous les cerveaux.
            </p>
          </div>
          <div style={{ width: 80, height: 80, marginLeft: 12, flexShrink: 0 }}>
            <Neuri3D color="#8B5CF6" />
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 16px 0' }}>

        {/* GRATUIT */}
        <PricingCard
          title="GRATUIT"
          subtitle="Pour découvrir NeuroLingo"
          price="0€"
          priceSub="pour toujours"
          features={[
            "Leçons limitées chaque jour",
            "Neuri en mode basique",
            "Audio standard",
            "Progression de base",
            "1 langue disponible"
          ]}
          ctaLabel="Continuer gratuitement"
          accentColor="#FFFFFF"
          onCta={() => navigate('/dashboard')}
        />

        {/* PREMIUM */}
        <div style={{ marginTop: 30 }}>
          <PricingCard
            title="PREMIUM"
            subtitle="Pour progresser sans limites"
            price="6,99 €"
            priceUnit="/ mois"
            priceSub="ou 59,99 € / an (-28%)"
            features={[
              "Leçons illimitées",
              "Neuri interactif & plus présent",
              "Audio avancé & personnalisation",
              "Statistiques détaillées",
              "Toutes les langues",
              "Mode focus & personnalisation avancée",
              "Contenus exclusifs",
              "Support prioritaire"
            ]}
            ctaLabel="Choisir Premium"
            ctaColor="#8B5CF6"
            popular
            badge="🔥 Le plus populaire"
            accentColor="#8B5CF6"
            onCta={() => console.log('Choose Premium placeholder')}
          />
        </div>

        {/* PREMIUM FAMILLE */}
        <PricingCard
          title="PREMIUM FAMILLE"
          subtitle="Pour apprendre en famille"
          price="9,99 €"
          priceUnit="/ mois"
          priceSub="Jusqu'à 6 profils"
          features={[
            "Tout ce qui est inclus dans Premium",
            "Jusqu'à 6 membres",
            "Suivi des progrès par profil",
            "Partage de l'abonnement"
          ]}
          ctaLabel="Choisir Famille"
          accentColor="#FFFFFF"
          onCta={() => console.log('Choose Famille placeholder')}
        />

        {/* RÉASSURANCE */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
          <ReassuranceCard
            icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2 L15 5 L15 10 C15 13 12 16 9 17 C6 16 3 13 3 10 L3 5 Z" stroke="#A78BFA" strokeWidth="1.5" fill="none"/></svg>}
            title="Sans engagement" sub="Annule quand tu veux." color="#A78BFA"
          />
          <ReassuranceCard
            icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="4" y="8" width="10" height="8" rx="1.5" stroke="#A78BFA" strokeWidth="1.5" fill="none"/><path d="M6 8 V5.5 C6 3.5 7.5 2 9 2 C10.5 2 12 3.5 12 5.5 V8" stroke="#A78BFA" strokeWidth="1.5" fill="none"/></svg>}
            title="Sécurisé" sub="Paiement 100% sécurisé via l'App Store." color="#A78BFA"
          />
          <ReassuranceCard
            icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 16 C5 13 2 10 2 6.5 C2 4 4 2 6 2 C7.5 2 9 3 9 4.5 C9 3 10.5 2 12 2 C14 2 16 4 16 6.5 C16 10 13 13 9 16 Z" stroke="#A78BFA" strokeWidth="1.5" fill="none"/></svg>}
            title="Accessible" sub="Un prix juste pour un impact réel." color="#A78BFA"
          />
          <ReassuranceCard
            icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="8" r="5" stroke="#A78BFA" strokeWidth="1.5" fill="none"/><path d="M6 12 L5 17 L9 15 L13 17 L12 12" stroke="#A78BFA" strokeWidth="1.5" fill="none" strokeLinejoin="round"/></svg>}
            title="Satisfaction garantie" sub="7 jours pour essayer et changer d'avis." color="#A78BFA"
          />
        </div>

        {/* CTA FINAL */}
        <div style={{
          background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: 20, padding: 20, marginTop: 24,
          display: 'flex', alignItems: 'center', gap: 14
        }}>
          <div style={{ width: 60, height: 60, flexShrink: 0 }}>
            <Neuri3D color="#8B5CF6" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#A78BFA', margin: '0 0 4px' }}>Déjà convaincu ?</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '0 0 10px', lineHeight: 1.4 }}>
              Passe à Premium et débloque tout le potentiel de NeuroLingo.
            </p>
            <button onClick={() => console.log('Final upgrade placeholder')} style={{
              width: '100%', height: 42, borderRadius: 12, border: 'none',
              background: '#55D600', color: '#FFFFFF', fontSize: 14, fontWeight: 800, cursor: 'pointer'
            }}>Passer à Premium</button>
          </div>
        </div>

      </div>
    </div>
  )
}