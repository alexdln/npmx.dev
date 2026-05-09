<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineOptions({ name: 'TabLinks', inheritAttrs: false })

type TabLink = {
  key: string
  label: string
  to: RouteLocationRaw
  title?: string
  ariaKeyshortcuts?: string
  class?: string
  active?: boolean
}

const props = defineProps<{
  links: TabLink[]
  activeKey?: string
}>()

const attrs = useAttrs()

function isLinkActive(link: TabLink): boolean {
  if (link.active != null) return link.active
  if (!props.activeKey) return false
  return link.key === props.activeKey
}
</script>

<template>
  <nav class="flex gap-4 me-auto -mb-px max-w-full overflow-x-auto" v-bind="attrs">
    <LinkBase
      v-for="link in links"
      :key="link.key"
      :to="link.to"
      :title="link.title"
      :aria-keyshortcuts="link.ariaKeyshortcuts"
      class="decoration-none border-b-2 p-1 hover:border-accent/50 focus-visible:[outline-offset:-2px]!"
      :class="[
        link.class,
        isLinkActive(link) ? 'border-accent text-accent!' : 'border-transparent',
      ]"
    >
      {{ link.label }}
    </LinkBase>
  </nav>
</template>
