import { Box, List, User } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { cx } from './ui'

const tabs = [
  { to: '/', label: 'Списки', icon: List, end: true },
  { to: '/random', label: 'Случайный выбор', icon: Box, end: false },
  { to: '/profile', label: 'Профиль', icon: User, end: false },
]

/** Экраны с нижней панелью навигации */
export function TabsLayout() {
  return (
    <div className="flex h-full flex-col">
      <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-5 pt-[calc(env(safe-area-inset-top)+20px)] pb-6">
        <Outlet />
      </main>
      <nav className="grid shrink-0 grid-cols-3 border-t border-line bg-white/80 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            replace
            className={({ isActive }) =>
              cx('flex flex-col items-center gap-1 pt-2.5 pb-2 text-[11px] font-semibold', isActive ? 'text-sky-ink' : 'text-muted')
            }
          >
            <Icon className="size-6" strokeWidth={1.6} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
