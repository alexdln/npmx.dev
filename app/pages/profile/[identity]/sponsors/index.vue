<script setup lang="ts">
import type { AccountEntry } from '~/components/Profile/AccountsList.vue'

const route = useRoute()
const identity = computed(() => route.params.identity)

const {
  data: sponsors,
  status: sponsorsStatus,
  error: sponsorsError,
} = await useFetch<AccountEntry[]>(() => `/api/social/profile/${identity.value}/sponsors`, {
  default: () => [],
})

useSeoMeta({
  title: () => `${identity.value} sponsors - npmx`,
  description: () => `Sponsors supporting ${identity.value}`,
})
</script>

<template>
  <ProfileAccountsList
    :entries="sponsors"
    :status="sponsorsStatus"
    :error="sponsorsError"
    :empty-label="$t('profile.sponsors.no_sponsors')"
  />
</template>
