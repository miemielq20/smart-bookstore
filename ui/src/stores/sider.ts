// src/stores/menu.ts
import { defineStore } from 'pinia'
import { getMenusApi } from '@/api/api'
import type { MenuNode } from '@/type/api.response'

interface MenuState {
  menus: MenuNode[]
  openedGroups: string[]
}

export const useMenuStore = defineStore('menu', {
  state: (): MenuState => ({
    menus: [],
    openedGroups: [],
  }),
  persist: true,

  getters: {
    sidebarMenus: (state) => state.menus.filter((m) => m.visible === 1),
  },

  actions: {
    async initMenus() {
      const cache = localStorage.getItem('MENU_CACHE')
      try {
        // 菜单权限可能在后台被删除或调整，登录时始终以服务端最新结果为准。
        const res = await getMenusApi()
        this.menus = res.data
        localStorage.setItem('MENU_CACHE', JSON.stringify(res.data))
      } catch (error) {
        // 网络暂时不可用时保留上次缓存，避免已打开的后台完全失去导航。
        if (cache) this.menus = JSON.parse(cache)
        else throw error
      }
    },

    clearMenus() {
      this.menus = []
      localStorage.removeItem('MENU_CACHE')
    },

    loadOpenedGroups() {
      const saved = localStorage.getItem('SIDEBAR_OPENED_GROUPS')
      if (saved) {
        this.openedGroups = JSON.parse(saved)
      }
    },

    setOpenedGroups(groups: string[]) {
      this.openedGroups = groups
      localStorage.setItem('SIDEBAR_OPENED_GROUPS', JSON.stringify(groups))
    },
  },
})
