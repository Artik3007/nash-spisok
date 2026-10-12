import type { Session } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from './supabase'
import type { Couple, Profile } from './types'

type AuthState = {
  session: Session | null
  profile: Profile | null
  partner: Profile | null
  couple: Couple | null
  /** первая загрузка ещё идёт — показываем заставку */
  loading: boolean
  /** профиль для текущего входа уже проверен (есть он или нет) */
  profileChecked: boolean
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [partner, setPartner] = useState<Profile | null>(null)
  const [couple, setCouple] = useState<Couple | null>(null)
  const [checkedFor, setCheckedFor] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setSessionReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id ?? null

  const refresh = useCallback(async () => {
    if (!userId) {
      setProfile(null)
      setPartner(null)
      setCouple(null)
      setCheckedFor(null)
      return
    }
    const { data: people, error } = await supabase.from('profiles').select('id, couple_id, name, color')
    if (error) {
      // нет сети — оставляем то, что уже было
      setCheckedFor(userId)
      return
    }
    const me = (people as Profile[]).find((p) => p.id === userId) ?? null
    setProfile(me)
    setPartner((people as Profile[]).find((p) => p.id !== userId) ?? null)
    if (me) {
      const { data: c } = await supabase.from('couples').select('id, invite_code').single()
      setCouple((c as Couple) ?? null)
    } else {
      setCouple(null)
    }
    setCheckedFor(userId)
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Когда возвращаемся в приложение — подтягиваем свежие данные (например, вторая половинка присоединилась)
  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refresh])

  const profileChecked = !!userId && checkedFor === userId
  // Заставка только при самом первом запуске, дальше экраны не перемонтируются
  const [booted, setBooted] = useState(false)
  const firstCheckDone = sessionReady && (!userId || checkedFor === userId)
  useEffect(() => {
    if (firstCheckDone) setBooted(true)
  }, [firstCheckDone])
  const loading = !booted && !firstCheckDone

  return (
    <AuthContext.Provider value={{ session, profile, partner, couple, loading, profileChecked, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth вне AuthProvider')
  return ctx
}
