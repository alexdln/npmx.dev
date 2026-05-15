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
  data: nested,
  status: nestedStatus,
  error: nestedError,
  refresh: refreshNested,
} = await useLazyFetch<AccountEntry[]>(() => `/api/social/profile/${identity.value}/nested`, {
  default: () => [],
})

const canEdit = computed(() => user.value?.handle === profile.value?.handle)
const addRelatedAccountDialogRef = useTemplateRef('addRelatedAccountDialogRef')

useSeoMeta({
  title: () => `${identity.value} nested - npmx`,
  description: () => `Nested accounts for ${identity.value}`,
})
</script>

<template>
  <main class="container flex-1 flex flex-col py-8 sm:py-12 w-full">
    <ProfileHeader
      :profile="profile"
      :identity="identity"
      active-tab="nested"
      :can-edit="user?.handle === profile?.handle"
      @update-profile="profile = $event"
    />

    <section class="mt-8">
      <div v-if="canEdit" class="flex justify-end mb-4">
        <ButtonBase
          variant="primary"
          classicon="i-lucide:plus"
          @click="addRelatedAccountDialogRef?.open"
        >
          {{ $t('profile.nested.add') }}
        </ButtonBase>
      </div>

      <ProfileAccountsList
        :entries="nested"
        :status="nestedStatus"
        :error="nestedError"
        :empty-label="$t('profile.nested.empty')"
      />
    </section>

    <ProfileAddRelatedAccountDialog
      v-if="canEdit"
      ref="addRelatedAccountDialogRef"
      kind="nested"
      :identity="identity"
      :entries="nested"
      :translations="{
        title: $t('profile.nested.add_dialog.title'),
        description: $t('profile.nested.add_dialog.description'),
        add: $t('profile.nested.add_dialog.add'),
        duplicate: $t('profile.nested.add_dialog.duplicate'),
        noKnownAccounts: $t('profile.nested.add_dialog.no_known_accounts'),
        allAdded: $t('profile.nested.add_dialog.all_added'),
        unknownAccount: $t('profile.related_accounts.unknown'),
      }"
      @added="refreshNested"
    />
  </main>
</template>
