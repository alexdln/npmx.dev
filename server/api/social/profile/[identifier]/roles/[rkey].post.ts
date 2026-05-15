import { Client } from '@atproto/lex'

/**
 * POST /api/social/profile/:identifier/roles/:rkey
 *
 * Assigns a known account to a role on the signed-in user's profile.
 */
export default eventHandlerWithOAuthSession(async (event, oAuthSession) => {
  const loggedInDid = oAuthSession?.did.toString()

  if (!oAuthSession || !loggedInDid) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  await throwOnMissingOAuthScope(oAuthSession, NET_ATVIEW_ACCOUNT_ROLE_WRITE_SCOPE)

  const identifier = getRouterParam(event, 'identifier')
  const rkey = getRouterParam(event, 'rkey')
  if (!identifier) {
    throw createError({ status: 400, message: 'identifier not provided' })
  }
  if (!rkey) {
    throw createError({ status: 400, message: 'rkey not provided' })
  }

  const ownerMinidoc = await new IdentityUtils().getMiniDoc(identifier)
  const body = await readBody(event)

  try {
    const writeClient = new Client(oAuthSession)
    const roleUtils = new RoleUtils()
    return await roleUtils.createRoleAssignment(writeClient, ownerMinidoc, rkey, body.accountUri)
  } catch (error: unknown) {
    console.error('[profile-role-post]', error)
    handleApiError(error, {
      statusCode: 502,
      message: 'Failed to add role assignment',
    })
  }
})
