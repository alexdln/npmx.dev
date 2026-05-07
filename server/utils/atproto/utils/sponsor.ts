import type * as blue from '#shared/types/lexicons/blue'
import * as net from '#shared/types/lexicons/net'
import { Client } from '@atproto/lex'

//Cache keys and helpers
const CACHE_PREFIX = 'atproto-sponsor:'
const CACHE_SPONSORS_KEY = (did: string) => `${CACHE_PREFIX}${did}:sponsors`

/**
 * Logic to handle and update package queries
 */
export class SponsorUtils {
  private readonly cache: CacheAdapter

  constructor() {
    this.cache = getCacheAdapter('generic')
  }

  /**
   * Gets sponsors list based on a handle
   * @param handle
   * @returns
   */
  async getSponsors(
    minidoc: blue.microcosm.identity.resolveMiniDoc.$OutputBody,
  ): Promise<net.atview.account.sponsor.Main[] | undefined> {
    console.log('[getSponsors]', minidoc)
    const sponsorsKey = CACHE_SPONSORS_KEY(minidoc.did)
    const cachedSponsors = await this.cache.get<net.atview.account.sponsor.Main[]>(sponsorsKey)

    let sponsors: net.atview.account.sponsor.Main[] | undefined
    if (cachedSponsors) {
      sponsors = cachedSponsors
    } else {
      const client = new Client(minidoc.pds, {
        headers: { 'User-Agent': 'npmx' },
      })

      const response = await client.listRecords(net.atview.account.sponsor.$nsid, {
        limit: 50,
        repo: minidoc.did,
      })
      sponsors = response.body.records.map(
        record => record.value as net.atview.account.sponsor.Main,
      )
    }

    return sponsors
  }
}
