/** Два сердечка с экрана входа */
export function Hearts({ className }: { className?: string }) {
  const heart = 'M0 -6 C-4 -14 -16 -12 -16 -2 C-16 7 -6 13 0 19 C6 13 16 7 16 -2 C16 -12 4 -14 0 -6 Z'
  return (
    <svg viewBox="0 0 140 80" className={className} fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <g transform="translate(58 38) rotate(-12) scale(1.45)">
        <path d={heart} fill="#eaf3fc" stroke="#7fb3e6" strokeWidth="1.6" />
      </g>
      <g transform="translate(82 44) rotate(12) scale(1.3)">
        <path d={heart} fill="#fcecf1" fillOpacity="0.85" stroke="#ec8fa9" strokeWidth="1.7" />
      </g>
      <path d="M22 36 h8 M24 50 l5 -4" stroke="#7fb3e6" strokeWidth="2" />
      <path d="M112 30 l5 -5 M114 40 h8" stroke="#ec8fa9" strokeWidth="2" />
    </svg>
  )
}
