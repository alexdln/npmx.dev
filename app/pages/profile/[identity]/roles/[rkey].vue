<script setup lang="ts">
import type { AccountEntry } from '~/components/Profile/AccountsList.vue'

type RoleDetail = {
  name: string
  description?: string
  color?: string
  createdAt: string
  users: {
    total: number
    cursor: string | undefined
    list: { account?: AccountEntry['account'] }[]
  }
}

const route = useRoute()
const identity = computed(() => route.params.identity)
const rkey = computed(() => route.params.rkey?.toString() ?? '')
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
  data: role,
  error: roleError,
  status: roleStatus,
} = await useFetch<RoleDetail>(() => `/api/social/profile/${identity.value}/roles/${rkey.value}`)

if (import.meta.server && roleError.value?.statusCode === 404) {
  throw createError({
    statusCode: 404,
    statusMessage: $t('profile.roles.not_found'),
    message: $t('profile.roles.not_found_message', { handle: identity.value }),
  })
}

const assignees = computed(() => {
  const list = role.value?.users.list
  if (!list?.length) return []
  return list.map(user => ({ account: user.account }))
})

useSeoMeta({
  title: () =>
    role.value ? `${role.value.name} · ${identity.value} - npmx` : `${identity.value} - npmx`,
  description: () =>
    role.value?.description ?? $t('profile.roles.detail_seo_fallback', { handle: identity.value }),
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

    <section class="flex flex-col gap-8 mt-8">
      <div v-if="roleStatus === 'pending'" class="space-y-4">
        <SkeletonBlock class="h-10 max-w-md rounded-lg" />
        <SkeletonBlock class="h-16 max-w-2xl rounded-lg" />
      </div>
      <div v-else-if="roleStatus === 'error' || roleError">
        <p>{{ $t('common.error') }}</p>
      </div>
      <template v-else-if="role">
        <header class="flex items-start gap-3">
          <span
            v-if="role.color"
            class="shrink-0 mt-1 size-4 rounded-full border border-border"
            :style="{ backgroundColor: role.color }"
            aria-hidden="true"
          />
          <div class="min-w-0 w-full">
            <div class="flex items-center gap-2 w-full justify-between">
              <h2 class="font-mono text-xl sm:text-2xl font-medium">
                {{ role.name }}
              </h2>
              <LinkBase
                :to="`/profile/${identity}/roles`"
                class="text-sm font-mono text-fg-muted decoration-none hover:text-accent w-fit"
              >
                ← {{ $t('profile.roles.back_to_list') }}
              </LinkBase>
            </div>
            <p v-if="role.description" class="text-fg-muted mt-2 max-w-2xl">
              {{ role.description }}
            </p>
          </div>
        </header>

        <div>
          <h2 class="font-mono uppercase text-fg-muted mb-4">
            {{ $t('profile.roles.assignees') }}
          </h2>
          <ProfileAccountsList
            :entries="assignees"
            :status="roleStatus"
            :error="roleError"
            :empty-label="$t('profile.roles.no_assignees')"
          />
        </div>
      </template>
    </section>
  </main>
</template>
