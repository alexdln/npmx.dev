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
} = await useFetch<AccountEntry[]>(() => `/api/social/profile/${identity.value}/nested`, {
  default: () => [],
})

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
      <ProfileAccountsList
        :entries="nested"
        :status="nestedStatus"
        :error="nestedError"
        :empty-label="$t('profile.nested.empty')"
      />
    </section>
  </main>
</template>
