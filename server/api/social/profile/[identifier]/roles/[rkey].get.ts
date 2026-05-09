/**
 * GET /api/social/profile/:identifier/roles/:rkey
 *
 * Gets a single role with its assigned users for a npmx user
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
    const minidoc = await new IdentityUtils().getMiniDoc(identifier)
    return await new RoleUtils().getRole(minidoc, rkey)
  } catch (error: unknown) {
    console.error('[profile-role-get]', error)
    handleApiError(error, {
      statusCode: 502,
      message: 'Failed to get role',
    })
  }
})
