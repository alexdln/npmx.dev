import type * as blue from '#shared/types/lexicons/blue'
import * as net from '#shared/types/lexicons/net'
import { Client } from '@atproto/lex'

//Cache keys and helpers
const CACHE_PREFIX = 'atproto-role:'
const CACHE_ROLE_KEY = (did: string) => `${CACHE_PREFIX}${did}:role`
export type ConstellationLike = Pick<Constellation, 'getBackLinks' | 'getLinksDistinctDids'>

/**
 * Logic to handle and update package queries
 */
export class RoleUtils {
  private readonly cache: CacheAdapter
  private readonly constellation: ConstellationLike

  constructor() {
    this.cache = getCacheAdapter('generic')
    this.constellation = new Constellation(
      // Passes in a fetch wrapped as CachedFetch because we're already doing some heavy caching here
      async <T = unknown>(
        url: string,
        options: Parameters<typeof $fetch>[1] = {},
        _ttl?: number,
      ): Promise<CachedFetchResult<T>> => {
        const data = (await $fetch<T>(url, options)) as T
        return { data, isStale: false, cachedAt: null }
      },
    )
  }
  /**
   * Gets the true total count of likes for a npm package from the network
   * @param subjectRef
   * @returns
   */
  private async constellationRoleUsers(subjectRef: string, did: string) {
    // todo: load all users recursively
    const { data } = await this.constellation.getBackLinks(
      subjectRef,
      net.atview.account.role.$nsid,
      'role',
      100,
      undefined,
      undefined,
      [[did]],
    )
    return data
  }

  /**
   * Gets role list based on a handle
   * @param handle
   * @returns
   */
  async getRoles(
    minidoc: blue.microcosm.identity.resolveMiniDoc.$OutputBody,
  ): Promise<net.atview.managed.role.Main[] | undefined> {
    console.log('[getRole]', minidoc)
    const roleKey = CACHE_ROLE_KEY(minidoc.did)
    const cachedRole = await this.cache.get<net.atview.managed.role.Main[]>(roleKey)

    let role: net.atview.managed.role.Main[] | undefined
    if (cachedRole) {
      role = cachedRole
    } else {
      const client = new Client(minidoc.pds, {
        headers: { 'User-Agent': 'npmx' },
      })

      const response = await client.listRecords(net.atview.managed.role.$nsid, {
        limit: 50,
        repo: minidoc.did,
      })
      role = response.body.records.map(record => record.value as net.atview.managed.role.Main)
    }

    return role
  }

  async getRole(minidoc: blue.microcosm.identity.resolveMiniDoc.$OutputBody, roleId: string) {
    console.log('[getRole]', minidoc, roleId)
    // const roleKey = CACHE_ROLE_KEY(minidoc.did)
    // const cachedRole = await this.cache.get<net.atview.managed.role.Main>(roleKey)

    // if (cachedRole) {
    //   return cachedRole
    // }

    const client = new Client(minidoc.pds, {
      headers: { 'User-Agent': 'npmx' },
    })

    const response = await client.getRecord(net.atview.managed.role.$nsid, roleId, {
      repo: minidoc.did,
    })

    const roleData = response.body.value as net.atview.managed.role.Main

    const users = await this.constellationRoleUsers(
      `at://${minidoc.did}/net.atview.managed.role/${roleId}`,
      minidoc.did,
    )

    return {
      ...roleData,
      users,
    }
  }
}
