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
    const minidoc = await new IdentityUtils().getMiniDoc(identifier)
    return await new SponsorUtils().getSponsors(minidoc)
  } catch (error: unknown) {
    console.error('[profile-sponsors-get]', error)
    handleApiError(error, {
      statusCode: 502,
      message: 'Failed to get sponsors',
    })
  }
})
