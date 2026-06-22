const ASSET_ORIGIN = (() => {
  // #ifdef H5
  return ''
  // #endif

  // #ifdef MP-WEIXIN
  return 'http://localhost:3000'
  // #endif

  return 'http://localhost:3000'
})()

export function normalizeAssetUrl(url: string | null | undefined) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('/')) return `${ASSET_ORIGIN}${url}`
  return url
}
