import { defineStore } from 'pinia'

export const useRouterStore = defineStore('Router', {
  state: () => {
    return {
      routerReady: false,
    }
  },
  actions: {},
})
