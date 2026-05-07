/**
 * GET /api/social/profile/:identifier/roles/:rkey
 *
 * Gets the roles for a npmx user
 */
export default eventHandlerWithOAuthSession(async event => {
  const identifier = getRouterParam(event, 'identifier')
  const rkey = getRouterParam(event, 'rkey')

  if (!identifier || !rkey) {
    throw createError({
      status: 400,
      message: 'identifier or rkey not provided',
    })
  }

  try {
    const utils = new IdentityUtils()
    const minidoc = await utils.getMiniDoc(identifier)
    const rolesUtil = new RoleUtils()
    return await rolesUtil.getRole(minidoc, rkey)
  } catch (error: unknown) {
    console.error('[profile-role-get]', error)
    handleApiError(error, {
      statusCode: 502,
      message: 'Failed to get role',
    })
  }
})
