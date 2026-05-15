/**
 * GET /api/social/profile/:identifier/accounts
 *
 * Lists all account actors for a npmx user identity
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
    return await new AccountUtils().getAccounts(minidoc)
  } catch (error: unknown) {
    console.error('[profile-accounts-get]', error)
    handleApiError(error, {
      statusCode: 502,
      message: 'Failed to get accounts',
    })
  }
})
