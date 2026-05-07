/**
 * GET /api/social/profile/:identifier/packages
 *
 * Gets the packages for a npmx user
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
    const packagesUtil = new PackageUtils()
    return await packagesUtil.getPackages(minidoc)
  } catch (error: unknown) {
    console.error('[profile-packages-get]', error)
    handleApiError(error, {
      statusCode: 502,
      message: 'Failed to get packages',
    })
  }
})
