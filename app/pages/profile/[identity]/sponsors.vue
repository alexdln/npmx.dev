<script setup lang="ts">
import { getSafeHttpUrl } from '#shared/utils/url'

type SponsorAccount = {
  uri?: string
  handle?: string
  actor?: {
    handle?: string
    displayName?: string
    description?: string
    avatar?: string
  }
}

type SponsorEntry = {
  account?: SponsorAccount
}

const route = useRoute()
const identity = computed(() => route.params.identity)

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

const profileTabs = computed(() => [
  {
    key: 'likes',
    label: $t('profile.likes'),
    to: { name: 'profile-identity' as const, params: { identity: identity.value } },
  },
  {
    key: 'sponsors',
    label: $t('about.sponsors.title'),
    to: `/profile/${identity.value}/sponsors`,
  },
])

const safeProfileWebsiteUrl = computed(() => getSafeHttpUrl(profile.value.website))

useSeoMeta({
  title: () => `${identity.value} sponsors - npmx`,
  description: () => `Sponsors supporting ${identity.value}`,
})
</script>

<template>
  <main class="container flex-1 flex flex-col py-8 sm:py-12 w-full">
    <header class="mb-8 pb-8 border-b border-border">
      <div class="flex flex-col flex-wrap gap-4">
        <h1 v-if="profile.displayName" class="font-mono text-2xl sm:text-3xl font-medium">
          {{ profile.displayName }}
        </h1>
        <p v-if="profile.description">{{ profile.description }}</p>
        <div class="flex gap-4 items-center font-mono text-sm">
          <h2>@{{ profile.handle ?? identity }}</h2>
          <LinkBase
            v-if="safeProfileWebsiteUrl"
            :to="safeProfileWebsiteUrl"
            classicon="i-lucide:link"
          >
            {{ profile.website }}
          </LinkBase>
        </div>
      </div>
    </header>

    <section class="flex flex-col gap-8">
      <TabLinks
        :aria-label="$t('about.sponsors.title')"
        :links="profileTabs"
        active-key="sponsors"
      />
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
        {{ $t('about.sponsors.title') }}: 0
      </div>
    </section>
  </main>
</template>
