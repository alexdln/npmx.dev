/**
 * Adds trailing slashes to URLs.
 *
 * We use middleware to correctly handle all the cases, since Vercel doesn't handle it properly for nuxt app.
 *
 * - /package/vue → /package/vue/
 * - /docs/getting-started?query=value → /docs/getting-started/?query=value
 */
export default defineNuxtRouteMiddleware(to => {
  // request is marked as prerender for build and server ISR
  // ignore rewrite for build prerender only
  if (import.meta.prerender && process.env.NUXT_STAGE === 'build') return

  // ignore for package-code (file viewer shouldn't relate on trailing slash) and api routes
  if (
    to.path.startsWith('/package-code/') ||
    to.path.startsWith('/api/') ||
    to.path.endsWith('/_payload.json')
  )
    return

  if (import.meta.server) {
    const event = useRequestEvent()

    // requests to /page-path/_payload.json are handled with to.path="/page-path", so we use the original url to check properly
    const urlRaw = event?.node.req.originalUrl || event?.node.req.url || ''
    const originalUrl = new URL(urlRaw, 'http://npmx.dev')

    if (originalUrl.pathname.includes('/_payload.json') || originalUrl.pathname.endsWith('/'))
      return
  }

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
