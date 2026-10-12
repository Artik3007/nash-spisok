import { SubPage } from '../components/ui'

/** Временная заглушка для экранов следующих шагов */
export function Placeholder({ title, sub = true }: { title: string; sub?: boolean }) {
  const text = <p className="py-16 text-center text-muted">Этот экран появится на следующем шаге ✨</p>
  if (!sub)
    return (
      <div>
        <h1 className="pt-2 text-[30px] font-bold tracking-tight">{title}</h1>
        {text}
      </div>
    )
  return <SubPage title={title}>{text}</SubPage>
}
