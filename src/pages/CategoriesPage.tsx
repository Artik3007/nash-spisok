import { CirclePlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Sheet } from '../components/Sheet'
import { Button, cx, ErrorText, SubPage } from '../components/ui'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/data'
import { ruError } from '../lib/errors'
import { plural } from '../lib/format'
import { CATEGORY_ICONS, CategoryIcon, tileTone } from '../lib/icons'
import { deletePhotos } from '../lib/photos'
import { supabase } from '../lib/supabase'
import type { Category } from '../lib/types'

export function CategoriesPage() {
  const { categories, items, reload } = useData()
  const [params, setParams] = useSearchParams()
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const creating = params.get('new') === '1'

  const countOf = (id: string) => items.filter((i) => i.category_id === id).length

  return (
    <SubPage title="Категории">
      <div className="divide-y divide-line/70 rounded-3xl bg-white px-4 ring-1 ring-line">
        {categories.map((c, index) => {
          const sky = tileTone(index) === 'sky'
          const count = countOf(c.id)
          return (
            <div key={c.id} className="flex items-center gap-3 py-3">
              <span className={cx('flex size-11 shrink-0 items-center justify-center rounded-full', sky ? 'bg-sky-soft text-sky-ink' : 'bg-rose-soft text-rose-ink')}>
                <CategoryIcon icon={c.icon} className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{c.name}</p>
                <p className="text-xs text-muted">
                  {count} {plural(count, 'запись', 'записи', 'записей')}
                </p>
              </div>
              <button onClick={() => setEditing(c)} className="rounded-full bg-black/[0.04] px-3 py-1.5 text-xs font-semibold text-ink/70">
                Изменить
              </button>
              <button onClick={() => setDeleting(c)} className="rounded-full bg-rose-soft px-3 py-1.5 text-xs font-semibold text-rose-ink">
                Удалить
              </button>
            </div>
          )
        })}
        {categories.length === 0 && <p className="py-8 text-center text-muted">Категорий пока нет</p>}
      </div>

      <button
        onClick={() => setParams({ new: '1' }, { replace: true })}
        className="mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-sky-soft font-semibold text-sky-ink ring-1 ring-sky/60"
      >
        <CirclePlus className="size-5" strokeWidth={1.6} />
        Добавить категорию
      </button>

      <Sheet open={creating} onClose={() => setParams({}, { replace: true })} title="Новая категория">
        <CategoryForm onSaved={() => (setParams({}, { replace: true }), reload())} />
      </Sheet>

      <Sheet open={!!editing} onClose={() => setEditing(null)} title="Изменить категорию">
        {editing && <CategoryForm key={editing.id} category={editing} onSaved={() => (setEditing(null), reload())} />}
      </Sheet>

      <Sheet open={!!deleting} onClose={() => setDeleting(null)} title="Удалить категорию?">
        {deleting && <DeleteCategory key={deleting.id} category={deleting} count={countOf(deleting.id)} onClose={() => setDeleting(null)} />}
      </Sheet>
    </SubPage>
  )
}

function CategoryForm({ category, onSaved }: { category?: Category; onSaved: () => void }) {
  const { profile } = useAuth()
  const { categories } = useData()
  const [name, setName] = useState(category?.name ?? '')
  const [icon, setIcon] = useState(category?.icon ?? 'star')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Введите название')
    setBusy(true)
    const { error } = category
      ? await supabase.from('categories').update({ name: name.trim(), icon }).eq('id', category.id)
      : await supabase.from('categories').insert({
          couple_id: profile!.couple_id,
          name: name.trim(),
          icon,
          position: Math.max(0, ...categories.map((c) => c.position)) + 1,
        })
    setBusy(false)
    if (error) return setError(ruError(error))
    onSaved()
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Название категории"
        maxLength={40}
        className="h-12 w-full rounded-xl bg-bg px-4 ring-1 ring-line outline-none focus:ring-2 focus:ring-sky"
      />
      <div className="grid grid-cols-5 gap-3">
        {Object.keys(CATEGORY_ICONS).map((key, index) => (
          <button
            key={key}
            type="button"
            onClick={() => setIcon(key)}
            className={cx(
              'mx-auto flex size-12 items-center justify-center rounded-full transition',
              index % 2 === 0 ? 'bg-sky-soft text-sky-ink' : 'bg-rose-soft text-rose-ink',
              icon === key ? 'ring-2 ring-sky-ink ring-offset-2' : 'opacity-75',
            )}
            aria-label={key}
          >
            <CategoryIcon icon={key} className="size-5" />
          </button>
        ))}
      </div>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" busy={busy}>
        {category ? 'Сохранить' : 'Создать'}
      </Button>
    </form>
  )
}

function DeleteCategory({ category, count, onClose }: { category: Category; count: number; onClose: () => void }) {
  const { items, reload } = useData()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function remove() {
    setBusy(true)
    const photos = items.filter((i) => i.category_id === category.id).flatMap((i) => i.photos)
    // записи категории база удалит сама
    const { error } = await supabase.from('categories').delete().eq('id', category.id)
    if (error) {
      setBusy(false)
      return setError(ruError(error))
    }
    await deletePhotos(photos)
    await reload()
    onClose()
  }

  return (
    <div className="space-y-5">
      {count > 0 ? (
        <p className="text-ink/80">
          В категории «{category.name}» {count} {plural(count, 'запись', 'записи', 'записей')}.{' '}
          <b className="text-rose-ink">
            {count === 1 ? 'Она тоже удалится' : 'Они тоже удалятся'} вместе с фото, и вернуть их будет нельзя.
          </b>
        </p>
      ) : (
        <p className="text-ink/80">Категория «{category.name}» пустая, удалится только она сама.</p>
      )}
      <ErrorText>{error}</ErrorText>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="soft" onClick={onClose}>
          Отмена
        </Button>
        <Button variant="danger" onClick={remove} busy={busy}>
          Удалить
        </Button>
      </div>
    </div>
  )
}
