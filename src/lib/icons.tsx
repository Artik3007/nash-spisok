import {
  BookOpen,
  Camera,
  Car,
  Clapperboard,
  Coffee,
  Dumbbell,
  Gamepad2,
  Gift,
  Heart,
  House,
  MapPin,
  Mountain,
  Music,
  Plane,
  ShoppingBag,
  Sparkles,
  Star,
  Ticket,
  TreePalm,
  Utensils,
  type LucideIcon,
} from 'lucide-react'

// Ключ хранится в базе, по нему рисуем иконку
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'map-pin': MapPin,
  clapperboard: Clapperboard,
  utensils: Utensils,
  plane: Plane,
  star: Star,
  heart: Heart,
  camera: Camera,
  coffee: Coffee,
  mountain: Mountain,
  'tree-palm': TreePalm,
  book: BookOpen,
  music: Music,
  gift: Gift,
  'shopping-bag': ShoppingBag,
  dumbbell: Dumbbell,
  gamepad: Gamepad2,
  house: House,
  car: Car,
  ticket: Ticket,
  sparkles: Sparkles,
}

export function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = CATEGORY_ICONS[icon] ?? Star
  return <Icon className={className} strokeWidth={1.6} />
}

// Шахматный порядок цветов плиток, как на макете
export function tileTone(index: number): 'sky' | 'rose' {
  const row = Math.floor(index / 2)
  const col = index % 2
  return (row + col) % 2 === 0 ? 'sky' : 'rose'
}
