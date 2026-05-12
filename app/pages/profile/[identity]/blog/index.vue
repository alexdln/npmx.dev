<script setup lang="ts">
import { AtUri } from '@atproto/api'

definePageMeta({
  name: 'profile-identity-blog',
})

const route = useRoute()
const identity = computed(() => route.params.identity)

type ProfileBlogRecordsResponse = {
  did: string
  handle: string
  displayName?: string
  description?: string
  avatar?: string
  records: {
    uri: string
    cid: string
    title: string
    publishedAt: string
    description?: string
  }[]
}

const { data: blogData } = await useAsyncData(
  () => `profile-blog-records-${identity.value}`,
  async () => {
    return await $fetch<ProfileBlogRecordsResponse>(
      `/api/profile/${encodeURIComponent(identity.value)}/blog/records`,
    )
  },
  { watch: [identity] },
)

const displayHandle = computed(() => blogData.value?.handle || identity.value)

const postLinks = computed(() => {
  const rows = blogData.value?.records || []
  return rows.map(record => {
    const atUri = new AtUri(record.uri)
    return {
      ...record,
      rkey: atUri.rkey,
    }
  })
})

useSeoMeta({
  title: () => `${$t('footer.blog')} (@${displayHandle.value}) - npmx`,
  description: () => $t('profile.seo_description', { handle: displayHandle.value }),
})
</script>

<template>
  <main class="container flex-1 flex flex-col py-8 sm:py-12 w-full max-w-2xl">
    <p class="mb-6">
      <NuxtLink
        :to="{ name: 'profile-identity', params: { identity } }"
        class="text-sm text-fg-muted hover:text-fg underline underline-offset-2"
      >
        @{{ displayHandle }}
      </NuxtLink>
    </p>

    <header class="mb-10 border-b border-border pb-8">
      <h1 class="font-mono text-2xl sm:text-3xl font-medium">
        {{ $t('footer.blog') }}
      </h1>
      <p v-if="blogData?.displayName" class="mt-2 text-fg-muted">
        {{ blogData.displayName }}
      </p>
    </header>

    <ul v-if="postLinks.length" class="flex flex-col gap-6 list-none m-0 p-0">
      <li v-for="post in postLinks" :key="post.uri">
        <NuxtLink
          :to="{
            name: 'profile-identity-blog-rkey',
            params: {
              identity,
              rkey: post.rkey,
            },
          }"
          class="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40 rounded-md -mx-1 px-1"
        >
          <span class="text-xs text-fg-muted font-mono">
            <DateTime :datetime="post.publishedAt" year="numeric" month="short" day="numeric" />
          </span>
          <span
            class="mt-1 block font-mono text-lg text-fg group-hover:underline decoration-fg-muted underline-offset-2"
          >
            {{ post.title }}
          </span>
        </NuxtLink>
      </li>
    </ul>

    <p v-else class="text-fg-muted">
      {{ $t('blog.no_posts') }}
    </p>
  </main>
</template>
