import { useState } from 'react'
import { useData } from '../lib/data'
import { ruError } from '../lib/errors'
import { todayISO } from '../lib/format'
import { supabase } from '../lib/supabase'
import type { Item } from '../lib/types'
import { Sheet } from './Sheet'
import { Stars } from './Stars'
import { Button, ErrorText } from './ui'

/** Перенос записи в «Были»: оценка и дата */
export function DoneSheet({ item, onClose, onDone }: { item: Item | null; onClose: () => void; onDone?: () => void }) {
  return (
    <Sheet open={!!item} onClose={onClose} title="Были! 🎉">
      {item && <DoneForm key={item.id} item={item} onClose={onClose} onDone={onDone} />}
    </Sheet>
  )
}

function DoneForm({ item, onClose, onDone }: { item: Item; onClose: () => void; onDone?: () => void }) {
  const { reload } = useData()
  const [rating, setRating] = useState<number | null>(item.rating)
  const [date, setDate] = useState(item.visited_on ?? todayISO())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setBusy(true)
    const { error } = await supabase
      .from('items')
      .update({ status: 'done', rating, visited_on: date || null })
      .eq('id', item.id)
    setBusy(false)
    if (error) return setError(ruError(error))
    await reload()
    onClose()
    onDone?.()
  }

  return (
    <div className="space-y-5">
      <p className="text-muted">«{item.title}»</p>
      <div>
        <p className="mb-2 text-sm font-semibold">Оценка</p>
        <Stars value={rating} onChange={setRating} size="lg" />
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">Когда были</span>
        <input
          type="date"
          value={date}
          max={todayISO()}
          onChange={(e) => setDate(e.target.value)}
          className="h-13 w-full rounded-2xl bg-bg px-4 ring-1 ring-line outline-none focus:ring-2 focus:ring-sky"
        />
      </label>
      <ErrorText>{error}</ErrorText>
      <Button onClick={save} busy={busy}>
        Сохранить
      </Button>
    </div>
  )
}
