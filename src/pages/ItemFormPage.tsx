import { Camera, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Stars } from '../components/Stars'
import { Button, cx, ErrorText, FullScreenLoader, Spinner, SubPage } from '../components/ui'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/data'
import { ruError } from '../lib/errors'
import { todayISO } from '../lib/format'
import { CategoryIcon, tileTone } from '../lib/icons'
import { compressImage, deletePhotos, uploadPhoto, usePhotoUrls } from '../lib/photos'
import { supabase } from '../lib/supabase'
import type { Item, ItemStatus } from '../lib/types'
import { StatusSwitch } from './CategoryPage'

const MAX_PHOTOS = 10

type NewPhoto = { key: string; blob: Blob; preview: string }

export function ItemFormPage() {
  const { id } = useParams()
  const { items, loading } = useData()
  if (loading) return <FullScreenLoader />
  if (!id) return <ItemForm />
  const item = items.find((i) => i.id === id)
  if (!item) return <Navigate to="/" replace />
  return <ItemForm key={item.id} item={item} />
}

function ItemForm({ item }: { item?: Item }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { profile } = useAuth()
  const { categories, reload } = useData()

  const [title, setTitle] = useState(item?.title ?? '')
  const [address, setAddress] = useState(item?.address ?? '')
  const [note, setNote] = useState(item?.note ?? '')
  const [categoryId, setCategoryId] = useState(item?.category_id ?? params.get('category') ?? categories[0]?.id ?? '')
  const [status, setStatus] = useState<ItemStatus>(item?.status ?? (params.get('status') === 'done' ? 'done' : 'want'))
  const [rating, setRating] = useState<number | null>(item?.rating ?? null)
  const [visitedOn, setVisitedOn] = useState(item?.visited_on ?? todayISO())
  const [keptPhotos, setKeptPhotos] = useState<string[]>(item?.photos ?? [])
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([])
  const [compressing, setCompressing] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const keptUrls = usePhotoUrls(keptPhotos)

  // освобождаем память от превью, когда уходим с экрана
  const newPhotosRef = useRef(newPhotos)
  newPhotosRef.current = newPhotos
  useEffect(() => () => newPhotosRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), [])

  const photoCount = keptPhotos.length + newPhotos.length + compressing

  async function addFiles(files: FileList | null) {
    if (!files?.length) return
    setError('')
    const room = MAX_PHOTOS - photoCount
    const chosen = Array.from(files).slice(0, Math.max(0, room))
    if (files.length > room) setError(`Можно добавить не больше ${MAX_PHOTOS} фото`)
    setCompressing((n) => n + chosen.length)
    for (const file of chosen) {
      try {
        const blob = await compressImage(file)
        setNewPhotos((list) => [...list, { key: crypto.randomUUID(), blob, preview: URL.createObjectURL(blob) }])
      } catch (err) {
        setError(ruError(err))
      } finally {
        setCompressing((n) => n - 1)
      }
    }
  }

  function removeNew(key: string) {
    setNewPhotos((list) => {
      const gone = list.find((p) => p.key === key)
      if (gone) URL.revokeObjectURL(gone.preview)
      return list.filter((p) => p.key !== key)
    })
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    if (!title.trim()) return setError('Введите название')
    if (!categoryId) return setError('Выберите категорию')
    setError('')
    setBusy(true)

    const uploaded: string[] = []
    try {
      for (const p of newPhotos) uploaded.push(await uploadPhoto(profile.couple_id, p.blob))

      const fields = {
        title: title.trim(),
        address: address.trim() || null,
        note: note.trim() || null,
        category_id: categoryId,
        status,
        rating: status === 'done' ? rating : null,
        visited_on: status === 'done' ? visitedOn || null : null,
        photos: [...keptPhotos, ...uploaded],
      }

      if (item) {
        const { error } = await supabase.from('items').update(fields).eq('id', item.id)
        if (error) throw error
        // фото, которые убрали из записи, удаляем из хранилища
        await deletePhotos(item.photos.filter((p) => !keptPhotos.includes(p)))
      } else {
        const { error } = await supabase.from('items').insert({ ...fields, couple_id: profile.couple_id })
        if (error) throw error
      }
      await reload()
      navigate(-1)
    } catch (err) {
      await deletePhotos(uploaded) // запись не сохранилась — не оставляем лишние фото
      setError(ruError(err))
      setBusy(false)
    }
  }

  return (
    <SubPage title={item ? 'Изменить' : 'Добавить'}>
      <form onSubmit={submit} className="space-y-4 pb-4">
        <TextBox label="Название" value={title} onChange={setTitle} placeholder="Например, уютная кофейня" maxLength={200} />
        <TextBox label="Адрес" value={address} onChange={setAddress} placeholder="Улица, город (необязательно)" maxLength={300} />
        <TextBox label="Заметка" value={note} onChange={setNote} placeholder="Что там особенного?" maxLength={3000} multiline />

        <div>
          <p className="mb-2 pt-1 font-semibold">Категория</p>
          <div className="grid grid-cols-4 gap-x-2 gap-y-3">
            {categories.map((c, index) => {
              const active = c.id === categoryId
              const sky = tileTone(index) === 'sky'
              return (
                <button key={c.id} type="button" onClick={() => setCategoryId(c.id)} className="flex flex-col items-center gap-1.5">
                  <span
                    className={cx(
                      'flex size-13 items-center justify-center rounded-full transition',
                      sky ? 'bg-sky-soft text-sky-ink' : 'bg-rose-soft text-rose-ink',
                      active ? 'ring-2 ring-sky-ink ring-offset-2 ring-offset-bg' : 'opacity-80',
                    )}
                  >
                    <CategoryIcon icon={c.icon} className="size-6" />
                  </span>
                  <span className={cx('w-full truncate text-center text-xs', active ? 'font-bold' : 'text-ink/70')}>{c.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => (addFiles(e.target.files), (e.target.value = ''))} />
          {photoCount > 0 && (
            <div className="mb-3 grid grid-cols-4 gap-2">
              {keptPhotos.map((path) => (
                <Thumb key={path} src={keptUrls[path]} onRemove={() => setKeptPhotos((l) => l.filter((p) => p !== path))} />
              ))}
              {newPhotos.map((p) => (
                <Thumb key={p.key} src={p.preview} onRemove={() => removeNew(p.key)} />
              ))}
              {Array.from({ length: compressing }, (_, i) => (
                <div key={i} className="flex aspect-square items-center justify-center rounded-xl bg-white text-sky-ink ring-1 ring-line">
                  <Spinner />
                </div>
              ))}
            </div>
          )}
          {photoCount < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex w-full flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-line py-5 text-ink/80 active:bg-black/[0.02]"
            >
              <Camera className="size-6" strokeWidth={1.5} />
              <span>Добавить фото</span>
              <span className="text-xs text-muted">Можно выбрать несколько</span>
            </button>
          )}
        </div>

        <div>
          <p className="mb-2 font-semibold">Хотим / Были</p>
          <StatusSwitch value={status} onChange={setStatus} />
        </div>

        {status === 'done' && (
          <div className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-line">
            <div>
              <p className="mb-2 text-sm font-semibold">Оценка</p>
              <Stars value={rating} onChange={setRating} size="lg" />
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">Когда были</span>
              <input
                type="date"
                value={visitedOn}
                max={todayISO()}
                onChange={(e) => setVisitedOn(e.target.value)}
                className="h-12 w-full rounded-xl bg-bg px-4 ring-1 ring-line outline-none focus:ring-2 focus:ring-sky"
              />
            </label>
          </div>
        )}

        <ErrorText>{error}</ErrorText>

        <Button type="submit" busy={busy} disabled={compressing > 0}>
          Сохранить
        </Button>
      </form>
    </SubPage>
  )
}

function TextBox(props: { label: string; value: string; onChange: (v: string) => void; placeholder: string; maxLength: number; multiline?: boolean }) {
  const common = {
    value: props.value,
    placeholder: props.placeholder,
    maxLength: props.maxLength,
    className: 'mt-1 w-full resize-none bg-transparent outline-none placeholder:text-muted/80',
  }
  return (
    <label className="block rounded-2xl bg-white px-4 py-3 ring-1 ring-line focus-within:ring-2 focus-within:ring-sky">
      <span className="block text-sm font-semibold">{props.label}</span>
      {props.multiline ? (
        <textarea {...common} rows={3} onChange={(e) => props.onChange(e.target.value)} />
      ) : (
        <input {...common} onChange={(e) => props.onChange(e.target.value)} />
      )}
    </label>
  )
}

function Thumb({ src, onRemove }: { src?: string; onRemove: () => void }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-xl bg-white ring-1 ring-line">
      {src && <img src={src} alt="" className="size-full object-cover" />}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/50 text-white"
        aria-label="Убрать фото"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}
