<script setup lang="ts">
import { getSafeHttpUrl } from '#shared/utils/url'
import { updateProfile as updateProfileUtil } from '~/utils/atproto/profile'
import type { CommandPaletteContextCommandInput } from '~/types/command-palette'

const props = withDefaults(
  defineProps<{
    profile: NPMXProfile
    identity: string
    activeTab: 'likes' | 'sponsors'
    canEdit?: boolean
  }>(),
  {
    canEdit: false,
  },
)

const emit = defineEmits<{
  updateProfile: [profile: NPMXProfile]
}>()

const isEditing = ref(false)
const displayNameInput = ref('')
const descriptionInput = ref('')
const websiteInput = ref('')
const isUpdateProfileActionPending = ref(false)

const safeProfileWebsiteUrl = computed(() => getSafeHttpUrl(props.profile.website))

watchEffect(() => {
  if (!isEditing.value) return
  displayNameInput.value = props.profile.displayName || ''
  descriptionInput.value = props.profile.description || ''
  websiteInput.value = props.profile.website || ''
})

function startEditing() {
  if (!props.canEdit) return
  isEditing.value = true
}

function cancelEditing() {
  isEditing.value = false
}

async function updateProfile() {
  if (!props.canEdit || !displayNameInput.value) {
    return
  }

  isUpdateProfileActionPending.value = true
  const currentProfile = { ...props.profile }

  const optimisticProfile: NPMXProfile = {
    ...props.profile,
    displayName: displayNameInput.value,
    description: descriptionInput.value || undefined,
    website: websiteInput.value || undefined,
    recordExists: true,
  }
  emit('updateProfile', optimisticProfile)

  try {
    const result = await updateProfileUtil(props.identity, {
      displayName: displayNameInput.value,
      description: descriptionInput.value || undefined,
      website: websiteInput.value || undefined,
    })

    if (result.success) {
      isEditing.value = false
    } else {
      emit('updateProfile', currentProfile)
    }
  } catch {
    emit('updateProfile', currentProfile)
  } finally {
    isUpdateProfileActionPending.value = false
  }
}

const profileTabs = computed(() => [
  {
    key: 'likes',
    label: $t('profile.likes'),
    to: `/profile/${props.identity}`,
  },
  {
    key: 'sponsors',
    label: $t('about.sponsors.title'),
    to: `/profile/${props.identity}/sponsors`,
  },
])

useCommandPaletteContextCommands(
  computed((): CommandPaletteContextCommandInput[] => {
    const commands: CommandPaletteContextCommandInput[] = []

    if (props.canEdit && !isEditing.value) {
      commands.push({
        id: 'profile-edit',
        group: 'actions',
        label: $t('common.edit'),
        keywords: [props.profile.handle ?? props.identity, $t('profile.display_name')],
        iconClass: 'i-lucide:square-pen',
        action: () => {
          startEditing()
        },
      })
    }

    if (safeProfileWebsiteUrl.value) {
      commands.push({
        id: 'profile-website',
        group: 'links',
        label: $t('profile.website'),
        keywords: [props.profile.website ?? '', props.profile.handle ?? props.identity],
        iconClass: 'i-lucide:link',
        href: safeProfileWebsiteUrl.value,
      })
    }

    return commands
  }),
)

defineExpose({
  startEditing,
})
</script>

<template>
  <header class="mb-8 pb-8 border-b border-border">
    <form v-if="isEditing" class="flex flex-col flex-wrap gap-4" @submit.prevent="updateProfile">
      <label for="displayName" class="text-sm flex flex-col gap-2">
        {{ $t('profile.display_name') }}
        <input
          required
          name="displayName"
          type="text"
          class="w-full min-w-25 bg-bg-subtle border border-border rounded-md ps-3 pe-3 py-1.5 font-mono text-sm text-fg placeholder:text-fg-subtle transition-[border-color,outline-color] duration-300 hover:border-fg-subtle outline-2 outline-transparent focus:border-accent focus-visible:(outline-2 outline-accent/70)"
          v-model="displayNameInput"
        />
      </label>
      <label for="description" class="text-sm flex flex-col gap-2">
        {{ $t('profile.description') }}
        <input
          name="description"
          type="text"
          :placeholder="$t('profile.no_description')"
          v-model="descriptionInput"
          class="w-full min-w-25 bg-bg-subtle border border-border rounded-md ps-3 pe-3 py-1.5 font-mono text-sm text-fg placeholder:text-fg-subtle transition-[border-color,outline-color] duration-300 hover:border-fg-subtle outline-2 outline-transparent focus:border-accent focus-visible:(outline-2 outline-accent/70)"
        />
      </label>
      <label for="website" class="text-sm flex flex-col gap-2">
        {{ $t('profile.website') }}
        <input
          name="website"
          type="url"
          :placeholder="$t('profile.website_placeholder')"
          v-model="websiteInput"
          class="w-full min-w-25 bg-bg-subtle border border-border rounded-md ps-3 pe-3 py-1.5 font-mono text-sm text-fg placeholder:text-fg-subtle transition-[border-color,outline-color] duration-300 hover:border-fg-subtle outline-2 outline-transparent focus:border-accent focus-visible:(outline-2 outline-accent/70)"
        />
      </label>
      <div class="flex gap-4 items-center font-mono text-sm">
        <h2>@{{ profile.handle || identity }}</h2>
        <ButtonBase type="button" @click="cancelEditing">
          {{ $t('common.cancel') }}
        </ButtonBase>
        <ButtonBase variant="primary" :disabled="isUpdateProfileActionPending" type="submit">
          {{ $t('common.save') }}
        </ButtonBase>
      </div>
    </form>

    <div v-else class="flex flex-col flex-wrap gap-4">
      <h1 v-if="profile.displayName" class="font-mono text-2xl sm:text-3xl font-medium">
        {{ profile.displayName }}
      </h1>
      <p v-if="profile.description">{{ profile.description }}</p>
      <div class="flex gap-4 items-center font-mono text-sm">
        <h2>@{{ profile.handle || identity }}</h2>
        <LinkBase
          v-if="safeProfileWebsiteUrl"
          :to="safeProfileWebsiteUrl"
          classicon="i-lucide:link"
        >
          {{ profile.website }}
        </LinkBase>
        <ButtonBase v-if="canEdit" class="hidden sm:inline-flex" @click="startEditing">
          {{ $t('common.edit') }}
        </ButtonBase>
      </div>
    </div>
  </header>

  <TabLinks :aria-label="$t('profile.likes')" :links="profileTabs" :active-key="activeTab" />
</template>
