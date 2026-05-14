import { useState } from 'react'

export default function LeconThumbnail({ imageUrl, size = 40, borderRadius = 10, alt = '' }) {
  const [erreurImage, setErreurImage] = useState(false)

  const afficherPlaceholder = !imageUrl || erreurImage

  if (afficherPlaceholder) {
    return (
      <div
        aria-hidden="true"
        style={{
          width: size + 'px',
          height: size + 'px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          border: '0.5px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
        }}
      />
    )
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      loading="lazy"
      onError={() => setErreurImage(true)}
      style={{
        width: size + 'px',
        height: size + 'px',
        borderRadius: borderRadius + 'px',
        objectFit: 'cover',
        background: 'rgba(255,255,255,0.04)',
        border: '0.5px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
        display: 'block',
      }}
    />
  )
}
