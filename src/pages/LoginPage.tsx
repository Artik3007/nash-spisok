import { Eye, EyeOff, Heart, Lock, Mail } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Hearts } from '../components/Hearts'
import { Button, ErrorText, Field } from '../components/ui'
import { useAuth } from '../lib/auth'
import { ruError } from '../lib/errors'
import { supabase } from '../lib/supabase'

export function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  const Icon = shown ? EyeOff : Eye
  return (
    <button type="button" onClick={onToggle} className="p-1 text-muted" aria-label={shown ? 'Скрыть пароль' : 'Показать пароль'}>
      <Icon className="size-5" strokeWidth={1.6} />
    </button>
  )
}

export function LoginPage() {
  const { session, profile, profileChecked } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Вошли, но пара ещё не настроена — отправляем на настройку пары
  useEffect(() => {
    if (session && profileChecked && !profile) navigate('/register', { replace: true })
  }, [session, profile, profileChecked, navigate])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) setError(ruError(error))
  }

  return (
    <div className="h-full overflow-y-auto overscroll-contain">
      <form
        onSubmit={submit}
        className="mx-auto flex min-h-full max-w-md flex-col px-6 pt-[calc(env(safe-area-inset-top)+12vh)] pb-[calc(env(safe-area-inset-bottom)+24px)]"
      >
        <h1 className="text-center text-[34px] font-bold tracking-tight">Наш список</h1>
        <Hearts className="mx-auto mt-6 mb-10 h-20" />

        <div className="space-y-4">
          <Field icon={Mail} type="email" inputMode="email" autoComplete="email" placeholder="Почта" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Field
            icon={Lock}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            right={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
          />
          <ErrorText>{error}</ErrorText>
          <Button type="submit" busy={busy} className="mt-2">
            Войти
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Ещё нет аккаунта?{' '}
          <Link to="/register" className="font-semibold text-sky-ink">
            Зарегистрироваться
          </Link>
        </p>

        <div className="mt-auto pt-10">
          <Heart className="mx-auto size-6 text-muted/70" strokeWidth={1.5} />
        </div>
      </form>
    </div>
  )
}
