export interface GroupRow {
  id: number
  name: string
  description: string | null
  status: number
  memberCount: number
}

export interface MenuItem {
  id: number
  name: string
  children: MenuItem[]
}
