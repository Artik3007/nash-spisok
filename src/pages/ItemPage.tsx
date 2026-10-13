import { CalendarDays, Check, ExternalLink, MapPin, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { DoneSheet } from '../components/DoneSheet'
import { Sheet } from '../components/Sheet'
import { Stars } from '../components/Stars'
import { Avatar, Button, ErrorText, FullScreenLoader, SubPage } from '../components/ui'
import { useData } from '../lib/data'
import { ruError } from '../lib/errors'
import { formatDate, yandexMapsUrl } from '../lib/format'
import { CategoryIcon } from '../lib/icons'
import { useAuthor } from '../lib/people'
import { deletePhotos, usePhotoUrls } from '../lib/photos'
import { supabase } from '../lib/supabase'

export function ItemPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { items, categories, loading, reload } = useData()
  const author = useAuthor()
  const item = items.find((i) => i.id === id)
  const urls = usePhotoUrls(item?.photos ?? [])
  const [doneOpen, setDoneOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [viewer, setViewer] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (loading) return <FullScreenLoader />
  if (!item) return <Navigate to="/" replace />

  const category = categories.find((c) => c.id === item.category_id)
  const who = author(item.created_by)

  async function backToWant() {
    setBusy(true)
    const { error } = await supabase.from('items').update({ status: 'want' }).eq('id', item!.id)
    setBusy(false)
    if (error) return setError(ruError(error))
    reload()
  }

  async function remove() {
    setBusy(true)
    const { error } = await supabase.from('items').delete().eq('id', item!.id)
    if (error) {
      setBusy(false)
      setConfirmDelete(false)
      return setError(ruError(error))
    }
    await deletePhotos(item!.photos)
    navigate(-1)
    reload()
  }

  return (
    <SubPage title={category?.name ?? 'Запись'}>
      <div className="space-y-5 pb-4">
        {item.photos.length > 0 && (
          <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 [scrollbar-width:none]">
            {item.photos.map((path) => (
              <button
                key={path}
                onClick={() => urls[path] && setViewer(urls[path])}
                className="aspect-[4/3] w-[85%] shrink-0 snap-center overflow-hidden rounded-3xl bg-white ring-1 ring-line"
              >
                {urls[path] && <img src={urls[path]} alt="" className="size-full object-cover" />}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-start gap-3">
          <h1 className="min-w-0 flex-1 text-2xl leading-tight font-bold break-words">{item.title}</h1>
          {who && <Avatar name={who.name} color={who.color} />}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          {category && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-line">
              <CategoryIcon icon={category.icon} className="size-4 text-sky-ink" />
              {category.name}
            </span>
          )}
          <span
            className={
              item.status === 'done'
                ? 'rounded-full bg-rose-soft px-3 py-1.5 font-semibold text-rose-ink'
                : 'rounded-full bg-sky-soft px-3 py-1.5 font-semibold text-sky-ink'
            }
          >
            {item.status === 'done' ? 'Были' : 'Хотим'}
          </span>
          {who && <span className="text-muted">добавил(а) {who.name}</span>}
        </div>

        {item.status === 'done' && (item.rating || item.visited_on) && (
          <div className="flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-line">
            {item.rating && <Stars value={item.rating} size="lg" />}
            {item.visited_on && (
              <span className="flex items-center gap-1.5 text-sm text-muted">
                <CalendarDays className="size-4" />
                {formatDate(item.visited_on)}
              </span>
            )}
          </div>
        )}

        {item.address && (
          <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-5 shrink-0 text-muted" strokeWidth={1.6} />
              <span className="break-words">{item.address}</span>
            </p>
            <a
              href={yandexMapsUrl(item.address)}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex h-11 items-center justify-center gap-2 rounded-xl bg-sky-soft text-sm font-semibold text-sky-ink"
            >
              <ExternalLink className="size-4" />
              Открыть в Яндекс Картах
            </a>
          </div>
        )}

        {item.note && <p className="rounded-2xl bg-white p-4 whitespace-pre-wrap break-words ring-1 ring-line">{item.note}</p>}

        <ErrorText>{error}</ErrorText>

        <div className="space-y-3 pt-2">
          {item.status === 'want' ? (
            <Button onClick={() => setDoneOpen(true)}>
              <Check className="size-5" />
              Были!
            </Button>
          ) : (
            <Button variant="soft" onClick={backToWant} busy={busy}>
              <RotateCcw className="size-5" />
              Вернуть в «Хотим»
            </Button>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Link to={`/item/${item.id}/edit`} className="flex h-13 items-center justify-center gap-2 rounded-2xl bg-white font-semibold ring-1 ring-line">
              <Pencil className="size-4" />
              Изменить
            </Link>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-4" />
              Удалить
            </Button>
          </div>
        </div>
      </div>

      <DoneSheet item={doneOpen ? item : null} onClose={() => setDoneOpen(false)} />

      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Удалить запись?">
        <p className="mb-5 text-muted">«{item.title}» и её фото удалятся насовсем.</p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="soft" onClick={() => setConfirmDelete(false)}>
            Отмена
          </Button>
          <Button variant="danger" onClick={remove} busy={busy}>
            Удалить
          </Button>
        </div>
      </Sheet>

      {viewer &&
        createPortal(
          <button onClick={() => setViewer(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2" aria-label="Закрыть фото">
            <img src={viewer} alt="" className="max-h-full max-w-full object-contain" />
          </button>,
          document.body,
        )}
    </SubPage>
  )
}
