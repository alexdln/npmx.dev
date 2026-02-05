import { Agent } from '@atproto/api'
import { NodeOAuthClient } from '@atproto/oauth-client-node'
import { createError, getQuery, sendRedirect } from 'h3'
import { getOAuthLock } from '#server/utils/atproto/lock'
import { useOAuthStorage } from '#server/utils/atproto/storage'
import { SLINGSHOT_HOST } from '#shared/utils/constants'
import { useServerSession } from '#server/utils/server-session'
import type { PublicUserSession } from '#shared/schemas/publicUserSession'
import { handleResolver } from '#server/utils/atproto/oauth'
import { Client } from '@atproto/lex'
import * as app from '#shared/types/lexicons/app'
import { ensureValidAtIdentifier } from '@atproto/syntax'

/**
 * Fetch the user's profile record to get their avatar blob reference
 * @param did
 * @param pds
 * @returns
 */
async function getAvatar(did: string, pds: string) {
  let avatar: string | undefined
  try {
    const pdsUrl = new URL(pds)
    // Only fetch from HTTPS PDS endpoints to prevent SSRF
    if (did && pdsUrl.protocol === 'https:') {
      ensureValidAtIdentifier(did)
      const client = new Client(pdsUrl)
      const profileResponse = await client.get(app.bsky.actor.profile, {
        repo: did,
        rkey: 'self',
      })

      const validatedResponse = app.bsky.actor.profile.main.validate(profileResponse.value)

      if (validatedResponse.avatar?.ref) {
        // Use Bluesky CDN for faster image loading
        avatar = `https://cdn.bsky.app/img/feed_thumbnail/plain/${did}/${validatedResponse.avatar?.ref}@jpeg`
      }
    }
  } catch {
    // Avatar fetch failed, continue without it
  }
  return avatar
}

export default defineEventHandler(async event => {
  const config = useRuntimeConfig(event)
  if (!config.sessionPassword) {
    throw createError({
      status: 500,
      message: UNSET_NUXT_SESSION_PASSWORD,
    })
  }

  const query = getQuery(event)
  const clientMetadata = getOauthClientMetadata()
  return clientMetadata
})
