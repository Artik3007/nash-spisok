import { Check, Heart, LogOut, Pencil, Tags } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { InviteCard } from '../components/InviteCard'
import { Avatar, Button, ErrorText } from '../components/ui'
import { useAuth } from '../lib/auth'
import { ruError } from '../lib/errors'
import { supabase } from '../lib/supabase'

export function ProfilePage() {
  const { session, profile, partner, refresh } = useAuth()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile?.name ?? '')
  const [error, setError] = useState('')
  if (!profile) return null

  async function saveName() {
    const trimmed = name.trim()
    if (!trimmed) return setError('Имя не может быть пустым')
    const { error } = await supabase.from('profiles').update({ name: trimmed }).eq('id', profile!.id)
    if (error) return setError(ruError(error))
    setError('')
    setEditing(false)
    refresh()
  }

  return (
    <div className="space-y-5">
      <h1 className="pt-2 text-[30px] font-bold tracking-tight">Профиль</h1>

      <div className="flex items-center gap-4 rounded-3xl bg-white p-5 ring-1 ring-line">
        <Avatar name={profile.name} color={profile.color} size="lg" />
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={name}
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
                className="min-w-0 flex-1 rounded-xl bg-bg px-3 py-2 font-semibold outline-none ring-1 ring-line focus:ring-2 focus:ring-sky"
              />
              <button onClick={saveName} className="flex size-10 items-center justify-center rounded-full bg-sky-soft text-sky-ink" aria-label="Сохранить имя">
                <Check className="size-5" />
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="flex items-center gap-2 text-left text-xl font-bold">
              <span className="truncate">{profile.name}</span>
              <Pencil className="size-4 shrink-0 text-muted" />
            </button>
          )}
          <p className="mt-0.5 truncate text-sm text-muted">{session?.user.email}</p>
        </div>
      </div>
      <ErrorText>{error}</ErrorText>

      {partner ? (
        <div className="flex items-center gap-4 rounded-3xl bg-white p-5 ring-1 ring-line">
          <Avatar name={partner.name} color={partner.color} size="lg" />
          <div>
            <p className="text-sm text-muted">Вторая половинка</p>
            <p className="flex items-center gap-2 text-xl font-bold">
              {partner.name}
              <Heart className="size-4 fill-rose text-rose-ink" />
            </p>
          </div>
        </div>
      ) : (
        <InviteCard />
      )}

      <Link to="/categories" className="flex h-14 items-center gap-3 rounded-2xl bg-white px-5 font-semibold ring-1 ring-line">
        <Tags className="size-5 text-sky-ink" strokeWidth={1.6} />
        Управление категориями
      </Link>

      <Button variant="soft" onClick={() => supabase.auth.signOut()}>
        <LogOut className="size-5" strokeWidth={1.6} />
        Выйти
      </Button>
    </div>
  )
}
