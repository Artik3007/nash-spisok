/** Сегодняшняя дата в формате 2026-10-13 (по часам телефона) */
export function todayISO() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** «13 октября 2026» */
export function formatDate(iso: string | null | undefined) {
  if (!iso) return ''
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(y, m - 1, d))
}

export function yandexMapsUrl(address: string) {
  return `https://yandex.ru/maps/?text=${encodeURIComponent(address)}`
}

/** 1 запись, 2 записи, 5 записей */
export function plural(n: number, one: string, few: string, many: string) {
  const n10 = n % 10
  const n100 = n % 100
  if (n10 === 1 && n100 !== 11) return one
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few
  return many
}
