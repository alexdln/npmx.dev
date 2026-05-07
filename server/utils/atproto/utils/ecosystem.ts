import type * as blue from '#shared/types/lexicons/blue'
import * as net from '#shared/types/lexicons/net'
import { Client } from '@atproto/lex'

//Cache keys and helpers
const CACHE_PREFIX = 'atproto-ecosystem:'
const CACHE_ECOSYSTEM_KEY = (did: string) => `${CACHE_PREFIX}${did}:ecosystem`

/**
 * Logic to handle and update package queries
 */
export class EcosystemUtils {
  private readonly cache: CacheAdapter

  constructor() {
    this.cache = getCacheAdapter('generic')
  }

  /**
   * Gets ecosystem list based on a handle
   * @param handle
   * @returns
   */
  async getEcosystem(
    minidoc: blue.microcosm.identity.resolveMiniDoc.$OutputBody,
  ): Promise<net.atview.account.ecosystem.Main[] | undefined> {
    console.log('[getEcosystem]', minidoc)
    const ecosystemKey = CACHE_ECOSYSTEM_KEY(minidoc.did)
    const cachedEcosystem = await this.cache.get<net.atview.account.ecosystem.Main[]>(ecosystemKey)

    let ecosystem: net.atview.account.ecosystem.Main[] | undefined
    if (cachedEcosystem) {
      ecosystem = cachedEcosystem
    } else {
      const client = new Client(minidoc.pds, {
        headers: { 'User-Agent': 'npmx' },
      })

      const response = await client.listRecords(net.atview.account.ecosystem.$nsid, {
        limit: 50,
        repo: minidoc.did,
      })
      ecosystem = response.body.records.map(
        record => record.value as net.atview.account.ecosystem.Main,
      )
    }

    return ecosystem
  }
}
