import { Client } from '@atproto/lex'

/**
 * POST /api/social/profile/:identifier/roles
 *
 * Creates a managed role on the signed-in user's profile.
 */
export default eventHandlerWithOAuthSession(async (event, oAuthSession) => {
  const loggedInDid = oAuthSession?.did.toString()

  if (!oAuthSession || !loggedInDid) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  await throwOnMissingOAuthScope(oAuthSession, NET_ATVIEW_MANAGED_ROLE_WRITE_SCOPE)

  const identifier = getRouterParam(event, 'identifier')
  if (!identifier) {
    throw createError({ status: 400, message: 'identifier not provided' })
  }

  const ownerMinidoc = await new IdentityUtils().getMiniDoc(identifier)
  const body = await readBody(event)
  const name = body.name?.trim()

  if (!name) {
    throw createError({ status: 400, message: 'Role name not provided' })
  }

  try {
    const writeClient = new Client(oAuthSession)
    const roleUtils = new RoleUtils()
    return await roleUtils.createRole(writeClient, ownerMinidoc, {
      name,
      description: body.description,
      color: body.color,
    })
  } catch (error: unknown) {
    console.error('[profile-roles-post]', error)
    handleApiError(error, {
      statusCode: 502,
      message: 'Failed to create role',
    })
  }
})
