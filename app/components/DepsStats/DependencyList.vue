<script setup lang="ts">
import type { DependencyCategory, PackageJsonDependency } from '~/utils/parse-package-json-deps'

const props = defineProps<{
  dependencies: PackageJsonDependency[]
  selectedName: string | null
}>()

const emit = defineEmits<{
  select: [dep: PackageJsonDependency]
}>()

const { t } = useI18n()
const filter = shallowRef('')

const categoryOrder: DependencyCategory[] = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
]

const categoryLabels = computed<Record<DependencyCategory, string>>(() => ({
  dependencies: t('compare.dependencies'),
  devDependencies: t('compare.dev_dependencies'),
  peerDependencies: t('compare.peer_dependencies'),
  optionalDependencies: t('compare.optional_dependencies'),
}))

const grouped = computed(() => {
  const query = filter.value.trim().toLowerCase()
  const groups = categoryOrder
    .map(category => {
      const items = props.dependencies.filter(dep => {
        if (dep.category !== category) return false
        if (!query) return true
        return (
          dep.name.toLowerCase().includes(query) ||
          dep.packageName.toLowerCase().includes(query) ||
          dep.range.toLowerCase().includes(query)
        )
      })
      return { category, items, label: categoryLabels.value[category] }
    })
    .filter(group => group.items.length > 0)

  return groups
})

const totalCount = computed(() => props.dependencies.length)
</script>

<template>
  <div class="flex flex-col min-h-0 h-full border border-border rounded-lg overflow-hidden bg-bg">
    <div class="shrink-0 border-b border-border px-3 py-2 space-y-2">
      <div class="flex items-center justify-between gap-2">
        <h2 class="text-xs text-fg-subtle uppercase tracking-wider">
          {{ $t('deps_stats.dependencies.title') }}
        </h2>
        <span class="font-mono text-3xs text-fg-muted">
          {{ $t('deps_stats.dependencies.count', { count: totalCount }, totalCount) }}
        </span>
      </div>
      <label class="block">
        <span class="sr-only">{{ $t('deps_stats.dependencies.filter_label') }}</span>
        <InputBase
          v-model="filter"
          type="search"
          :placeholder="$t('deps_stats.dependencies.filter_placeholder')"
          class="w-full"
        />
      </label>
    </div>

    <div class="relative flex-1 overflow-y-auto">
      <p v-if="grouped.length === 0" class="px-3 py-6 text-sm text-fg-subtle text-center">
        {{
          filter.trim()
            ? $t('deps_stats.dependencies.no_matches')
            : $t('deps_stats.dependencies.empty')
        }}
      </p>

      <section
        v-for="group in grouped"
        :key="group.category"
        class="border-b border-border last:border-b-0"
      >
        <h3
          class="sticky top-0 z-1 px-3 py-1.5 text-3xs uppercase tracking-wider text-fg-subtle bg-bg-subtle border-b border-border"
        >
          {{ group.label }}
          <span class="font-mono ms-1">({{ group.items.length }})</span>
        </h3>
        <ul class="list-none m-0 p-0" :aria-label="group.label">
          <li v-for="dep in group.items" :key="dep.name">
            <button
              type="button"
              class="w-full text-start px-3 py-2 border-none bg-transparent cursor-pointer transition-colors duration-100 focus-visible:outline-accent/70 focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
              :class="
                selectedName === dep.name ? 'bg-bg-muted text-fg' : 'hover:bg-bg-subtle text-fg'
              "
              :aria-current="selectedName === dep.name ? 'true' : undefined"
              @click="emit('select', dep)"
            >
              <div class="flex items-baseline justify-between gap-2 min-w-0">
                <span class="font-mono text-sm truncate">{{ dep.name }}</span>
                <span class="font-mono text-3xs text-fg-subtle shrink-0 truncate max-w-[40%]">
                  {{ dep.range }}
                </span>
              </div>
              <p
                v-if="dep.name !== dep.packageName"
                class="mt-0.5 font-mono text-3xs text-fg-muted truncate"
              >
                → {{ dep.packageName }}
              </p>
              <p v-if="dep.nonRegistry" class="mt-0.5 text-3xs text-amber-700 dark:text-amber-400">
                {{ $t('deps_stats.dependencies.non_registry') }}
              </p>
            </button>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
