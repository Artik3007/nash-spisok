import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** Окошко, которое выезжает снизу экрана */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 animate-[fade_.2s_ease-out] bg-ink/25" onClick={onClose} />
      <div className="relative max-h-[90%] w-full max-w-md animate-[rise_.25s_ease-out] overflow-y-auto overscroll-none rounded-t-3xl bg-white px-5 pt-5 pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="-mr-2 flex size-10 items-center justify-center rounded-full text-muted active:bg-black/5" aria-label="Закрыть">
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
