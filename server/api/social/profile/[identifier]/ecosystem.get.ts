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
    const minidoc = await new IdentityUtils().getMiniDoc(identifier)
    return await new EcosystemUtils().getEcosystem(minidoc)
  } catch (error: unknown) {
    console.error('[profile-ecosystem-get]', error)
    handleApiError(error, {
      statusCode: 502,
      message: 'Failed to get ecosystem',
    })
  }
})
