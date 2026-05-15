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
  data: ecosystem,
  status: ecosystemStatus,
  error: ecosystemError,
  refresh: refreshEcosystem,
} = await useLazyFetch<AccountEntry[]>(() => `/api/social/profile/${identity.value}/ecosystem`, {
  default: () => [],
})

const canEdit = computed(() => user.value?.handle === profile.value?.handle)
const addRelatedAccountDialogRef = useTemplateRef('addRelatedAccountDialogRef')

useSeoMeta({
  title: () => `${identity.value} ecosystem - npmx`,
  description: () => `Ecosystem accounts for ${identity.value}`,
})
</script>

<template>
  <main class="container flex-1 flex flex-col py-8 sm:py-12 w-full">
    <ProfileHeader
      :profile="profile"
      :identity="identity"
      active-tab="ecosystem"
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
          {{ $t('profile.ecosystem.add') }}
        </ButtonBase>
      </div>

      <ProfileAccountsList
        :entries="ecosystem"
        :status="ecosystemStatus"
        :error="ecosystemError"
        :empty-label="$t('profile.ecosystem.empty')"
      />
    </section>

    <ProfileAddRelatedAccountDialog
      v-if="canEdit"
      ref="addRelatedAccountDialogRef"
      kind="ecosystem"
      :identity="identity"
      :entries="ecosystem"
      @added="refreshEcosystem"
    />
  </main>
</template>
