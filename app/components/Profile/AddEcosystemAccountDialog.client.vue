<script setup lang="ts">
import type { FetchError } from 'ofetch'
import type { AccountEntry } from '~/components/Profile/AccountsList.vue'
import { handleAuthError } from '~/utils/atproto/helpers'

const props = defineProps<{
  identity: string
  ecosystem: AccountEntry[] | null
}>()

const emit = defineEmits<{
  added: []
}>()

const { user } = useAtproto()
const modal = useModal('add-ecosystem-account-modal')

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

const ecosystemAccountUris = computed(
  () =>
    new Set(
      (props.ecosystem ?? [])
        .map(entry => entry.account?.uri)
        .filter((uri): uri is string => Boolean(uri)),
    ),
)

const availableAccounts = computed(() =>
  (knownAccounts.value ?? []).filter(
    account => account.uri && !ecosystemAccountUris.value.has(account.uri),
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
  if (statusCode === 409 || message === 'Ecosystem connection already exists') {
    return $t('profile.ecosystem.add_dialog.duplicate')
  }
  return $t('common.error')
}

async function addAccount(accountUri: string) {
  if (addingAccountUri.value) return

  addingAccountUri.value = accountUri
  formError.value = null

  try {
    await $fetch(`/api/social/profile/${props.identity}/ecosystem`, {
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
    id="add-ecosystem-account-modal"
    :modal-title="$t('profile.ecosystem.add_dialog.title')"
    :modal-subtitle="$t('profile.ecosystem.add_dialog.description')"
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
      {{ $t('profile.ecosystem.add_dialog.no_known_accounts') }}
    </div>

    <div
      v-else-if="!availableAccounts.length"
      class="p-4 bg-bg-subtle border border-border rounded-lg text-fg-muted text-sm"
    >
      {{ $t('profile.ecosystem.add_dialog.all_added') }}
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
          {{ $t('profile.ecosystem.add_dialog.add') }}
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
