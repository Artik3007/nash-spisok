import { Plus } from 'lucide-react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { ItemCard } from '../components/ItemCard'
import { cx, FullScreenLoader, SubPage } from '../components/ui'
import { useData } from '../lib/data'
import { usePhotoUrls } from '../lib/photos'
import type { ItemStatus } from '../lib/types'

export function StatusSwitch({ value, onChange }: { value: ItemStatus; onChange: (v: ItemStatus) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/[0.04] p-1">
      {(
        [
          ['want', 'Хотим'],
          ['done', 'Были'],
        ] as const
      ).map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cx('h-10 rounded-xl text-sm font-semibold transition', value === v ? 'bg-sky text-ink shadow-sm' : 'text-muted')}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function CategoryPage() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const tab: ItemStatus = params.get('tab') === 'done' ? 'done' : 'want'
  const { categories, items, loading } = useData()

  const category = categories.find((c) => c.id === id)
  const list = items
    .filter((i) => i.category_id === id && i.status === tab)
    .sort((a, b) =>
      tab === 'done'
        ? (b.visited_on ?? b.done_at ?? '').localeCompare(a.visited_on ?? a.done_at ?? '')
        : b.created_at.localeCompare(a.created_at),
    )
  const photoUrls = usePhotoUrls(list.flatMap((i) => i.photos.slice(0, 1)))

  if (loading) return <FullScreenLoader />
  if (!category) return <Navigate to="/" replace />

  return (
    <SubPage
      title={category.name}
      footer={
        <Link
          to={`/item/new?category=${category.id}&status=${tab}`}
          className="absolute right-5 bottom-[calc(env(safe-area-inset-bottom)+24px)] flex size-15 items-center justify-center rounded-full bg-sky text-white shadow-[0_8px_24px_-6px_rgba(80,150,220,0.7)] transition active:scale-95"
          aria-label="Добавить запись"
        >
          <Plus className="size-8" strokeWidth={2} />
        </Link>
      }
    >
      <div className="sticky top-0 z-10 -mx-5 bg-bg/95 px-5 pb-3 backdrop-blur">
        <StatusSwitch value={tab} onChange={(v) => setParams(v === 'done' ? { tab: 'done' } : {}, { replace: true })} />
      </div>

      {list.length === 0 ? (
        <p className="px-6 py-16 text-center text-muted">
          {tab === 'want' ? 'Пока пусто. Нажмите «+», чтобы добавить то, что хотите сделать вместе' : 'Здесь появится то, где вы уже были'}
        </p>
      ) : (
        <div className="space-y-3 pb-20">
          {list.map((item) => (
            <ItemCard key={item.id} item={item} photoUrl={photoUrls[item.photos[0]]} />
          ))}
        </div>
      )}
    </SubPage>
  )
}
