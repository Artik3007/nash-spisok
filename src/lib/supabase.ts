import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error('Нет настроек Supabase: создайте файл .env по образцу .env.example')
}

export const supabase = createClient(url, key)
