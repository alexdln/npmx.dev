<script setup lang="ts">
import type { StandardDocument } from '@atview/core'
import type { DefaultBskyPostProps, DefaultCodeBlockProps, ElementOrComponent } from '@atview/vue'
import { dataToVue } from '@atview/vue/default'
import { Fragment } from 'vue'
import { escapeHtml } from '#server/utils/docs/text'
import BlueskyPostEmbed from '~/components/global/BlueskyPostEmbed.client.vue'

definePageMeta({
  name: 'profile-identity-blog-rkey',
})

type ProfileBlogPostResponse = {
  did: string
  handle: string
  displayName?: string
  description?: string
  avatar?: string
  document: StandardDocument
  publication: unknown
}

const route = useRoute()
const identity = computed(() => route.params.identity)

const rkey = computed(() => route.params.rkey)

const { data: postData } = await useAsyncData(
  () => `profile-blog-post-${identity.value}-${rkey.value}`,
  async () => {
    return await $fetch<ProfileBlogPostResponse>(
      `/api/profile/${encodeURIComponent(identity.value)}/blog/${encodeURIComponent(rkey.value)}`,
    )
  },
  { watch: [identity, rkey] },
)

const doc = computed(() => postData.value?.document)

const BskyPostBlock: ElementOrComponent<DefaultBskyPostProps> = props =>
  h(BlueskyPostEmbed, { uri: props.uri })

function renderPlainCode(text: string, language?: string) {
  return `<pre><code class="language-${language || 'text'}">${escapeHtml(text)}</code></pre>`
}

let highlightCodeServer = renderPlainCode

if (import.meta.server) {
  const { getShikiHighlighter, highlightCodeSync } = await import('~~/server/utils/shiki')
  const shiki = await getShikiHighlighter()
  highlightCodeServer = (text: string, language?: string) =>
    highlightCodeSync(shiki, text, language || 'text')
}

const AtviewCodeBlock = defineComponent({
  name: 'AtviewCodeBlock',
  props: {
    text: { type: String, required: true },
    language: { type: String, required: false },
  },
  setup(props) {
    const highlightedHtml = ref(highlightCodeServer(props.text, props.language))

    onMounted(async () => {
      const { highlightCodeBlock } = await import('~/utils/shiki')
      highlightedHtml.value = await highlightCodeBlock(props.text, props.language || 'text')
    })

    return () =>
      h('div', { class: 'readme-code-block' }, [h('div', { innerHTML: highlightedHtml.value })])
  },
})

const CodeBlockElement: ElementOrComponent<DefaultCodeBlockProps> = props =>
  h(AtviewCodeBlock, {
    text: props.text,
    language: props.language,
  })

const rendered = computed(() => {
  const data = doc.value
  const did = postData.value?.did

  if (!data || !did) return () => null

  const out = dataToVue(data, {
    authorDid: did,
    blockElements: {
      bskyPost: BskyPostBlock,
      codeBlock: CodeBlockElement,
    },
  })

  if (!out) return () => null

  return () => h(Fragment, null, out.vue)
})

const displayHandle = computed(() => postData.value?.handle || identity.value)

useSeoMeta({
  title: () => `${doc.value?.title ?? 'Post'} (@${displayHandle.value}) - npmx`,
  description: () =>
    doc.value?.description ?? $t('profile.seo_description', { handle: displayHandle.value }),
})
</script>

<template>
  <main
    v-if="doc && postData"
    class="container flex-1 flex flex-col py-8 sm:py-12 w-full max-w-2xl"
  >
    <p class="mb-6 flex flex-wrap gap-x-2 gap-y-1 text-sm">
      <NuxtLink
        :to="{ name: 'profile-identity', params: { identity } }"
        class="text-fg-muted hover:text-fg underline underline-offset-2"
      >
        @{{ displayHandle }}
      </NuxtLink>
      <span class="text-fg-muted">/</span>
      <NuxtLink
        :to="{ name: 'profile-identity-blog', params: { identity } }"
        class="text-fg-muted hover:text-fg underline underline-offset-2"
      >
        {{ $t('footer.blog') }}
      </NuxtLink>
    </p>

    <article>
      <header class="mb-8">
        <h1 class="font-mono text-2xl sm:text-3xl font-medium">
          {{ doc.title }}
        </h1>
        <p class="mt-2 text-sm text-fg-muted font-mono">
          <DateTime :datetime="doc.publishedAt" year="numeric" month="short" day="numeric" />
        </p>
      </header>

      <div
        class="profile-blog-post flex flex-col gap-4 text-fg leading-relaxed [&_a]:text-primary [&_a]:underline [&_pre]:overflow-x-auto [&_code]:font-mono [&_code]:text-sm"
      >
        <component :is="rendered" />
      </div>
    </article>
  </main>
</template>

<style scoped>
.profile-blog-post :deep(h2),
.profile-blog-post :deep(h3),
.profile-blog-post :deep(h4),
.profile-blog-post :deep(h5),
.profile-blog-post :deep(h6) {
  @apply font-mono scroll-mt-16;
  font-weight: 500;
  margin-block: 1rem;
  line-height: 1.3;
}

/* Visual styling based on original README heading level */
.profile-blog-post :deep(h1) {
  font-size: 1.5rem;
}

.profile-blog-post :deep(h2) {
  font-size: 1.25rem;
}

.profile-blog-post :deep(h3) {
  font-size: 1.125rem;
}

.profile-blog-post :deep(h4) {
  font-size: 1rem;
}

.profile-blog-post :deep(h5) {
  font-size: 0.925rem;
}

.profile-blog-post :deep(h6) {
  font-size: 0.875rem;
}

.profile-blog-post :deep(figure) {
  margin-block: 1rem;
}
</style>
