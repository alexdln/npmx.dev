<script setup lang="ts">
type SponsorAccount = {
  uri?: string
  handle?: string
  actor?: {
    handle?: string
    displayName?: string
    description?: string
  }
}

type SponsorEntry = {
  account?: SponsorAccount
}

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
} = await useFetch<SponsorEntry[]>(() => `/api/social/profile/${identity.value}/sponsors`, {
  default: () => [],
})

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

    <section class="flex flex-col gap-8 mt-8">
      <div v-if="sponsorsStatus === 'pending'" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonBlock v-for="i in 4" :key="i" class="h-20 rounded-lg" />
      </div>
      <div v-else-if="sponsorsStatus === 'error' || sponsorsError">
        <p>{{ $t('common.error') }}</p>
      </div>
      <div v-else-if="sponsors?.length" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          v-for="(sponsor, index) in sponsors"
          :key="sponsor.account?.uri ?? `sponsor-${index}`"
          class="p-4 bg-bg-subtle border border-border rounded-lg decoration-none"
        >
          <p class="font-mono text-sm truncate">
            {{
              sponsor.account?.actor?.displayName ?? sponsor.account?.handle ?? 'Unknown sponsor'
            }}
          </p>
          <p v-if="sponsor.account?.handle" class="text-fg-muted text-sm truncate">
            @{{ sponsor.account?.handle }}
          </p>
          <p v-if="sponsor.account?.actor?.description" class="text-sm mt-1 line-clamp-2">
            {{ sponsor.account?.actor?.description }}
          </p>
        </div>
      </div>
      <div v-else class="p-4 bg-bg-subtle border border-border rounded-lg text-fg-muted">
        {{ $t('profile.sponsors.no_sponsors') }}
      </div>
    </section>
  </main>
</template>
