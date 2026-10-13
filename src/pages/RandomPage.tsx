import { Check, ExternalLink, MapPin, Shuffle } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { DoneSheet } from '../components/DoneSheet'
import { Avatar, Button, cx } from '../components/ui'
import { useData } from '../lib/data'
import { yandexMapsUrl } from '../lib/format'
import { CategoryIcon } from '../lib/icons'
import { useAuthor } from '../lib/people'
import { usePhotoUrls } from '../lib/photos'
import type { Item } from '../lib/types'

function pickRandom(list: Item[], exceptId?: string): string | null {
  const pool = list.length > 1 ? list.filter((i) => i.id !== exceptId) : list
  if (!pool.length) return null
  return pool[Math.floor(Math.random() * pool.length)].id
}

export function RandomPage() {
  const { categories, items } = useData()
  const author = useAuthor()
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [doneItem, setDoneItem] = useState<Item | null>(null)
  const [spin, setSpin] = useState(() => Math.floor(Math.random() * 1e9))

  const pool = items.filter((i) => i.status === 'want' && (!categoryId || i.category_id === categoryId))
  // если выбранной записи больше нет в «Хотим» (например, отметили «Были») — берём новую
  const current = pool.find((i) => i.id === pickedId) ?? pool.find((i) => i.id === pickRandomStable(pool, spin)) ?? null
  const category = current && categories.find((c) => c.id === current.category_id)
  const who = current && author(current.created_by)
  const urls = usePhotoUrls(current?.photos.slice(0, 1) ?? [])

  function another() {
    setPickedId(pickRandom(pool, current?.id))
    setSpin((n) => n + 1)
  }

  function choose(id: string | null) {
    setCategoryId(id)
    setPickedId(null)
    setSpin((n) => n + 1)
  }

  return (
    <div className="space-y-5">
      <h1 className="pt-2 text-[30px] leading-tight font-bold tracking-tight">Что выбрать сегодня?</h1>

      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
        <Chip active={!categoryId} onClick={() => choose(null)}>
          Все
        </Chip>
        {categories.map((c) => (
          <Chip key={c.id} active={categoryId === c.id} onClick={() => choose(c.id)}>
            <CategoryIcon icon={c.icon} className="size-4" />
            {c.name}
          </Chip>
        ))}
      </div>

      {current ? (
        <>
          <Link key={current.id} to={`/item/${current.id}`} className="block animate-[fade_.3s_ease-out] overflow-hidden rounded-3xl bg-white ring-1 ring-line">
            {current.photos.length > 0 && (
              <div className="aspect-[4/3] bg-bg">{urls[current.photos[0]] && <img src={urls[current.photos[0]]} alt="" className="size-full object-cover" />}</div>
            )}
            <div className="space-y-2 p-5">
              <div className="flex items-start gap-3">
                <p className="min-w-0 flex-1 text-xl leading-snug font-bold break-words">{current.title}</p>
                {who && <Avatar name={who.name} color={who.color} />}
              </div>
              {category && (
                <p className="flex items-center gap-1.5 text-sm text-muted">
                  <CategoryIcon icon={category.icon} className="size-4" />
                  {category.name}
                </p>
              )}
              {current.address && (
                <p className="flex items-start gap-1.5 text-sm text-muted">
                  <MapPin className="mt-0.5 size-4 shrink-0" strokeWidth={1.6} />
                  {current.address}
                </p>
              )}
              {current.note && <p className="line-clamp-3 text-ink/80">{current.note}</p>}
            </div>
          </Link>

          {current.address && (
            <a
              href={yandexMapsUrl(current.address)}
              target="_blank"
              rel="noreferrer"
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-sky-ink ring-1 ring-line"
            >
              <ExternalLink className="size-4" />
              Открыть в Яндекс Картах
            </a>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button variant="soft" onClick={another} disabled={pool.length < 2}>
              <Shuffle className="size-5" />
              Другой вариант
            </Button>
            <Button onClick={() => setDoneItem(current)}>
              <Check className="size-5" />
              Были!
            </Button>
          </div>
        </>
      ) : (
        <div className="rounded-3xl bg-white px-6 py-12 text-center ring-1 ring-line">
          <p className="text-4xl">🌿</p>
          <p className="mt-3 font-semibold">Здесь пока нечего выбирать</p>
          <p className="mt-1 text-sm text-muted">Добавьте записи со статусом «Хотим», и я помогу выбрать одну из них</p>
        </div>
      )}

      <DoneSheet item={doneItem} onClose={() => setDoneItem(null)} onDone={another} />
    </div>
  )
}

/** Случайный выбор, который не меняется при каждой перерисовке экрана */
function pickRandomStable(list: Item[], seed: number): string | null {
  if (!list.length) return null
  const ids = list.map((i) => i.id).sort()
  let h = seed + 7
  for (const ch of ids.join('')) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return ids[h % ids.length]
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition',
        active ? 'bg-sky text-ink' : 'bg-white text-ink/70 ring-1 ring-line',
      )}
    >
      {children}
    </button>
  )
}
