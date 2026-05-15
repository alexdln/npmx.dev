<script setup lang="ts">
import type { FetchError } from 'ofetch'
import { handleAuthError } from '~/utils/atproto/helpers'

const props = defineProps<{
  identity: string
}>()

const emit = defineEmits<{
  created: [uri: string]
}>()

const { user } = useAtproto()
const modal = useModal('add-role-modal')

const nameInput = ref('')
const descriptionInput = ref('')
const colorInput = ref('')
const isSubmitting = ref(false)
const formError = ref<string | null>(null)

function resetForm() {
  nameInput.value = ''
  descriptionInput.value = ''
  colorInput.value = ''
  formError.value = null
  isSubmitting.value = false
}

function open() {
  resetForm()
  modal.open()
}

function close() {
  modal.close()
}

function resolveFormError(statusCode?: number, message?: string): string {
  if (statusCode === 400 && message === 'Role name not provided') {
    return $t('profile.roles.create_dialog.name_required')
  }
  if (statusCode === 400 && message === 'Invalid role color') {
    return $t('profile.roles.create_dialog.invalid_color')
  }
  return $t('common.error')
}

async function handleSubmit() {
  const name = nameInput.value.trim()
  if (!name || isSubmitting.value) return

  isSubmitting.value = true
  formError.value = null

  try {
    const result = await $fetch<{ uri: string }>(`/api/social/profile/${props.identity}/roles`, {
      method: 'POST',
      body: {
        name,
        description: descriptionInput.value.trim() || undefined,
        color: colorInput.value.trim() || undefined,
      },
    })

    emit('created', result.uri)
    close()
  } catch (error) {
    const fetchError = error as FetchError<{ message?: string }>
    formError.value = resolveFormError(fetchError.statusCode, fetchError.data?.message)

    try {
      await handleAuthError(fetchError, user.value?.handle)
    } catch {
      // Error message already set for non-auth failures.
    }
  } finally {
    isSubmitting.value = false
  }
}

defineExpose({
  open,
  close,
})
</script>

<template>
  <Modal
    id="add-role-modal"
    :modal-title="$t('profile.roles.create_dialog.title')"
    :modal-subtitle="$t('profile.roles.create_dialog.description')"
    class="max-w-md"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <label for="role-name" class="block text-xs text-fg-subtle uppercase tracking-wider mb-1.5">
          {{ $t('profile.roles.create_dialog.name_label') }}
        </label>
        <InputBase
          id="role-name"
          v-model="nameInput"
          type="text"
          name="role-name"
          :placeholder="$t('profile.roles.create_dialog.name_placeholder')"
          required
          class="w-full min-w-25"
        />
      </div>

      <div>
        <label
          for="role-description"
          class="block text-xs text-fg-subtle uppercase tracking-wider mb-1.5"
        >
          {{ $t('profile.roles.create_dialog.description_label') }}
        </label>
        <textarea
          id="role-description"
          v-model="descriptionInput"
          name="role-description"
          rows="3"
          :placeholder="$t('profile.roles.create_dialog.description_placeholder')"
          class="w-full min-w-25 bg-bg-subtle border border-border rounded-md ps-3 pe-3 py-1.5 font-mono text-sm text-fg placeholder:text-fg-subtle transition-[border-color,outline-color] duration-300 hover:border-fg-subtle outline-2 outline-transparent focus:border-accent focus-visible:(outline-2 outline-accent/70)"
        />
      </div>

      <div>
        <label
          for="role-color"
          class="block text-xs text-fg-subtle uppercase tracking-wider mb-1.5"
        >
          {{ $t('profile.roles.create_dialog.color_label') }}
        </label>
        <div class="flex items-center gap-3">
          <input
            id="role-color"
            v-model="colorInput"
            type="text"
            name="role-color"
            placeholder="#6366f1"
            class="w-full min-w-25 bg-bg-subtle border border-border rounded-md ps-3 pe-3 py-1.5 font-mono text-sm text-fg placeholder:text-fg-subtle transition-[border-color,outline-color] duration-300 hover:border-fg-subtle outline-2 outline-transparent focus:border-accent focus-visible:(outline-2 outline-accent/70) flex-1"
          />
        </div>
      </div>

      <p v-if="formError" class="text-sm text-badge-orange" role="alert">
        {{ formError }}
      </p>

      <div class="flex gap-3 justify-end">
        <ButtonBase type="button" @click="close">
          {{ $t('common.cancel') }}
        </ButtonBase>
        <ButtonBase variant="primary" type="submit" :disabled="!nameInput.trim() || isSubmitting">
          {{ $t('profile.roles.create_dialog.submit') }}
        </ButtonBase>
      </div>
    </form>
  </Modal>
</template>
