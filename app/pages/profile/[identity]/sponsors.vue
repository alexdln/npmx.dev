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
  data: sponsors,
  status: sponsorsStatus,
  error: sponsorsError,
  refresh: refreshSponsors,
} = await useLazyFetch<AccountEntry[]>(() => `/api/social/profile/${identity.value}/sponsors`, {
  default: () => [],
})

const canEdit = computed(() => user.value?.handle === profile.value?.handle)
const addRelatedAccountDialogRef = useTemplateRef('addRelatedAccountDialogRef')

useSeoMeta({
  title: () => `${identity.value} sponsors - npmx`,
  description: () => `Sponsors supporting ${identity.value}`,
})
</script>

<template>
  <main class="container flex-1 flex flex-col py-8 sm:py-12 w-full">
    <ProfileHeader
      :profile="profile"
      :identity="identity"
      active-tab="sponsors"
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
          {{ $t('profile.sponsors.add') }}
        </ButtonBase>
      </div>

      <ProfileAccountsList
        :entries="sponsors"
        :status="sponsorsStatus"
        :error="sponsorsError"
        :empty-label="$t('profile.sponsors.no_sponsors')"
      />
    </section>

    <ProfileAddRelatedAccountDialog
      v-if="canEdit"
      ref="addRelatedAccountDialogRef"
      kind="sponsors"
      :identity="identity"
      :entries="sponsors"
      :translations="{
        title: $t('profile.sponsors.add_dialog.title'),
        description: $t('profile.sponsors.add_dialog.description'),
        add: $t('profile.sponsors.add_dialog.add'),
        duplicate: $t('profile.sponsors.add_dialog.duplicate'),
        noKnownAccounts: $t('profile.sponsors.add_dialog.no_known_accounts'),
        allAdded: $t('profile.sponsors.add_dialog.all_added'),
        unknownAccount: $t('profile.related_accounts.unknown'),
      }"
      @added="refreshSponsors"
    />
  </main>
</template>
