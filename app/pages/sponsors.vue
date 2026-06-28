<script setup lang="ts">
const silverBenefits = computed(() => [
  $t('sponsors_page.tiers.silver.benefit_1'),
  $t('sponsors_page.tiers.silver.benefit_2'),
])

const goldBenefits = computed(() => [
  $t('sponsors_page.tiers.gold.benefit_1'),
  $t('sponsors_page.tiers.gold.benefit_2'),
])

const platinumBenefits = computed(() => [
  $t('sponsors_page.tiers.platinum.benefit_1'),
  $t('sponsors_page.tiers.platinum.benefit_2'),
])

useSeoMeta({
  title: () => `${$t('sponsors_page.title')} - npmx`,
  ogTitle: () => `${$t('sponsors_page.title')} - npmx`,
  twitterTitle: () => `${$t('sponsors_page.title')} - npmx`,
  description: () => $t('sponsors_page.meta_description'),
  ogDescription: () => $t('sponsors_page.meta_description'),
  twitterDescription: () => $t('sponsors_page.meta_description'),
})

defineOgImage(
  'Page.takumi',
  {
    title: () => $t('sponsors_page.title'),
    description: () => $t('sponsors_page.meta_description'),
  },
  { alt: () => `${$t('sponsors_page.title')} — npmx` },
)
</script>

<template>
  <main class="container flex-1 py-12 sm:py-16 overflow-x-hidden">
    <article class="max-w-3xl mx-auto">
      <header class="mb-12">
        <div class="flex items-baseline justify-between gap-4 mb-4">
          <h1 class="font-mono text-3xl sm:text-4xl font-medium">
            {{ $t('sponsors_page.heading') }}
          </h1>
          <BackButton />
        </div>
        <p class="text-fg-muted text-lg leading-relaxed">
          {{ $t('sponsors_page.intro') }}
        </p>
      </header>

      <section class="space-y-12">
        <div>
          <h2 class="text-lg text-fg uppercase tracking-wider mb-4">
            {{ $t('sponsors_page.what_we_do.title') }}
          </h2>
          <p class="text-fg-muted leading-relaxed">
            {{ $t('sponsors_page.what_we_do.description') }}
          </p>
        </div>

        <div>
          <h2 class="text-lg text-fg uppercase tracking-wider mb-4">
            {{ $t('sponsors_page.what_this_means_for_you.title') }}
          </h2>
          <p class="text-fg-muted leading-relaxed mb-4">
            {{ $t('sponsors_page.what_this_means_for_you.description') }}
          </p>
          <div class="grid gap-4 sm:grid-cols-12">
            <section class="border border-border bg-bg-elevated rounded-lg p-5 sm:col-span-7">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="font-mono text-2xl text-fg uppercase tracking-wider mb-2">250+</p>
                  <p class="text-fg-muted text-sm leading-relaxed m-0">
                    {{ $t('sponsors_page.what_this_means_for_you.cards.people.contributors') }}
                  </p>
                </div>
                <div>
                  <p class="font-mono text-2xl text-fg uppercase tracking-wider mb-2">700+</p>
                  <p class="text-fg-muted text-sm leading-relaxed m-0">
                    {{ $t('sponsors_page.what_this_means_for_you.cards.people.community_members') }}
                  </p>
                </div>
              </div>
            </section>
            <section class="border border-border rounded-lg p-5 bg-bg-subtle sm:col-span-5">
              <p class="font-mono text-2xl text-fg uppercase tracking-wider mb-2">200000+</p>
              <p class="text-fg-muted text-sm leading-relaxed m-0">
                {{ $t('sponsors_page.what_this_means_for_you.cards.visitors.description') }}
              </p>
            </section>
            <section class="border border-border rounded-lg p-5 bg-bg-subtle sm:col-span-4">
              <p class="font-mono text-2xl text-fg uppercase tracking-wider mb-2">3400+</p>
              <p class="text-fg-muted text-sm leading-relaxed m-0">Stars</p>
            </section>
            <section class="border border-border rounded-lg p-5 bg-bg-subtle sm:col-span-8">
              <p class="font-mono text-2xl text-fg uppercase tracking-wider mb-2">
                {{ $t('sponsors_page.what_this_means_for_you.cards.community.title') }}
              </p>
              <p class="text-fg-muted text-sm leading-relaxed m-0">
                {{ $t('sponsors_page.what_this_means_for_you.cards.community.description') }}
              </p>
            </section>
            <section class="border border-border rounded-lg p-5 bg-bg-subtle sm:col-span-6">
              <p class="font-mono text-2xl text-fg uppercase tracking-wider mb-2">
                {{ $t('sponsors_page.what_this_means_for_you.cards.adoption.title') }}
              </p>
              <p class="text-fg-muted text-sm leading-relaxed m-0">
                {{ $t('sponsors_page.what_this_means_for_you.cards.adoption.description') }}
              </p>
            </section>
            <section class="border border-border rounded-lg p-5 bg-bg-subtle sm:col-span-6">
              <p class="font-mono text-2xl text-fg uppercase tracking-wider mb-2">
                {{ $t('sponsors_page.what_this_means_for_you.cards.default_source.title') }}
              </p>
              <p class="text-fg-muted text-sm leading-relaxed m-0">
                {{ $t('sponsors_page.what_this_means_for_you.cards.default_source.description') }}
              </p>
            </section>
          </div>
        </div>

        <div>
          <h2 class="text-lg text-fg uppercase tracking-wider mb-4">
            {{ $t('sponsors_page.what_support_means.title') }}
          </h2>
          <p class="text-fg-muted leading-relaxed">
            {{ $t('sponsors_page.what_support_means.description') }}
          </p>
        </div>

        <div>
          <h2 class="text-lg text-fg uppercase tracking-wider mb-4">
            {{ $t('sponsors_page.tiers.title') }}
          </h2>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="border border-border rounded-xl p-5 bg-bg-subtle">
              <div class="flex items-center justify-between gap-3 mb-2">
                <h3 class="font-mono text-base text-fg uppercase tracking-wider">
                  {{ $t('sponsors_page.tiers.silver.name') }}
                </h3>
                <span class="i-lucide:coins size-4 text-fg-subtle" aria-hidden="true" />
              </div>
              <p class="text-sm text-fg-subtle mb-3 font-mono">
                {{ $t('sponsors_page.tiers.silver.price') }}
              </p>
              <ul class="space-y-2 text-fg-muted list-none p-0">
                <li v-for="benefit in silverBenefits" :key="benefit" class="flex items-start gap-3">
                  <span
                    class="i-lucide:check size-4 text-accent shrink-0 mt-1"
                    aria-hidden="true"
                  />
                  <span>{{ benefit }}</span>
                </li>
              </ul>
            </div>

            <div
              class="border border-accent/45 rounded-xl p-5 bg-linear-to-br from-accent/8 to-bg-subtle/40 relative overflow-hidden"
            >
              <div class="flex items-center justify-between gap-3 mb-2 relative">
                <h3 class="font-mono text-base text-fg uppercase tracking-wider">
                  {{ $t('sponsors_page.tiers.gold.name') }}
                </h3>
                <span class="i-lucide:medal size-4 text-accent" aria-hidden="true" />
              </div>
              <p class="text-sm text-fg-subtle mb-3 font-mono">
                {{ $t('sponsors_page.tiers.gold.price') }}
              </p>
              <p class="text-fg-muted leading-relaxed mb-3">
                {{ $t('sponsors_page.tiers.gold.description') }}
              </p>
              <ul class="space-y-2 text-fg-muted list-none p-0">
                <li v-for="benefit in goldBenefits" :key="benefit" class="flex items-start gap-3">
                  <span
                    class="i-lucide:check size-4 text-accent shrink-0 mt-1"
                    aria-hidden="true"
                  />
                  <span>{{ benefit }}</span>
                </li>
              </ul>
            </div>

            <div class="border border-border rounded-xl p-5 bg-bg-muted sm:col-span-2">
              <div class="flex items-center justify-between gap-3 mb-2">
                <h3 class="font-mono text-base text-fg uppercase tracking-wider">
                  {{ $t('sponsors_page.tiers.platinum.name') }}
                </h3>
                <span class="i-lucide:crown size-4 text-fg-subtle" aria-hidden="true" />
              </div>
              <p class="text-sm text-fg-subtle mb-3 font-mono">
                {{ $t('sponsors_page.tiers.platinum.price') }}
              </p>
              <p class="text-fg-muted leading-relaxed mb-3">
                {{ $t('sponsors_page.tiers.platinum.description') }}
              </p>
              <ul class="space-y-2 text-fg-muted list-none p-0">
                <li
                  v-for="benefit in platinumBenefits"
                  :key="benefit"
                  class="flex items-start gap-3"
                >
                  <span
                    class="i-lucide:check size-4 text-accent shrink-0 mt-1"
                    aria-hidden="true"
                  />
                  <span>{{ benefit }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </article>
  </main>
</template>
