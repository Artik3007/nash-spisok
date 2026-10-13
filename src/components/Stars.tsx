import { Star } from 'lucide-react'
import { cx } from './ui'

/** Оценка 1–5. Если передать onChange — звёзды можно нажимать */
export function Stars({ value, onChange, size = 'sm' }: { value: number | null; onChange?: (v: number | null) => void; size?: 'sm' | 'lg' }) {
  return (
    <div className={cx('flex', size === 'lg' ? 'gap-2' : 'gap-0.5')}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (value ?? 0) >= n
        const star = (
          <Star
            className={cx(size === 'lg' ? 'size-9' : 'size-3.5', filled ? 'fill-amber-300 text-amber-400' : 'text-line')}
            strokeWidth={1.6}
          />
        )
        return onChange ? (
          <button key={n} type="button" onClick={() => onChange(value === n ? null : n)} aria-label={`Оценка ${n}`}>
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        )
      })}
    </div>
  )
}
