import { Agent, AtUri, CredentialSession } from '@atproto/api'
import { isStandardSiteMain } from '@atview/core'
import * as site from '#shared/types/lexicons/site'

import { getPdsEndpointFromPlcDoc } from '~~/server/utils/plc-pds-endpoint'

function decodeIdentity(identity: string) {
  return decodeURIComponent(identity).replaceAll('%3A', ':')
}

export default defineEventHandler(async event => {
  const identity = getRouterParam(event, 'identity')
  const rkey = getRouterParam(event, 'rkey')
  if (!identity || !rkey) {
    throw createError({ statusCode: 400, statusMessage: 'Missing route params' })
  }

  const currentIdentity = decodeIdentity(identity)
  const agent = new Agent(new CredentialSession(new URL('https://public.api.bsky.app')))
  let profile: Awaited<ReturnType<typeof agent.getProfile>>
  try {
    profile = await agent.getProfile({ actor: currentIdentity })
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Profile not found' })
  }

  if (!profile.success) {
    throw createError({ statusCode: 404, statusMessage: 'Profile not found' })
  }

  const plcRes = await fetch(`https://plc.directory/${profile.data.did}`)
  if (!plcRes.ok) {
    throw createError({ statusCode: 502, statusMessage: 'PLC directory request failed' })
  }

  const plcDoc: unknown = await plcRes.json()
  const pdsEndpoint = getPdsEndpointFromPlcDoc(plcDoc)
  if (!pdsEndpoint) {
    throw createError({ statusCode: 404, statusMessage: 'No PDS endpoint for DID' })
  }

  const pdsUrl = new URL(pdsEndpoint)
  const pdsAgent = new Agent(new CredentialSession(pdsUrl))
  const post = await pdsAgent.com.atproto.repo.getRecord({
    repo: profile.data.did,
    collection: site.standard.document.$nsid,
    rkey,
  })

  if (!post.data.value || !isStandardSiteMain(post.data.value)) {
    throw createError({ statusCode: 404, statusMessage: 'Document not found' })
  }

  const document = post.data.value
  let publication: unknown = null
  try {
    const atUri = new AtUri(document.site)
    const pub = await pdsAgent.com.atproto.repo.getRecord({
      repo: atUri.host,
      collection: atUri.collection,
      rkey: atUri.rkey,
    })
    publication = pub.data.value
  } catch {
    //
  }

  return {
    did: profile.data.did,
    handle: profile.data.handle,
    displayName: profile.data.displayName,
    description: profile.data.description,
    avatar: profile.data.avatar,
    document,
    publication,
  }
})
