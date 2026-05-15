import * as blue from '#shared/types/lexicons/blue'
import * as net from '#shared/types/lexicons/net'
import { SLINGSHOT_HOST } from '#shared/utils/constants'
import { Client, isAtUriString, toDatetimeString } from '@atproto/lex'
import type { AtUriString } from '@atproto/lex'
import type { Backlink } from '#shared/utils/constellation'
import { AccountUtils, type PopulatedAccount } from './account'

const HEADERS = { 'User-Agent': 'npmx' }
const LIST_LIMIT = 50
const ROLE_USERS_LIMIT = 100

const CACHE_PREFIX = 'atproto-role:'
const CACHE_ROLES_KEY = (did: string) => `${CACHE_PREFIX}${did}:roles`

export type RoleUser = Backlink & {
  /** at-uri of the `net.atview.account.actor` record granted this role, if resolvable */
  accountUri?: string
  /** Hydrated account if the user's role record could be resolved */
  account?: PopulatedAccount
}

export type PopulatedRole = net.atview.managed.role.Main & {
  users: {
    total: number
    cursor: string | undefined
    list: RoleUser[]
  }
}

export type BaseRole = net.atview.managed.role.Main & {
  atUri: string
}

type RoleRecordWithUri = net.atview.managed.role.Main & { atUri: string }

export class RoleUtils {
  private readonly cache: CacheAdapter
  private readonly slingshotClient: Client
  private readonly constellation: Constellation
  private readonly accountUtils: AccountUtils

  constructor() {
    this.cache = getCacheAdapter('generic')
    this.slingshotClient = new Client(`https://${SLINGSHOT_HOST}`, { headers: HEADERS })
    this.accountUtils = new AccountUtils()
    this.constellation = new Constellation(
      // Wrap as CachedFetch since this util already does its own caching upstream
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

  async invalidateRolesCache(did: string): Promise<void> {
    await this.cache.delete(CACHE_ROLES_KEY(did))
  }

  /**
   * Lists role definitions managed by `minidoc.did`.
   */
  async getRoles(
    minidoc: blue.microcosm.identity.resolveMiniDoc.$OutputBody,
  ): Promise<RoleRecordWithUri[]> {
    const cacheKey = CACHE_ROLES_KEY(minidoc.did)
    const cached = await this.cache.get<RoleRecordWithUri[]>(cacheKey)
    if (cached) return cached

    const client = new Client(minidoc.pds, { headers: HEADERS })
    const response = await client.listRecords(net.atview.managed.role.$nsid, {
      limit: LIST_LIMIT,
      repo: minidoc.did,
    })
    const roles: RoleRecordWithUri[] = response.body.records.map(record => ({
      ...(record.value as net.atview.managed.role.Main),
      atUri: record.uri,
    }))
    await this.cache.set(cacheKey, roles)
    return roles
  }

  /**
   * Gets a role with its assigned users, each hydrated to a populated account
   * when their `net.atview.account.role` record can be resolved.
   */
  async getRole(
    minidoc: blue.microcosm.identity.resolveMiniDoc.$OutputBody,
    rkey: string,
  ): Promise<PopulatedRole> {
    const client = new Client(minidoc.pds, { headers: HEADERS })

    const [roleResponse, users] = await Promise.all([
      client.getRecord(net.atview.managed.role.$nsid, rkey, { repo: minidoc.did }),
      this.constellationRoleUsers(
        `at://${minidoc.did}/${net.atview.managed.role.$nsid}/${rkey}`,
        minidoc.did,
      ),
    ])

    const role = roleResponse.body.value as net.atview.managed.role.Main
    const populatedUsers = await this.populateRoleUsers(users.records)

    return {
      ...role,
      users: {
        total: users.total,
        cursor: users.cursor,
        list: populatedUsers,
      },
    }
  }

  /**
   * Creates a `net.atview.account.role` record on the owner's repo linking `accountUri`
   * to the managed role at `rkey`.
   */
  async createRoleAssignment(
    writeClient: Client,
    ownerMinidoc: blue.microcosm.identity.resolveMiniDoc.$OutputBody,
    rkey: string,
    accountUri: string,
  ): Promise<{ uri: string }> {
    const roleUri = `at://${ownerMinidoc.did}/${net.atview.managed.role.$nsid}/${rkey}`

    const record = net.atview.account.role.$build({
      role: roleUri as AtUriString,
      account: accountUri as AtUriString,
      createdAt: toDatetimeString(new Date()),
    })

    const result = await writeClient.create(net.atview.account.role, record)
    if (!result?.uri) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to create role assignment' })
    }

    await this.invalidateRolesCache(ownerMinidoc.did)
    return { uri: result.uri }
  }

  /**
   * Lists the role assignments (`net.atview.account.role` records) that link
   * other accounts to this role.
   */
  private async constellationRoleUsers(roleUri: string, did: string) {
    // todo: paginate to load all users
    const { data } = await this.constellation.getBackLinks(
      roleUri,
      net.atview.account.role.$nsid,
      'role',
      ROLE_USERS_LIMIT,
      undefined,
      undefined,
      [[did]],
    )
    return data
  }

  /**
   * For each user backlink, fetches the underlying `net.atview.account.role`
   * record to extract the linked account at-uri, then hydrates those accounts
   * in a single batched populate call.
   */
  private async populateRoleUsers(users: Backlink[]): Promise<RoleUser[]> {
    const accountUris = await Promise.all(users.map(user => this.getRoleAccountUri(user)))
    const populated = await this.accountUtils.populateAccounts(
      accountUris.filter((uri): uri is string => Boolean(uri)),
    )
    const populatedByUri = new Map(populated.map(account => [account.uri, account]))

    return users.map((user, index) => {
      const accountUri = accountUris[index]
      if (!accountUri) return user
      return {
        ...user,
        accountUri,
        account: populatedByUri.get(accountUri),
      }
    })
  }

  /**
   * Resolves a role-assignment backlink to the at-uri of the linked account.
   */
  private async getRoleAccountUri(backlink: Backlink): Promise<string | undefined> {
    if (backlink.collection !== net.atview.account.role.$nsid) return undefined

    const atUri = `at://${backlink.did}/${backlink.collection}/${backlink.rkey}`
    if (!isAtUriString(atUri)) return undefined

    try {
      const response = await this.slingshotClient.xrpcSafe(blue.microcosm.repo.getRecordByUri, {
        params: { at_uri: atUri },
      })
      if (!response.success) return undefined
      return (response.body.value as net.atview.account.role.Main).account
    } catch (error) {
      console.error('[role-account-uri]', atUri, error)
      return undefined
    }
  }
}
