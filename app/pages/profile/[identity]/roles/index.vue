<script setup lang="ts">
import { AtUri } from '@atproto/syntax'

type RoleListItem = {
  atUri: string
  name: string
  description?: string
  color?: string
  createdAt: string
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
  data: roles,
  status: rolesStatus,
  error: rolesError,
} = await useLazyFetch<RoleListItem[]>(() => `/api/social/profile/${identity.value}/roles`, {
  default: () => [],
})

useSeoMeta({
  title: () => `${identity.value} roles - npmx`,
  description: () => $t('profile.roles.seo_description', { handle: identity.value }),
})
</script>

<template>
  <main class="container flex-1 flex flex-col py-8 sm:py-12 w-full">
    <ProfileHeader
      :profile="profile"
      :identity="identity"
      active-tab="roles"
      :can-edit="user?.handle === profile?.handle"
      @update-profile="profile = $event"
    />

    <section class="mt-8">
      <div v-if="rolesStatus === 'pending'" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonBlock v-for="i in 4" :key="i" class="h-20 rounded-lg" />
      </div>
      <div v-else-if="rolesStatus === 'error' || rolesError">
        <p>{{ $t('common.error') }}</p>
      </div>
      <div v-else-if="roles?.length" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LinkBase
          v-for="(role, index) in roles"
          :key="role.atUri ?? `role-${index}`"
          :to="`/profile/${identity}/roles/${new AtUri(role.atUri).rkey}`"
          class="p-4 bg-bg-subtle border border-border rounded-lg decoration-none block transition-[border-color] hover:border-accent/50"
        >
          <div class="flex items-start gap-3">
            <span
              v-if="role.color"
              class="shrink-0 mt-1 size-3 rounded-full border border-border"
              :style="{ backgroundColor: role.color }"
              aria-hidden="true"
            />
            <div class="min-w-0 flex-1">
              <p class="font-mono text-sm truncate">
                {{ role.name }}
              </p>
              <p v-if="role.description" class="text-sm mt-1 line-clamp-2 text-fg-muted">
                {{ role.description }}
              </p>
            </div>
          </div>
        </LinkBase>
      </div>
      <div v-else class="p-4 bg-bg-subtle border border-border rounded-lg text-fg-muted">
        {{ $t('profile.roles.empty') }}
      </div>
    </section>
  </main>
</template>
