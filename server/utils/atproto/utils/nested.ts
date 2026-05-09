import type * as blue from '#shared/types/lexicons/blue'
import * as net from '#shared/types/lexicons/net'
import { Client } from '@atproto/lex'
import { AccountUtils, type PopulatedAccount } from './account'

const HEADERS = { 'User-Agent': 'npmx' }
const LIST_LIMIT = 50

const CACHE_PREFIX = 'atproto-nested:'
const CACHE_NESTED_KEY = (did: string) => `${CACHE_PREFIX}${did}:nested`

export type NestedEntry = Omit<net.atview.account.nested.Main, 'account'> & {
  account: PopulatedAccount | undefined
}

export class NestedUtils {
  private readonly cache: CacheAdapter
  private readonly accountUtils: AccountUtils

  constructor() {
    this.cache = getCacheAdapter('generic')
    this.accountUtils = new AccountUtils()
  }

  /**
   * Lists the nested accounts referenced by `minidoc.did`, with each entry's
   * `account` hydrated.
   */
  async getNested(
    minidoc: blue.microcosm.identity.resolveMiniDoc.$OutputBody,
  ): Promise<NestedEntry[]> {
    const cacheKey = CACHE_NESTED_KEY(minidoc.did)
    const cached = await this.cache.get<NestedEntry[]>(cacheKey)
    if (cached) return cached

    const client = new Client(minidoc.pds, { headers: HEADERS })
    const response = await client.listRecords(net.atview.account.nested.$nsid, {
      limit: LIST_LIMIT,
      repo: minidoc.did,
    })

    const records = response.body.records.map(
      record => record.value as net.atview.account.nested.Main,
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
