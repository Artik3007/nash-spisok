import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from './supabase'
import type { Category, Item } from './types'

type DataState = {
  categories: Category[]
  items: Item[]
  loading: boolean
  error: string
  reload: () => Promise<void>
}

const DataContext = createContext<DataState | null>(null)

/** Все категории и записи пары. Их немного, поэтому грузим сразу всё. */
export function DataProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    const [cats, its] = await Promise.all([
      supabase.from('categories').select('*').order('position').order('created_at'),
      supabase.from('items').select('*').order('created_at', { ascending: false }),
    ])
    if (cats.error || its.error) {
      setError('Не удалось загрузить данные. Проверьте интернет')
    } else {
      setCategories(cats.data as Category[])
      setItems(its.data as Item[])
      setError('')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    reload()
    const onVisible = () => document.visibilityState === 'visible' && reload()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [reload])

  return <DataContext.Provider value={{ categories, items, loading, error, reload }}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData вне DataProvider')
  return ctx
}
