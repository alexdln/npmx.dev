<script setup lang="ts">
const route = useRoute('profile-identity')
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

const { user, pending: userPending } = useAtproto()

const { data: likes, status } = useProfileLikes(identity)

const showInviteSection = computed(() => {
  return (
    profile.value.recordExists === false &&
    status.value === 'success' &&
    !likes.value?.records?.length &&
    !userPending.value &&
    user.value?.handle !== profile.value.handle
  )
})

const inviteUrl = computed(() => {
  const text = $t('profile.invite.compose_text', { handle: profile.value.handle })
  return `https://bsky.app/intent/compose?text=${encodeURIComponent(text)}`
})
useSeoMeta({
  title: () => $t('profile.seo_title', { handle: identity.value }),
  description: () => $t('profile.seo_description', { handle: identity.value }),
})

defineOgImage(
  'Profile.takumi',
  {
    handle: () => profile.value.handle || identity.value,
    displayName: () => profile.value.displayName || '',
    description: () => profile.value.description || '',
  },
  {
    alt: () =>
      `Profile card for ${profile.value.displayName || profile.value.handle || identity.value}`,
  },
)
</script>

<template>
  <main class="container flex-1 flex flex-col py-8 sm:py-12 w-full">
    <ProfileHeader
      :profile="profile"
      :identity="identity"
      active-tab="likes"
      :can-edit="user?.handle === profile?.handle"
      @update-profile="profile = $event"
    />

    <section class="flex flex-col gap-8 mt-8">
      <div v-if="status === 'pending'" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonBlock v-for="i in 4" :key="i" class="h-16 rounded-lg" />
      </div>
      <div v-else-if="status === 'error'">
        <p>{{ $t('common.error') }}</p>
      </div>
      <div v-else-if="likes?.records" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PackageLikeCard v-for="like in likes.records" :packageUrl="like.value.subjectRef" />
      </div>

      <!-- Invite section: shown when user does not have npmx profile or any like lexicons -->
      <div
        v-if="showInviteSection"
        class="flex flex-col items-start gap-4 p-6 bg-bg-subtle border border-border rounded-lg"
      >
        <p class="text-fg-muted">
          {{ $t('profile.invite.message') }}
        </p>
        <LinkBase variant="button-secondary" classicon="i-simple-icons:bluesky" :to="inviteUrl">
          {{ $t('profile.invite.share_button') }}
        </LinkBase>
      </div>
    </section>
  </main>
</template>
