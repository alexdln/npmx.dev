/**
 * GET /api/social/profile/:identifier/ecosystem
 *
 * Gets the ecosystem for a npmx user
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
    const ecosystemUtil = new EcosystemUtils()
    return await ecosystemUtil.getEcosystem(minidoc)
  } catch (error: unknown) {
    console.error('[profile-ecosystem-get]', error)
    handleApiError(error, {
      statusCode: 502,
      message: 'Failed to get ecosystem',
    })
  }
})
