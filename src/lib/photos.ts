import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const BUCKET = 'photos'
const MAX_SIDE = 1280
const MAX_BYTES = 300 * 1024

async function loadBitmap(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  try {
    // учитывает поворот фото с телефона
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    const url = URL.createObjectURL(file)
    try {
      const img = new Image()
      img.src = url
      await img.decode()
      return img
    } finally {
      URL.revokeObjectURL(url)
    }
  }
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Не удалось сжать фото'))), 'image/jpeg', quality),
  )
}

/** Сжимаем фото прямо в телефоне: длинная сторона до 1280 px, размер примерно до 300 КБ */
export async function compressImage(file: File): Promise<Blob> {
  const source = await loadBitmap(file)
  const w0 = source.width
  const h0 = source.height
  let scale = Math.min(1, MAX_SIDE / Math.max(w0, h0))

  for (let attempt = 0; attempt < 6; attempt++) {
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(w0 * scale)
    canvas.height = Math.round(h0 * scale)
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fff' // прозрачный фон (PNG) делаем белым
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height)

    for (const quality of [0.82, 0.72, 0.62, 0.52]) {
      const blob = await toBlob(canvas, quality)
      if (blob.size <= MAX_BYTES) return blob
    }
    scale *= 0.8
  }
  throw new Error('Фото слишком большое, выберите другое')
}

export async function uploadPhoto(coupleId: string, blob: Blob): Promise<string> {
  const path = `${coupleId}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' })
  if (error) throw error
  return path
}

export async function deletePhotos(paths: string[]) {
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths)
}

// Хранилище закрытое, поэтому показываем фото по временным ссылкам. Запоминаем их, чтобы не просить заново.
const cache = new Map<string, { url: string; until: number }>()
const LIFETIME = 60 * 60 // 1 час

export function usePhotoUrls(paths: string[]): Record<string, string> {
  const key = paths.join('|')
  const [, setVersion] = useState(0)

  useEffect(() => {
    const now = Date.now()
    const missing = paths.filter((p) => (cache.get(p)?.until ?? 0) < now + 60_000)
    if (!missing.length) return
    let cancelled = false
    supabase.storage
      .from(BUCKET)
      .createSignedUrls(missing, LIFETIME)
      .then(({ data }) => {
        for (const row of data ?? []) {
          if (row.path && row.signedUrl) cache.set(row.path, { url: row.signedUrl, until: Date.now() + LIFETIME * 1000 })
        }
        if (!cancelled) setVersion((v) => v + 1)
      })
    return () => {
      cancelled = true
    }
  }, [key])

  const result: Record<string, string> = {}
  for (const p of paths) {
    const hit = cache.get(p)
    if (hit) result[p] = hit.url
  }
  return result
}
