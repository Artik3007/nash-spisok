import { Check, Copy, Share2 } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../lib/auth'

/** Код приглашения — показываем, пока вторая половинка не присоединилась */
export function InviteCard() {
  const { couple } = useAuth()
  const [copied, setCopied] = useState(false)
  if (!couple) return null

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
    <div className="rounded-3xl bg-white p-5 ring-1 ring-line">
      <p className="text-sm text-muted">Код для второй половинки</p>
      <p className="mt-1 font-mono text-3xl font-bold tracking-[0.25em] select-all">{couple.invite_code}</p>
      <p className="mt-2 text-sm text-muted">Его нужно ввести при регистрации, выбрав «У меня есть код».</p>
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
