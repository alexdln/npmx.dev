import type * as blue from '#shared/types/lexicons/blue'
import * as net from '#shared/types/lexicons/net'
import { Client } from '@atproto/lex'

//Cache keys and helpers
const CACHE_PREFIX = 'atproto-nested:'
const CACHE_NESTED_KEY = (did: string) => `${CACHE_PREFIX}${did}:nested`

/**
 * Logic to handle and update package queries
 */
export class NestedUtils {
  private readonly cache: CacheAdapter

  constructor() {
    this.cache = getCacheAdapter('generic')
  }

  /**
   * Gets nested list based on a handle
   * @param handle
   * @returns
   */
  async getNested(
    minidoc: blue.microcosm.identity.resolveMiniDoc.$OutputBody,
  ): Promise<net.atview.account.nested.Main[] | undefined> {
    console.log('[getNested]', minidoc)
    const nestedKey = CACHE_NESTED_KEY(minidoc.did)
    const cachedNested = await this.cache.get<net.atview.account.nested.Main[]>(nestedKey)

    let nested: net.atview.account.nested.Main[] | undefined
    if (cachedNested) {
      nested = cachedNested
    } else {
      const client = new Client(minidoc.pds, {
        headers: { 'User-Agent': 'npmx' },
      })

      const response = await client.listRecords(net.atview.account.nested.$nsid, {
        limit: 50,
        repo: minidoc.did,
      })
      nested = response.body.records.map(record => record.value as net.atview.account.nested.Main)
    }

    return nested
  }
}
