export class MenuEntity {
  id!: number
  parentId!: number | null
  name!: string
  path!: string | null
  icon!: string | null
  component!: string | null
  sort!: number
  status!: number
  visible!: number
  permissionCode!: string
}
