// ─── SKELETON ───────────────────────────────────────────────────────
// Bloc gris arrondi avec un léger scintillement, affiché à la place du
// contenu pendant qu'il charge. Respecte la DA (fond nocturne, arrondis).
//
// Props : width, height, radius, style (surcharges), margin
export default function Skeleton({ width = '100%', height = 16, radius = 12, style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 37%, rgba(255,255,255,0.04) 63%)',
        backgroundSize: '400% 100%',
        animation: 'skeletonShimmer 1.4s ease-in-out infinite',
        ...style,
      }}
    >
      <style>{`
        @keyframes skeletonShimmer {
          0% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  )
}
