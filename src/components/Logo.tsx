import type { SVGProps } from 'react'

interface LogoProps {
  size?: number
  showText?: boolean
  className?: string
}

interface LogoIconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

/**
 * ProjectHub Logo
 *
 * Design concept:
 * - Hexagon shape (AI/tech/connection symbolism)
 * - "派" Chinese character stylized inside
 * - Gradient from indigo to purple for AI feel
 * - Clean, modern, scalable
 *
 * Usage:
 *   <Logo /> - icon only
 *   <Logo showText /> - icon + text
 *   <Logo size={24} />
 */
export function Logo({ size = 48, showText = false, className = '' }: LogoProps) {
  if (showText) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <LogoIcon size={size} />
        <span className="font-bold text-xl text-gray-900">
          <span className="text-accent">ProjectHub</span>
          <span className="text-gray-600 font-normal ml-1.5">项目派</span>
        </span>
      </div>
    )
  }

  return <LogoIcon size={size} className={className} />
}

export function LogoIcon({ size = 48, className = '', ...props }: LogoIconProps) {
  const hexSize = size
  const cx = hexSize / 2
  const cy = hexSize / 2
  const r = (hexSize / 2) * 0.9

  // Hexagon points (flat-topped)
  const angle = Math.PI / 3
  const points = Array.from({ length: 6 }, (_, i) => {
    const a = angle * i - Math.PI / 6
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
  }).join(' ')

  const scale = hexSize / 48

  return (
    <svg
      width={hexSize}
      height={hexSize}
      viewBox={`0 0 ${hexSize} ${hexSize}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
      </defs>

      {/* Outer hexagon */}
      <polygon points={points} fill="url(#logoGradient)" />

      {/* Inner hexagon ring (subtle border) */}
      <polygon
        points={Array.from({ length: 6 }, (_, i) => {
          const a = (Math.PI / 3) * i - Math.PI / 6
          return `${cx + r * 0.75 * Math.cos(a)},${cy + r * 0.75 * Math.sin(a)}`
        }).join(' ')}
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth={1.5 * scale}
      />

      {/* Simplified "派" mark - bold geometric P shape */}
      <g transform={`scale(${scale})`}>
        {/* Outer ring of P */}
        <path
          d={`
            M 17 9
            C 12 9, 8 12.5, 8 16
            C 8 19.5, 11 22.5, 15 23
            L 15 17
            L 13 17
            C 11.5 17, 10.5 16, 10.5 14
            C 10.5 12, 11.5 11, 13 11
            L 17 11
            L 17 9
            Z
          `}
          fill="white"
        />
        {/* Vertical stem */}
        <rect
          x="15"
          y="10.5"
          width="2.5"
          height="12.5"
          rx="1.25"
          fill="white"
        />
        {/* Top horizontal bar */}
        <rect
          x="15"
          y="9"
          width="8"
          height="2.5"
          rx="1.25"
          fill="white"
        />
        {/* Right vertical of P loop */}
        <rect
          x="21"
          y="9"
          width="2.5"
          height="8.5"
          rx="1.25"
          fill="white"
        />
        {/* Bottom curve of P loop */}
        <rect
          x="15"
          y="15"
          width="8.5"
          height="2.5"
          rx="1.25"
          fill="white"
        />
      </g>
    </svg>
  )
}

export default Logo
