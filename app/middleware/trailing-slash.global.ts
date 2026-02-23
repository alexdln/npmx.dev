/**
 * Removes trailing slashes from URLs.
 *
 * This middleware only runs in development to maintain consistent behavior.
 * In production, Vercel handles this redirect via vercel.json.
 *
 * - /package/vue/ → /package/vue
 * - /docs/getting-started/?query=value → /docs/getting-started?query=value
 */
export default defineNuxtRouteMiddleware(to => {
  if (import.meta.prerender) return

  if (import.meta.server) {
    const event = useRequestEvent()
    const url = event?.node.req.originalUrl || event?.node.req.url || ''

    if (url.includes('/_payload.json')) return
  }

  if (to.path.startsWith('/package-code/') || to.path.startsWith('/api/')) return

  if (to.path !== '' && !to.path.endsWith('/')) {
    return navigateTo(
      {
        path: to.path + '/',
        query: to.query,
        hash: to.hash,
      },
      { replace: true },
    )
  }
})
