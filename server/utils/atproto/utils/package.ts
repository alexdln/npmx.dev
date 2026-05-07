import type * as blue from '#shared/types/lexicons/blue'
import * as net from '#shared/types/lexicons/net'
import { Client } from '@atproto/lex'

//Cache keys and helpers
const CACHE_PREFIX = 'atproto-package:'
const CACHE_PACKAGES_KEY = (did: string) => `${CACHE_PREFIX}${did}:packages`

/**
 * Logic to handle and update package queries
 */
export class PackageUtils {
  private readonly cache: CacheAdapter

  constructor() {
    this.cache = getCacheAdapter('generic')
  }

  /**
   * Gets packages list based on a handle
   * @param handle
   * @returns
   */
  async getPackages(
    minidoc: blue.microcosm.identity.resolveMiniDoc.$OutputBody,
  ): Promise<net.atview.external.npmpackage.Main[] | undefined> {
    console.log('[getPackages]', minidoc)
    const packagesKey = CACHE_PACKAGES_KEY(minidoc.did)
    const cachedPackages = await this.cache.get<net.atview.external.npmpackage.Main[]>(packagesKey)

    let packages: net.atview.external.npmpackage.Main[] | undefined
    if (cachedPackages) {
      packages = cachedPackages
    } else {
      const client = new Client(minidoc.pds, {
        headers: { 'User-Agent': 'npmx' },
      })

      const response = await client.listRecords(net.atview.external.npmpackage.$nsid, {
        limit: 50,
        repo: minidoc.did,
      })
      packages = response.body.records.map(
        record => record.value as net.atview.external.npmpackage.Main,
      )
    }

    return packages
  }
}
