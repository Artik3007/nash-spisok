import { KeyRound, Lock, Mail, User } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button, cx, ErrorText, Field } from '../components/ui'
import { useAuth } from '../lib/auth'
import { ruError } from '../lib/errors'
import { supabase } from '../lib/supabase'
import type { PersonColor } from '../lib/types'
import { PasswordToggle } from './LoginPage'

type Mode = 'create' | 'join'

/**
 * Регистрация + создание пары или вход в пару по коду.
 * Если человек уже вошёл, но пару не настроил (например, ошибся в коде),
 * этот же экран показывается без полей почты и пароля.
 */
export function RegisterPage() {
  const { session, refresh } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [mode, setMode] = useState<Mode>('create')
  const [color, setColor] = useState<PersonColor>('blue')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Введите имя')
    if (mode === 'join' && code.trim().length < 6) return setError('Введите код приглашения из 6 символов')

    setBusy(true)
    try {
      if (!session) {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
        if (error) throw error
        if (!data.session) {
          throw new Error('Почта не подтверждена. Выключите «Confirm email» в настройках Supabase')
        }
      }
      const { error } =
        mode === 'create'
          ? await supabase.rpc('create_couple', { p_name: name.trim(), p_color: color })
          : await supabase.rpc('join_couple', { p_name: name.trim(), p_code: code.trim() })
      if (error) throw error
      await refresh()
    } catch (err) {
      setError(ruError(err))
      setBusy(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto overscroll-contain">
      <form
        onSubmit={submit}
        className="mx-auto max-w-md space-y-5 px-6 pt-[calc(env(safe-area-inset-top)+40px)] pb-[calc(env(safe-area-inset-bottom)+32px)]"
      >
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">{session ? 'Настроим пару' : 'Регистрация'}</h1>
          <p className="mt-1 text-muted">
            {session ? `Вы вошли как ${session.user.email}` : 'У каждого из вас свой аккаунт'}
          </p>
        </div>

        {!session && (
          <div className="space-y-3">
            <Field icon={Mail} type="email" inputMode="email" autoComplete="email" placeholder="Почта" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Field
              icon={Lock}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Пароль (от 6 символов)"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              right={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
            />
          </div>
        )}

        <Field icon={User} placeholder="Ваше имя" autoComplete="given-name" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />

        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/[0.04] p-1">
          {(
            [
              ['create', 'Создаю пару'],
              ['join', 'У меня есть код'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={cx('h-11 rounded-xl text-sm font-semibold transition', mode === value ? 'bg-sky text-ink shadow-sm' : 'text-muted')}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'create' ? (
          <div>
            <p className="mb-2 text-sm font-semibold">Ваш цвет</p>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ['blue', 'Голубой', 'bg-sky-soft ring-sky', 'bg-sky'],
                  ['pink', 'Розовый', 'bg-rose-soft ring-rose', 'bg-rose'],
                ] as const
              ).map(([value, label, box, dot]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setColor(value)}
                  className={cx('flex h-13 items-center justify-center gap-2 rounded-2xl font-semibold transition', box, color === value ? 'ring-2' : 'ring-0 opacity-70')}
                >
                  <span className={cx('size-4 rounded-full', dot)} />
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted">
              После регистрации вы получите код. Отправьте его второй половинке — его нужно будет ввести при регистрации.
            </p>
          </div>
        ) : (
          <div>
            <Field
              icon={KeyRound}
              placeholder="Код приглашения"
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              className="[&_input]:tracking-[0.3em] [&_input]:uppercase"
            />
            <p className="mt-3 text-sm text-muted">Код можно найти в приложении у второй половинки, во вкладке «Профиль».</p>
          </div>
        )}

        <ErrorText>{error}</ErrorText>

        <Button type="submit" busy={busy}>
          {session ? 'Готово' : 'Зарегистрироваться'}
        </Button>

        {session ? (
          <button type="button" onClick={() => supabase.auth.signOut()} className="mx-auto block text-sm text-muted">
            Выйти из аккаунта
          </button>
        ) : (
          <p className="text-center text-sm text-muted">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="font-semibold text-sky-ink">
              Войти
            </Link>
          </p>
        )}
      </form>
    </div>
  )
}
