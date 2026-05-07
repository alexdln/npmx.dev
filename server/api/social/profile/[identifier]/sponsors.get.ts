/**
 * GET /api/social/profile/:identifier/sponsors
 *
 * Gets the sponsors for a npmx user
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
    const sponsorsUtil = new SponsorUtils()
    return await sponsorsUtil.getSponsors(minidoc)
  } catch (error: unknown) {
    console.error('[profile-sponsors-get]', error)
    handleApiError(error, {
      statusCode: 502,
      message: 'Failed to get sponsors',
    })
  }
})
