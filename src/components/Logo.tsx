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
export function Logo({ size = 32, showText = false, className = '' }: LogoProps) {
  if (showText) {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <LogoIcon size={size} />
        <span className="font-bold text-xl text-gray-900">
          <span className="text-accent">ProjectHub</span>
          <span className="text-gray-400 font-normal ml-1.5">项目派</span>
        </span>
      </div>
    )
  }

  return <LogoIcon size={size} className={className} />
}

export function LogoIcon({ size = 32, className = '', ...props }: LogoIconProps) {
  const hexSize = size
  const cx = hexSize / 2
  const cy = hexSize / 2
  const r = (hexSize / 2) * 0.88

  // Hexagon points (flat-topped)
  const angle = Math.PI / 3
  const points = Array.from({ length: 6 }, (_, i) => {
    const a = angle * i - Math.PI / 6
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
  }).join(' ')

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
        <linearGradient id="logoGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
      </defs>

      {/* Outer hexagon */}
      <polygon
        points={points}
        fill="url(#logoGradient)"
      />

      {/* Inner hexagon (subtle) */}
      <polygon
        points={Array.from({ length: 6 }, (_, i) => {
          const a = (Math.PI / 3) * i - Math.PI / 6
          return `${cx + r * 0.72 * Math.cos(a)},${cy + r * 0.72 * Math.sin(a)}`
        }).join(' ')}
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth={hexSize < 24 ? 0.5 : 1}
      />

      {/* Stylized "派" / "P" mark */}
      <g transform={`scale(${hexSize / 32})`}>
        {/* Outer arc - top part of 派's "pie" radical */}
        <path
          d={`
            M 16 8
            C 12 8, 9 10.5, 9 14
            L 9 16
            L 11.5 16
            C 11.5 13.5, 13.5 11.5, 16 11.5
            C 18.5 11.5, 20.5 13.5, 20.5 16
            L 23 16
            L 23 14
            C 23 10.5, 20 8, 16 8
            Z
          `}
          fill="white"
          fillOpacity="0.95"
        />
        {/* Vertical stroke - the "pie" radical's vertical bar */}
        <rect
          x="13.5"
          y="15.5"
          width="2"
          height="7"
          rx="1"
          fill="white"
          fillOpacity="0.95"
        />
        {/* Right arc - the "pai" radical's enclosed space */}
        <path
          d={`
            M 21 14
            C 21 17.5, 19 19.5, 16 19.5
            C 13 19.5, 11 17.5, 11 14
            L 21 14
            Z
          `}
          fill="white"
          fillOpacity="0.95"
        />
        {/* Bottom stroke of "pai" radical */}
        <rect
          x="11"
          y="18.5"
          width="10"
          height="2"
          rx="1"
          fill="white"
          fillOpacity="0.95"
        />
      </g>

      {/* Subtle dot accent (AI/tech element) */}
      <circle
        cx={cx + r * 0.55}
        cy={cy - r * 0.55}
        r={hexSize < 24 ? 0.8 : 1.2}
        fill="rgba(255,255,255,0.6)"
      />
    </svg>
  )
}

export default Logo
