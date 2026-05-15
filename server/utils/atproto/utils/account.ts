import * as blue from '#shared/types/lexicons/blue'
import * as net from '#shared/types/lexicons/net'
import * as app from '#shared/types/lexicons/app'
import { SLINGSHOT_HOST } from '#shared/utils/constants'
import { Client } from '@atproto/lex'
import { AtUri } from '@atproto/syntax'
import { IdentityUtils } from './identity'

const HEADERS = { 'User-Agent': 'npmx' }
const LIST_LIMIT = 50

const ACCOUNT_NSID = net.atview.account.actor.$nsid

const SUPPORTED_PROFILE_NSIDS = new Set([
  app.bsky.actor.profile.$nsid,
  net.atview.managed.profile.$nsid,
])

const CACHE_PREFIX = 'atproto-account:'
const CACHE_ACCOUNT_KEY = (uri: string) => `${CACHE_PREFIX}${uri}`
const CACHE_ACCOUNTS_LIST_KEY = (did: string) => `${CACHE_PREFIX}${did}:list`

export type AccountActorRecord = app.bsky.actor.profile.Main | net.atview.managed.profile.Main

export type PopulatedAccount = Omit<net.atview.account.actor.Main, 'actor'> & {
  /** at-uri of the source `net.atview.account.actor` record */
  uri: string
  /** Resolved underlying profile record */
  actor: AccountActorRecord
  /** at-uri of the underlying profile record */
  actorUri: string
  handle: string | undefined
}

/**
 * Resolves `net.atview.account.actor` records into fully-populated accounts,
 * hydrating the underlying actor profile (bsky or managed).
 */
export class AccountUtils {
  private readonly cache: CacheAdapter
  private readonly slingshotClient: Client
  private readonly constellation: Constellation
  private readonly identityUtils: IdentityUtils

  constructor() {
    this.cache = getCacheAdapter('generic')
    this.slingshotClient = new Client(`https://${SLINGSHOT_HOST}`, { headers: HEADERS })
    this.constellation = new Constellation(
      async <T = unknown>(
        url: string,
        options: Parameters<typeof $fetch>[1] = {},
        _ttl?: number,
      ): Promise<CachedFetchResult<T>> => {
        const data = (await $fetch<T>(url, options)) as T
        return { data, isStale: false, cachedAt: null }
      },
    )
    this.identityUtils = new IdentityUtils()
  }

  /**
   * Populates a single account at-uri.
   */
  async populateAccount(uri: string): Promise<PopulatedAccount | undefined> {
    const atUri = new AtUri(uri)

    if (atUri.collection !== ACCOUNT_NSID) return undefined

    const cacheKey = CACHE_ACCOUNT_KEY(uri)
    const cached = await this.cache.get<PopulatedAccount>(cacheKey)
    if (cached) return cached

    try {
      const accountResponse = await this.slingshotClient.xrpcSafe(
        blue.microcosm.repo.getRecordByUri,
        { params: { at_uri: atUri.toString() } },
      )

      if (!accountResponse.success) return undefined

      const account = accountResponse.body.value as net.atview.account.actor.Main
      const actorAtUri = new AtUri(account.actor)

      if (!SUPPORTED_PROFILE_NSIDS.has(actorAtUri.collection)) return undefined

      const actorResponse = await this.slingshotClient.xrpcSafe(
        blue.microcosm.repo.getRecordByUri,
        { params: { at_uri: actorAtUri.toString() } },
      )

      if (!actorResponse.success) return undefined

      let handle: string | undefined
      console.log('actorAtUri', actorAtUri)

      if (app.bsky.actor.profile.$nsid === actorAtUri.collection) {
        try {
          const miniDoc = await this.identityUtils.getMiniDoc(actorAtUri.host)
          handle = miniDoc.handle === 'handle.invalid' ? undefined : miniDoc.handle
        } catch {
          handle = undefined
        }
      }

      const populated: PopulatedAccount = {
        ...account,
        uri: atUri.toString(),
        actor: actorResponse.body.value as AccountActorRecord,
        actorUri: actorAtUri.toString(),
        handle,
      }
      await this.cache.set(cacheKey, populated)
      return populated
    } catch (error) {
      console.error('[populate-account]', uri, error)
      return undefined
    }
  }

  /**
   * Populates multiple account at-uris in parallel. Duplicates are deduplicated
   * before fetching and failed lookups are silently dropped while preserving
   * the input order of successful results.
   */
  async populateAccounts(uris: readonly string[]): Promise<PopulatedAccount[]> {
    if (!uris.length) return []

    const urisFiltered = Array.from(new Set(uris))
    // todo: improve concurrency
    const populated = await Promise.all(urisFiltered.map(uri => this.populateAccount(uri)))
    return populated.filter(item => item !== undefined)
  }

  async invalidateAccountsCache(did: string): Promise<void> {
    await this.cache.delete(CACHE_ACCOUNTS_LIST_KEY(did))
  }

  /**
   * Lists all `net.atview.account.actor` records on `minidoc.did`, hydrated.
   */
  async getAccounts(
    minidoc: blue.microcosm.identity.resolveMiniDoc.$OutputBody,
  ): Promise<PopulatedAccount[]> {
    const cacheKey = CACHE_ACCOUNTS_LIST_KEY(minidoc.did)
    const cached = await this.cache.get<PopulatedAccount[]>(cacheKey)
    if (cached) return cached

    const client = new Client(minidoc.pds, { headers: HEADERS })
    const response = await client.listRecords(ACCOUNT_NSID, {
      limit: LIST_LIMIT,
      repo: minidoc.did,
    })

    const populated = await this.populateAccounts(response.body.records.map(record => record.uri))
    await this.cache.set(cacheKey, populated)
    return populated
  }

  async findAccountByActor(repoDid: string, subject: string): Promise<string | undefined> {
    const { data } = await this.constellation.getBackLinks(
      subject,
      ACCOUNT_NSID,
      'actor',
      1,
      undefined,
      undefined,
      [[repoDid]],
    )

    const backlink = data.records[0]
    if (!backlink || backlink.collection !== ACCOUNT_NSID) return undefined

    return `at://${backlink.did}/${backlink.collection}/${backlink.rkey}`
  }

  /**
   * Gets a populated account by `did + rkey`.
   */
  async getAccount(
    minidoc: blue.microcosm.identity.resolveMiniDoc.$OutputBody,
    rkey: string,
  ): Promise<PopulatedAccount | undefined> {
    return this.populateAccount(`at://${minidoc.did}/${ACCOUNT_NSID}/${rkey}`)
  }
}
