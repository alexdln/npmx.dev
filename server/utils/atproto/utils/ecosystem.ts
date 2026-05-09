import type * as blue from '#shared/types/lexicons/blue'
import * as net from '#shared/types/lexicons/net'
import { Client } from '@atproto/lex'
import { AccountUtils, type PopulatedAccount } from './account'

const HEADERS = { 'User-Agent': 'npmx' }
const LIST_LIMIT = 50

const CACHE_PREFIX = 'atproto-ecosystem:'
const CACHE_ECOSYSTEM_KEY = (did: string) => `${CACHE_PREFIX}${did}:ecosystem`

export type EcosystemEntry = Omit<net.atview.account.ecosystem.Main, 'account'> & {
  account: PopulatedAccount | undefined
}

export class EcosystemUtils {
  private readonly cache: CacheAdapter
  private readonly accountUtils: AccountUtils

  constructor() {
    this.cache = getCacheAdapter('generic')
    this.accountUtils = new AccountUtils()
  }

  /**
   * Lists the ecosystem accounts referenced by `minidoc.did`, with each entry's
   * `account` hydrated.
   */
  async getEcosystem(
    minidoc: blue.microcosm.identity.resolveMiniDoc.$OutputBody,
  ): Promise<EcosystemEntry[]> {
    const cacheKey = CACHE_ECOSYSTEM_KEY(minidoc.did)
    const cached = await this.cache.get<EcosystemEntry[]>(cacheKey)
    if (cached) return cached

    const client = new Client(minidoc.pds, { headers: HEADERS })
    const response = await client.listRecords(net.atview.account.ecosystem.$nsid, {
      limit: LIST_LIMIT,
      repo: minidoc.did,
    })

    const records = response.body.records.map(
      record => record.value as net.atview.account.ecosystem.Main,
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
}
