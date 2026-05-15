<script setup lang="ts">
import type { AccountEntry } from '~/components/Profile/AccountsList.vue'

const route = useRoute()
const identity = computed(() => route.params.identity)
const { user } = useAtproto()

const { data: profile, error: profileError } = await useFetch<NPMXProfile>(
  () => `/api/social/profile/${identity.value}`,
  {
    default: () => ({
      displayName: identity.value,
      description: '',
      website: '',
      recordExists: false,
    }),
  },
)

if (!profile.value || profileError.value?.statusCode === 404) {
  throw createError({
    statusCode: 404,
    statusMessage: $t('profile.not_found'),
    message: $t('profile.not_found_message', { handle: identity.value }),
  })
}

const {
  data: accounts,
  status: accountsStatus,
  error: accountsError,
  refresh: refreshAccounts,
} = await useLazyFetch<AccountEntry['account'][]>(
  () => `/api/social/profile/${identity.value}/accounts`,
  {
    default: () => [],
  },
)

const entries = computed<AccountEntry[]>(() => (accounts.value ?? []).map(account => ({ account })))
const canEdit = computed(() => user.value?.handle === profile.value?.handle)
const addAccountDialogRef = useTemplateRef('addAccountDialogRef')

useSeoMeta({
  title: () => `${identity.value} accounts - npmx`,
  description: () => `Accounts for ${identity.value}`,
})
</script>

<template>
  <main class="container flex-1 flex flex-col py-8 sm:py-12 w-full">
    <ProfileHeader
      :profile="profile"
      :identity="identity"
      active-tab="known-accounts"
      :can-edit="user?.handle === profile?.handle"
      @update-profile="profile = $event"
    />

    <section class="mt-8">
      <div v-if="canEdit" class="flex justify-end mb-4">
        <ButtonBase
          variant="primary"
          classicon="i-lucide:plus"
          @click="addAccountDialogRef?.open()"
        >
          {{ $t('profile.known_accounts.add') }}
        </ButtonBase>
      </div>

      <ProfileAccountsList
        :entries="entries"
        :status="accountsStatus"
        :error="accountsError"
        :empty-label="$t('profile.known_accounts.empty')"
      />
    </section>

    <ProfileAddKnownAccountDialog
      v-if="canEdit"
      ref="addAccountDialogRef"
      :identity="identity"
      @added="refreshAccounts()"
    />
  </main>
</template>
