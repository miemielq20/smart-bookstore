const ASSET_ORIGIN = (() => {
  const configuredOrigin = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_ORIGIN?.replace(/\/$/, '')
  if (configuredOrigin) return configuredOrigin
  // #ifdef H5
  return ''
  // #endif

  // #ifdef MP-WEIXIN
  return 'http://192.168.1.100:3001'
  // #endif

  return 'http://192.168.1.100:3001'
})()

export function normalizeAssetUrl(url: string | null | undefined) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('/')) return `${ASSET_ORIGIN}${url}`
  return url
}
