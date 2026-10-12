export type PersonColor = 'blue' | 'pink'

export type Profile = {
  id: string
  couple_id: string
  name: string
  color: PersonColor
}

export type Couple = {
  id: string
  invite_code: string
}

export type Category = {
  id: string
  couple_id: string
  name: string
  icon: string
  position: number
  created_at: string
}

export type ItemStatus = 'want' | 'done'

export type Item = {
  id: string
  couple_id: string
  category_id: string
  title: string
  address: string | null
  note: string | null
  photos: string[]
  status: ItemStatus
  rating: number | null
  visited_on: string | null
  done_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}
