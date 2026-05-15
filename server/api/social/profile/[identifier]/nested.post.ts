import { Client } from '@atproto/lex'

/**
 * POST /api/social/profile/:identifier/nested
 *
 * Adds a known account to the signed-in user's nested list.
 */
export default eventHandlerWithOAuthSession(async (event, oAuthSession) => {
  const loggedInDid = oAuthSession?.did.toString()

  if (!oAuthSession || !loggedInDid) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  await throwOnMissingOAuthScope(oAuthSession, NET_ATVIEW_NESTED_WRITE_SCOPE)

  const identifier = getRouterParam(event, 'identifier')
  if (!identifier) {
    throw createError({ status: 400, message: 'identifier not provided' })
  }

  const ownerMinidoc = await new IdentityUtils().getMiniDoc(identifier)
  const body = await readBody(event)

  try {
    const writeClient = new Client(oAuthSession)
    const nestedUtils = new NestedUtils()
    return await nestedUtils.createNestedConnection(
      writeClient,
      ownerMinidoc,
      body.accountUri,
      body.note,
    )
  } catch (error: unknown) {
    console.error('[profile-nested-post]', error)
    handleApiError(error, {
      statusCode: 502,
      message: 'Failed to add nested connection',
    })
  }
})
