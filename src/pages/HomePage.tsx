import { Box, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { InviteCard } from '../components/InviteCard'
import { Reminder } from '../components/Reminder'
import { cx, ErrorText, Spinner } from '../components/ui'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/data'
import { CategoryIcon, tileTone } from '../lib/icons'

export function HomePage() {
  const { partner } = useAuth()
  const { categories, items, loading, error } = useData()

  const countByCategory = new Map<string, number>()
  for (const item of items) countByCategory.set(item.category_id, (countByCategory.get(item.category_id) ?? 0) + 1)

  return (
    <div className="space-y-5">
      <h1 className="pt-2 text-[30px] font-bold tracking-tight">Наши списки</h1>

      {!partner && <InviteCard />}
      {!loading && <Reminder />}
      <ErrorText>{error}</ErrorText>

      {loading ? (
        <div className="flex justify-center py-16 text-sky-ink">
          <Spinner className="size-7" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3.5">
          {categories.map((category, index) => {
            const tone = tileTone(index)
            return (
              <Link
                key={category.id}
                to={`/category/${category.id}`}
                className={cx(
                  'flex aspect-[1/1.05] flex-col items-center justify-center gap-1 rounded-3xl px-3 text-center transition active:scale-[0.97]',
                  tone === 'sky' ? 'bg-sky-soft' : 'bg-rose-soft',
                )}
              >
                <CategoryIcon icon={category.icon} className={cx('mb-2 size-10', tone === 'sky' ? 'text-sky-ink' : 'text-rose-ink')} />
                <span className="line-clamp-2 text-[17px] font-medium break-words">{category.name}</span>
                <span className="text-[15px] text-ink/70">{countByCategory.get(category.id) ?? 0}</span>
              </Link>
            )
          })}

          <Link
            to="/categories?new=1"
            className="col-span-2 flex h-28 flex-col items-center justify-center gap-2 rounded-3xl bg-black/[0.035] text-ink/80 transition active:scale-[0.98]"
          >
            <Plus className="size-6" strokeWidth={1.5} />
            Новая категория
          </Link>
        </div>
      )}

      <Link
        to="/random"
        className="flex h-14 items-center justify-center gap-3 rounded-2xl bg-sky font-semibold shadow-[0_6px_20px_-8px_rgba(80,150,220,0.6)] transition active:scale-[0.98]"
      >
        <Box className="size-6" strokeWidth={1.6} />
        Что выбрать сегодня?
      </Link>
    </div>
  )
}
