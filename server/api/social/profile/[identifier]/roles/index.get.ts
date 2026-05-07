/**
 * GET /api/social/profile/:identifier/roles
 *
 * Gets the roles for a npmx user
 */
export default eventHandlerWithOAuthSession(async event => {
  const identifier = getRouterParam(event, 'identifier')

  if (!identifier) {
    throw createError({
      status: 400,
      message: 'identifier not provided',
    })
  }

  try {
    const utils = new IdentityUtils()
    const minidoc = await utils.getMiniDoc(identifier)
    const rolesUtil = new RoleUtils()
    return await rolesUtil.getRoles(minidoc)
  } catch (error: unknown) {
    console.error('[profile-roles-get]', error)
    handleApiError(error, {
      statusCode: 502,
      message: 'Failed to get roles',
    })
  }
})
