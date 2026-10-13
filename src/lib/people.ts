import { useAuth } from './auth'
import type { Profile } from './types'

/** Кто добавил запись: я или вторая половинка */
export function useAuthor() {
  const { profile, partner } = useAuth()
  return (id: string | null): Profile | null => {
    if (id && profile?.id === id) return profile
    if (id && partner?.id === id) return partner
    return null
  }
}
