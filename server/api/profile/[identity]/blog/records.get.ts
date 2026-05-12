import { Agent, CredentialSession } from '@atproto/api'
import { isStandardSiteMain, type StandardDocument } from '@atview/core'
import * as site from '#shared/types/lexicons/site'

import { getPdsEndpointFromPlcDoc } from '~~/server/utils/plc-pds-endpoint'

function decodeIdentity(identity: string) {
  return decodeURIComponent(identity).replaceAll('%3A', ':')
}

export default defineEventHandler(async event => {
  const identity = getRouterParam(event, 'identity')
  if (!identity) {
    throw createError({ statusCode: 400, statusMessage: 'Missing identity' })
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
  const posts = await pdsAgent.com.atproto.repo.listRecords({
    repo: profile.data.did,
    collection: site.standard.document.$nsid,
    limit: 50,
  })

  const records = posts.data.records
    .filter(record => isStandardSiteMain(record.value))
    .map(record => {
      const value = record.value as StandardDocument
      return {
        uri: record.uri,
        cid: record.cid,
        title: value.title,
        publishedAt: value.publishedAt,
        description: value.description,
      }
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

  return {
    did: profile.data.did,
    handle: profile.data.handle,
    displayName: profile.data.displayName,
    description: profile.data.description,
    avatar: profile.data.avatar,
    records,
  }
})
