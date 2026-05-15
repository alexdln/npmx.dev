import { Client } from '@atproto/lex'

/**
 * POST /api/social/profile/:identifier/accounts
 *
 * Adds a known account to the signed-in user's account list.
 */
export default eventHandlerWithOAuthSession(async (event, oAuthSession) => {
  const loggedInDid = oAuthSession?.did.toString()

  if (!oAuthSession || !loggedInDid) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  await throwOnMissingOAuthScope(oAuthSession, NET_ATVIEW_ACCOUNT_ACTOR_WRITE_SCOPE)

  const identifier = getRouterParam(event, 'identifier')
  if (!identifier) {
    throw createError({ status: 400, message: 'identifier not provided' })
  }

  const ownerMinidoc = await new IdentityUtils().getMiniDoc(identifier)
  if (ownerMinidoc.did !== loggedInDid) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = await readBody(event)
  const handle = body.handle?.replace(/^@/, '').trim()

  if (!handle) {
    throw createError({ status: 400, message: 'handle not provided' })
  }

  try {
    const accountUtils = new AccountUtils()
    const actorMinidoc = await new IdentityUtils().getMiniDoc(handle)
    const actorUri = `at://${actorMinidoc.did}/app.bsky.actor.profile/self`

    if (actorMinidoc.did === ownerMinidoc.did) {
      throw createError({
        statusCode: 400,
        message: 'Cannot add your own account',
      })
    }

    const writeClient = new Client(oAuthSession)
    return await accountUtils.createAccount(writeClient, ownerMinidoc, actorUri, body.type)
  } catch (error: unknown) {
    console.error('[profile-accounts-post]', error)
    handleApiError(error, {
      statusCode: 502,
      message: 'Failed to add account',
    })
  }
})
