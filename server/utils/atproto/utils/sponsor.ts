import type * as blue from '#shared/types/lexicons/blue'
import * as net from '#shared/types/lexicons/net'
import { Client, toDatetimeString } from '@atproto/lex'
import type { AtUriString } from '@atproto/lex'
import { AccountUtils, type PopulatedAccount } from './account'

const HEADERS = { 'User-Agent': 'npmx' }
const LIST_LIMIT = 50

const CACHE_PREFIX = 'atproto-sponsor:'
const CACHE_SPONSORS_KEY = (did: string) => `${CACHE_PREFIX}${did}:sponsors`

export type SponsorEntry = Omit<net.atview.account.sponsor.Main, 'account'> & {
  account: PopulatedAccount | undefined
}

export class SponsorUtils {
  private readonly cache: CacheAdapter
  private readonly accountUtils: AccountUtils

  constructor() {
    this.cache = getCacheAdapter('generic')
    this.accountUtils = new AccountUtils()
  }

  async invalidateSponsorsCache(did: string): Promise<void> {
    await this.cache.delete(CACHE_SPONSORS_KEY(did))
  }

  /**
   * Lists the sponsor accounts referenced by `minidoc.did`, with each entry's
   * `account` hydrated.
   */
  async getSponsors(
    minidoc: blue.microcosm.identity.resolveMiniDoc.$OutputBody,
  ): Promise<SponsorEntry[]> {
    const cacheKey = CACHE_SPONSORS_KEY(minidoc.did)
    const cached = await this.cache.get<SponsorEntry[]>(cacheKey)
    if (cached) return cached

    const client = new Client(minidoc.pds, { headers: HEADERS })
    const response = await client.listRecords(net.atview.account.sponsor.$nsid, {
      limit: LIST_LIMIT,
      repo: minidoc.did,
    })

    const records = response.body.records.map(
      record => record.value as net.atview.account.sponsor.Main,
    )
    const populated = await this.accountUtils.populateAccounts(
      records.map(record => record.account),
    )
    const populatedByUri = new Map(populated.map(account => [account.uri, account]))

    const entries = records.map(record => ({
      ...record,
      account: populatedByUri.get(record.account),
    }))

    await this.cache.set(cacheKey, entries)
    return entries
  }

  async createSponsorConnection(
    writeClient: Client,
    ownerMinidoc: blue.microcosm.identity.resolveMiniDoc.$OutputBody,
    accountUri: string,
    note?: string,
  ): Promise<{ uri: string }> {
    const existing = await this.getSponsors(ownerMinidoc)
    if (existing.some(entry => entry.account?.uri === accountUri)) {
      throw createError({
        statusCode: 409,
        message: 'Sponsor connection already exists',
      })
    }

    const record = net.atview.account.sponsor.$build({
      account: accountUri as AtUriString,
      createdAt: toDatetimeString(new Date()),
      ...(note ? { note } : {}),
    })

    const result = await writeClient.create(net.atview.account.sponsor, record)
    if (!result?.uri) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to create sponsor connection' })
    }

    await this.invalidateSponsorsCache(ownerMinidoc.did)
    return { uri: result.uri }
  }
}
