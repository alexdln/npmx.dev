<script setup lang="ts">
import type { FetchError } from 'ofetch'
import type { AccountEntry } from '~/components/Profile/AccountsList.vue'
import { handleAuthError } from '~/utils/atproto/helpers'

export type RelatedAccountKind = 'ecosystem' | 'sponsors' | 'nested' | 'role'

const props = defineProps<{
  identity: string
  kind: RelatedAccountKind
  entries: AccountEntry[] | null
  roleRkey?: string
}>()

const emit = defineEmits<{
  added: []
}>()

const { user } = useAtproto()

const modalId = `add-related-account-modal-${props.kind}${props.roleRkey ? `-${props.roleRkey}` : ''}`
const modal = useModal(modalId)

const i18nPrefix = computed(() => `profile.${props.kind}` as const)

const postUrl = computed(() => {
  const base = `/api/social/profile/${props.identity}`
  if (props.kind === 'ecosystem') return `${base}/ecosystem`
  if (props.kind === 'sponsors') return `${base}/sponsors`
  if (props.kind === 'nested') return `${base}/nested`
  return `${base}/roles/${props.roleRkey}`
})

const duplicateMessages: Record<RelatedAccountKind, string> = {
  ecosystem: 'Ecosystem connection already exists',
  sponsors: 'Sponsor connection already exists',
  nested: 'Nested connection already exists',
  role: 'Role assignment already exists',
}

const {
  data: knownAccounts,
  status: knownAccountsStatus,
  error: knownAccountsError,
  execute: loadKnownAccounts,
} = useLazyFetch<NonNullable<AccountEntry['account']>[]>(
  () => `/api/social/profile/${props.identity}/accounts`,
  {
    immediate: false,
    default: () => [],
  },
)

const addingAccountUri = ref<string | null>(null)
const formError = ref<string | null>(null)

const existingAccountUris = computed(
  () =>
    new Set(
      (props.entries ?? [])
        .map(entry => entry.account?.uri)
        .filter((uri): uri is string => Boolean(uri)),
    ),
)

const availableAccounts = computed(() =>
  (knownAccounts.value ?? []).filter(
    account => account.uri && !existingAccountUris.value.has(account.uri),
  ),
)

function accountLabel(account: NonNullable<AccountEntry['account']>): string {
  return (
    account.actor?.displayName ||
    account.actor?.name ||
    account.actor?.handle ||
    account.handle ||
    $t('profile.related_accounts.unknown')
  )
}

function open() {
  formError.value = null
  addingAccountUri.value = null
  loadKnownAccounts()
  modal.open()
}

function close() {
  modal.close()
}

function resolveFormError(statusCode?: number, message?: string): string {
  if (statusCode === 409 || message === duplicateMessages[props.kind]) {
    return $t(`${i18nPrefix.value}.add_dialog.duplicate`)
  }
  return $t('common.error')
}

async function addAccount(accountUri: string) {
  if (addingAccountUri.value) return

  addingAccountUri.value = accountUri
  formError.value = null

  try {
    await $fetch(postUrl.value, {
      method: 'POST',
      body: { accountUri },
    })

    emit('added')
  } catch (error) {
    const fetchError = error as FetchError<{ message?: string }>
    formError.value = resolveFormError(fetchError.statusCode, fetchError.data?.message)

    try {
      await handleAuthError(fetchError, user.value?.handle)
    } catch {
      // Error message already set for non-auth failures.
    }
  } finally {
    addingAccountUri.value = null
  }
}

defineExpose({
  open,
  close,
})
</script>

<template>
  <Modal
    :id="modalId"
    :modal-title="$t(`${i18nPrefix}.add_dialog.title`)"
    :modal-subtitle="$t(`${i18nPrefix}.add_dialog.description`)"
    class="sm:max-w-lg"
  >
    <div v-if="knownAccountsStatus === 'pending'" class="space-y-3">
      <SkeletonBlock v-for="i in 3" :key="i" class="h-16 rounded-lg" />
    </div>

    <div v-else-if="knownAccountsStatus === 'error' || knownAccountsError">
      <p class="text-sm text-badge-orange">{{ $t('common.error') }}</p>
    </div>

    <div
      v-else-if="!knownAccounts?.length"
      class="p-4 bg-bg-subtle border border-border rounded-lg text-fg-muted text-sm"
    >
      {{ $t(`${i18nPrefix}.add_dialog.no_known_accounts`) }}
    </div>

    <div
      v-else-if="!availableAccounts.length"
      class="p-4 bg-bg-subtle border border-border rounded-lg text-fg-muted text-sm"
    >
      {{ $t(`${i18nPrefix}.add_dialog.all_added`) }}
    </div>

    <ul v-else class="space-y-2 max-h-[min(24rem,60vh)] overflow-y-auto">
      <li
        v-for="account in availableAccounts"
        :key="account.uri"
        class="flex items-center gap-3 p-3 bg-bg-subtle border border-border rounded-lg"
      >
        <div class="min-w-0 flex-1">
          <p class="font-mono text-sm font-medium truncate">
            {{ accountLabel(account) }}
          </p>
          <p v-if="account.handle" class="text-fg-muted text-xs truncate">@{{ account.handle }}</p>
        </div>
        <ButtonBase
          variant="primary"
          size="sm"
          :disabled="addingAccountUri !== null"
          @click="addAccount(account.uri!)"
        >
          {{ $t(`${i18nPrefix}.add_dialog.add`) }}
        </ButtonBase>
      </li>
    </ul>

    <p v-if="formError" class="mt-4 text-sm text-badge-orange" role="alert">
      {{ formError }}
    </p>

    <div class="mt-6 flex justify-end">
      <ButtonBase type="button" @click="close">
        {{ $t('common.close') }}
      </ButtonBase>
    </div>
  </Modal>
</template>
