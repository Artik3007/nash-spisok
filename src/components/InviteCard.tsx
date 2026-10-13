import { Check, Copy, Share2, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../lib/auth'

const HIDDEN_KEY = 'invite-card-hidden'

function isHidden() {
  try {
    return localStorage.getItem(HIDDEN_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Код приглашения — показываем, пока вторая половинка не присоединилась.
 * На главной его можно убрать крестиком, в профиле он остаётся всегда.
 */
export function InviteCard({ dismissible = false }: { dismissible?: boolean }) {
  const { couple } = useAuth()
  const [copied, setCopied] = useState(false)
  const [hidden, setHidden] = useState(() => dismissible && isHidden())
  if (!couple || hidden) return null

  function hide() {
    try {
      localStorage.setItem(HIDDEN_KEY, '1')
    } catch {
      /* без памяти браузера карточка просто скроется до перезапуска */
    }
    setHidden(true)
  }

  const text = `Присоединяйся к нашему списку! Код приглашения: ${couple.invite_code}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(couple!.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* буфер обмена недоступен — код и так виден на экране */
    }
  }

  return (
    <div className="relative rounded-3xl bg-white p-5 ring-1 ring-line">
      {dismissible && (
        <button onClick={hide} className="absolute top-2 right-2 flex size-10 items-center justify-center rounded-full text-muted active:bg-black/5" aria-label="Скрыть код">
          <X className="size-5" />
        </button>
      )}
      <p className="text-sm text-muted">Код для второй половинки</p>
      <p className="mt-1 font-mono text-3xl font-bold tracking-[0.25em] select-all">{couple.invite_code}</p>
      <p className="mt-2 text-sm text-muted">
        Его нужно ввести при регистрации, выбрав «У меня есть код».
        {dismissible && ' Если скрыть карточку, код останется во вкладке «Профиль».'}
      </p>
      <div className="mt-4 flex gap-2">
        <button onClick={copy} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-sky-soft text-sm font-semibold text-sky-ink">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? 'Скопировано' : 'Скопировать'}
        </button>
        {'share' in navigator && (
          <button
            onClick={() => navigator.share({ text }).catch(() => {})}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-rose-soft text-sm font-semibold text-rose-ink"
          >
            <Share2 className="size-4" />
            Отправить
          </button>
        )}
      </div>
    </div>
  )
}
