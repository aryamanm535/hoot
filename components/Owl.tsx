"use client"

export type OwlPose = "idle" | "cheer" | "think"

type Props = {
  pose?: OwlPose
  size?: number
  className?: string
}

/**
 * Friendly owl tutor — stylized SVG illustration with three poses.
 * Colors tuned to match the dark UI palette (emerald accent on wings/brow).
 */
export default function Owl({ pose = "idle", size = 96, className }: Props) {
  const eyeShiftY = pose === "think" ? -1.6 : 0
  const eyeShiftX = pose === "think" ? -2.2 : 0
  const browAngle = pose === "cheer" ? -12 : pose === "think" ? 6 : 0
  const mouthPath =
    pose === "cheer"
      ? "M42 64 Q50 72 58 64"
      : pose === "think"
      ? "M46 66 Q50 64 54 66"
      : "M46 66 Q50 68 54 66"
  const wingLift = pose === "cheer" ? -6 : 0

  return (
    <svg
      viewBox="0 0 100 110"
      width={size}
      height={(size * 110) / 100}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={`Owl tutor (${pose})`}
    >
      <defs>
        <linearGradient id="owl-body" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#4b5563" />
          <stop offset="60%" stopColor="#1f2937" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="owl-belly" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <radialGradient id="owl-eye-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Branch shadow */}
      <ellipse cx="50" cy="104" rx="24" ry="3" fill="#000" opacity="0.35" />

      {/* Feet */}
      <g stroke="#fbbf24" strokeWidth="2" strokeLinecap="round">
        <line x1="42" y1="95" x2="42" y2="102" />
        <line x1="58" y1="95" x2="58" y2="102" />
        <line x1="39" y1="102" x2="45" y2="102" />
        <line x1="55" y1="102" x2="61" y2="102" />
      </g>

      {/* Body */}
      <ellipse cx="50" cy="62" rx="32" ry="34" fill="url(#owl-body)" />
      {/* Belly */}
      <ellipse cx="50" cy="68" rx="18" ry="22" fill="url(#owl-belly)" opacity="0.92" />
      {/* Feather chest speckle */}
      <g fill="#cbd5e1" opacity="0.55">
        <circle cx="44" cy="70" r="1.2" />
        <circle cx="50" cy="74" r="1.2" />
        <circle cx="56" cy="70" r="1.2" />
        <circle cx="47" cy="80" r="1" />
        <circle cx="53" cy="80" r="1" />
      </g>

      {/* Wings */}
      <g transform={`translate(0, ${wingLift})`}>
        <path
          d="M22 58 Q18 78 36 84 Q30 70 32 56 Z"
          fill="#0b1220"
          stroke="#10b981"
          strokeOpacity="0.35"
          strokeWidth="1"
        />
        <path
          d="M78 58 Q82 78 64 84 Q70 70 68 56 Z"
          fill="#0b1220"
          stroke="#10b981"
          strokeOpacity="0.35"
          strokeWidth="1"
        />
      </g>

      {/* Ear tufts */}
      <path d="M26 30 L30 18 L36 30 Z" fill="#1f2937" />
      <path d="M74 30 L70 18 L64 30 Z" fill="#1f2937" />

      {/* Eye discs */}
      <circle cx="40" cy="48" r="11" fill="#f8fafc" />
      <circle cx="60" cy="48" r="11" fill="#f8fafc" />
      {/* Eye glow */}
      <circle cx="40" cy="48" r="13" fill="url(#owl-eye-glow)" />
      <circle cx="60" cy="48" r="13" fill="url(#owl-eye-glow)" />
      {/* Pupils */}
      <circle cx={40 + eyeShiftX} cy={48 + eyeShiftY} r={pose === "cheer" ? 3 : 4.5} fill="#0b1220" />
      <circle cx={60 + eyeShiftX} cy={48 + eyeShiftY} r={pose === "cheer" ? 3 : 4.5} fill="#0b1220" />
      {pose === "cheer" ? (
        <g stroke="#0b1220" strokeWidth="1.8" strokeLinecap="round" fill="none">
          <path d="M33 48 Q40 44 47 48" />
          <path d="M53 48 Q60 44 67 48" />
        </g>
      ) : (
        <>
          <circle cx={38 + eyeShiftX} cy={46 + eyeShiftY} r="1.2" fill="#f8fafc" />
          <circle cx={58 + eyeShiftX} cy={46 + eyeShiftY} r="1.2" fill="#f8fafc" />
        </>
      )}

      {/* Brows */}
      <g stroke="#10b981" strokeWidth="2" strokeLinecap="round" fill="none">
        <path
          d={`M30 ${38 - browAngle * 0.2} Q40 ${34 - browAngle * 0.4} 48 ${
            38 + browAngle * 0.2
          }`}
        />
        <path
          d={`M52 ${38 + browAngle * 0.2} Q60 ${34 - browAngle * 0.4} 70 ${
            38 - browAngle * 0.2
          }`}
        />
      </g>

      {/* Beak */}
      <path d="M46 56 L50 62 L54 56 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="0.5" />

      {/* Mouth */}
      <path d={mouthPath} stroke="#0b1220" strokeWidth="1.4" fill="none" strokeLinecap="round" />

      {/* Cheer sparkles */}
      {pose === "cheer" ? (
        <g fill="#fbbf24">
          <circle cx="18" cy="28" r="1.6" />
          <circle cx="84" cy="24" r="1.6" />
          <circle cx="14" cy="60" r="1.2" />
          <circle cx="88" cy="62" r="1.2" />
        </g>
      ) : null}

      {/* Think bubble */}
      {pose === "think" ? (
        <g fill="#94a3b8">
          <circle cx="80" cy="20" r="2" />
          <circle cx="86" cy="14" r="3" />
          <circle cx="94" cy="8" r="4.2" />
        </g>
      ) : null}
    </svg>
  )
}
