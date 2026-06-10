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
    openedGroups: []
  }),
  persist: true ,

  getters: {
    sidebarMenus: state =>
      state.menus.filter(m => m.visible === 1)
  },

  actions: {
    async initMenus() {
      const cache = localStorage.getItem('MENU_CACHE')
      if (cache) {
        this.menus = JSON.parse(cache)
        return
      }

      const res = await getMenusApi()
      this.menus = res.data
      localStorage.setItem('MENU_CACHE', JSON.stringify(res.data))
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
    }
  }
})