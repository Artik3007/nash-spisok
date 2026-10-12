import { ChevronLeft, type LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'soft' | 'ghost' | 'danger'
  busy?: boolean
}

export function Button({ variant = 'primary', busy, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || busy}
      className={cx(
        'flex h-13 w-full items-center justify-center gap-2 rounded-2xl px-5 text-[16px] font-semibold transition active:scale-[0.98] disabled:opacity-60',
        variant === 'primary' && 'bg-sky text-ink shadow-[0_6px_20px_-8px_rgba(80,150,220,0.6)]',
        variant === 'soft' && 'bg-white text-ink ring-1 ring-line',
        variant === 'ghost' && 'text-muted',
        variant === 'danger' && 'bg-rose-soft text-rose-ink',
        className,
      )}
    >
      {busy ? <Spinner /> : children}
    </button>
  )
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  icon?: LucideIcon
  label?: string
  right?: ReactNode
}

export function Field({ icon: Icon, label, right, className, ...rest }: FieldProps) {
  return (
    <label className={cx('block', className)}>
      {label && <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>}
      <span className="flex h-13 items-center gap-3 rounded-2xl bg-white px-4 ring-1 ring-line focus-within:ring-2 focus-within:ring-sky">
        {Icon && <Icon className="size-5 shrink-0 text-muted" strokeWidth={1.6} />}
        <input {...rest} className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted/80" />
        {right}
      </span>
    </label>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cx('inline-block size-5 animate-spin rounded-full border-2 border-current border-t-transparent', className)}
      aria-label="Загрузка"
    />
  )
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null
  return <p className="rounded-xl bg-rose-soft px-4 py-3 text-sm text-rose-ink">{children}</p>
}

/** Экран без нижней панели: стрелка «назад» и заголовок по центру */
export function SubPage({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="flex h-full flex-col">
      <header className="relative flex shrink-0 items-center justify-center px-5 pt-[calc(env(safe-area-inset-top)+12px)] pb-3">
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          className="absolute bottom-2 left-3 flex size-10 items-center justify-center rounded-full active:bg-black/5"
          aria-label="Назад"
        >
          <ChevronLeft className="size-6" strokeWidth={1.8} />
        </button>
        <h1 className="max-w-[70%] truncate text-xl font-semibold">{title}</h1>
      </header>
      <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-5 pb-[calc(env(safe-area-inset-bottom)+24px)]">
        {children}
      </main>
      {footer}
    </div>
  )
}

export function FullScreenLoader() {
  return (
    <div className="flex h-full items-center justify-center text-sky-ink">
      <Spinner className="size-8" />
    </div>
  )
}

/** Кружок с первой буквой имени */
export function Avatar({ name, color, size = 'sm' }: { name: string; color: 'blue' | 'pink'; size?: 'sm' | 'lg' }) {
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold',
        size === 'sm' ? 'size-7 text-xs' : 'size-16 text-2xl',
        color === 'blue' ? 'bg-sky-soft text-sky-ink' : 'bg-rose-soft text-rose-ink',
      )}
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}
