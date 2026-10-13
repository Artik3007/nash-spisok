import { X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../lib/data'
import { plural } from '../lib/format'

const QUIET_DAYS = 30 // давно ничего не отмечали «Были»
const MANY_WANTS = 15 // много записей в «Хотим»
const HIDE_DAYS = 7 // если закрыли плашку — не показываем неделю
const STORAGE_KEY = 'reminder-hidden-until'

const DAY = 24 * 60 * 60 * 1000

function hiddenUntil(): number {
  try {
    return Number(localStorage.getItem(STORAGE_KEY)) || 0
  } catch {
    return 0
  }
}

/** Мягкое напоминание на главной */
export function Reminder() {
  const { items } = useData()
  const [hidden, setHidden] = useState(() => hiddenUntil() > Date.now())

  const wants = items.filter((i) => i.status === 'want')
  if (hidden || wants.length === 0) return null

  const lastDone = Math.max(0, ...items.filter((i) => i.done_at).map((i) => Date.parse(i.done_at!)))
  const firstAdded = Math.min(...items.map((i) => Date.parse(i.created_at)))
  const quietSince = lastDone || firstAdded
  const quietDays = Math.floor((Date.now() - quietSince) / DAY)

  let text: string
  if (quietDays > QUIET_DAYS) {
    text = lastDone
      ? `Вы уже ${quietDays} ${plural(quietDays, 'день', 'дня', 'дней')} ничего не отмечали «Были». Может, устроим что-нибудь на этой неделе?`
      : 'Вы ещё ничего не отметили «Были». Самое время выбрать первое!'
  } else if (wants.length >= MANY_WANTS) {
    text = `В «Хотим» уже ${wants.length} ${plural(wants.length, 'запись', 'записи', 'записей')}. Давайте выберем что-нибудь одно?`
  } else {
    return null
  }

  function hide() {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now() + HIDE_DAYS * DAY))
    } catch {
      /* без памяти браузера плашка просто скроется до перезапуска */
    }
    setHidden(true)
  }

  return (
    <div className="relative rounded-3xl bg-gradient-to-br from-sky-soft to-rose-soft p-4 pr-11">
      <button onClick={hide} className="absolute top-2 right-2 flex size-9 items-center justify-center rounded-full text-muted active:bg-black/5" aria-label="Скрыть">
        <X className="size-4" />
      </button>
      <p className="text-[15px] leading-snug">💌 {text}</p>
      <Link to="/random" className="mt-3 inline-flex h-9 items-center rounded-full bg-white px-4 text-sm font-semibold text-sky-ink">
        Выбрать вместе
      </Link>
    </div>
  )
}
