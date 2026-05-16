import { useState } from 'react'

export default function LeconThumbnail({
  imageUrl,
  size = 40,
  borderRadius = 10,
  alt = '',
  objectFit = 'cover',
  fill = false,
}) {
  const [erreurImage, setErreurImage] = useState(false)

  const afficherPlaceholder = !imageUrl || erreurImage

  const dimensionStyle = fill
    ? { width: '100%', height: '100%' }
    : { width: size + 'px', height: size + 'px' }

  if (afficherPlaceholder) {
    return (
      <div
        aria-hidden="true"
        style={{
          ...dimensionStyle,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          border: '0.5px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
        }}
      />
    )
  }

  const fondImage = objectFit === 'contain' ? 'transparent' : 'rgba(255,255,255,0.04)'

  return (
    <img
      src={imageUrl}
      alt={alt}
      loading="lazy"
      onError={() => setErreurImage(true)}
      style={{
        ...dimensionStyle,
        borderRadius: borderRadius + 'px',
        objectFit,
        background: fondImage,
        border: objectFit === 'contain' ? 'none' : '0.5px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
        display: 'block',
      }}
    />
  )
}
