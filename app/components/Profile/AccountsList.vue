<script setup lang="ts">
export type AccountEntry = {
  account?: {
    uri?: string
    handle?: string
    actor?: {
      handle?: string
      name?: string
      displayName?: string
      description?: string
    }
  }
}

defineProps<{
  entries: AccountEntry[] | null
  status: string
  error?: unknown
  emptyLabel: string
}>()
</script>

<template>
  <div v-if="status === 'pending'" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <SkeletonBlock v-for="i in 4" :key="i" class="h-20 rounded-lg" />
  </div>
  <div v-else-if="status === 'error' || error">
    <p>{{ $t('common.error') }}</p>
  </div>
  <template v-else-if="entries?.length">
    <p class="text-sm p-4 bg-badge-orange/10 border border-badge-orange/40 rounded-lg">
      {{ $t('profile.account.warning') }}
    </p>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      <div
        v-for="(entry, index) in entries"
        :key="entry.account?.uri || `entry-${index}`"
        class="p-4 bg-bg-subtle border border-border rounded-lg decoration-none"
      >
        <p class="font-mono font-medium truncate">
          {{
            entry.account?.actor?.displayName ||
            entry.account?.actor?.name ||
            entry.account?.actor?.handle ||
            entry.account?.handle ||
            $t('profile.related_accounts.unknown')
          }}
        </p>
        <p v-if="entry.account?.handle" class="text-fg-muted text-sm truncate">
          @{{ entry.account?.handle }}
        </p>
        <p v-if="entry.account?.actor?.description" class="text-sm mt-1 line-clamp-2">
          {{ entry.account?.actor?.description }}
        </p>
      </div>
    </div>
  </template>
  <div v-else class="p-4 bg-bg-subtle border border-border rounded-lg text-fg-muted">
    {{ emptyLabel }}
  </div>
</template>
