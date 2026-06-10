export interface MenuItem {
  id: number
  parent_id: number
  name: string           // route name
  path: string           // route path
  component?: string     // 前端组件路径
  icon?: string
  sort: number
  visible: 0 | 1
  status: 0 | 1
  permission_code: string
  children?: MenuItem[]
}

/** 后端返回的菜单树 */
export type MenuTree = MenuItem[]