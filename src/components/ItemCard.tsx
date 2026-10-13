import { ImageIcon, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDate } from '../lib/format'
import { useAuthor } from '../lib/people'
import type { Item } from '../lib/types'
import { Stars } from './Stars'
import { Avatar, cx } from './ui'

export function ItemCard({ item, photoUrl }: { item: Item; photoUrl?: string }) {
  const author = useAuthor()(item.created_by)
  const stripe = author?.color === 'pink' ? 'bg-rose' : author?.color === 'blue' ? 'bg-sky' : 'bg-line'

  return (
    <Link to={`/item/${item.id}`} className="relative flex gap-3.5 overflow-hidden rounded-2xl bg-white p-3 pl-4 ring-1 ring-line/70 transition active:scale-[0.98]">
      <span className={cx('absolute inset-y-0 left-0 w-1.5', stripe)} />

      {item.photos.length > 0 && (
        <div className="size-22 shrink-0 overflow-hidden rounded-xl bg-bg">
          {photoUrl ? (
            <img src={photoUrl} alt="" loading="lazy" className="size-full object-cover" />
          ) : (
            <ImageIcon className="m-auto mt-8 size-6 text-line" />
          )}
        </div>
      )}

      <div className="min-w-0 flex-1 py-0.5 pr-7">
        <p className="line-clamp-2 font-semibold leading-snug break-words">{item.title}</p>
        {item.address && (
          <p className="mt-1 flex items-center gap-1 truncate text-[13px] text-muted">
            <MapPin className="size-3.5 shrink-0" strokeWidth={1.6} />
            <span className="truncate">{item.address}</span>
          </p>
        )}
        {item.status === 'done' ? (
          <div className="mt-1.5 flex items-center gap-2 text-[13px] text-muted">
            {item.rating && <Stars value={item.rating} />}
            {item.visited_on && <span>{formatDate(item.visited_on)}</span>}
          </div>
        ) : (
          item.note && <p className="mt-1 line-clamp-1 text-[13px] text-muted">{item.note}</p>
        )}
      </div>

      {author && (
        <span className="absolute top-3 right-3">
          <Avatar name={author.name} color={author.color} />
        </span>
      )}
    </Link>
  )
}
