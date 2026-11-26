import { useState, type ImgHTMLAttributes } from 'react'

interface ImageWithSkeletonProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  wrapperClassName?: string
}

/** Image that shows a soft pulsing placeholder until it finishes loading. */
export default function ImageWithSkeleton({
  src,
  alt,
  wrapperClassName = '',
  className = '',
  ...rest
}: ImageWithSkeletonProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-brand-sand/70" aria-hidden="true" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`${className} transition-opacity duration-700 ease-out ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...rest}
      />
    </div>
  )
}
