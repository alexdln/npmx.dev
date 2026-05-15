<script setup lang="ts">
import type { FetchError } from 'ofetch'
import { handleAuthError } from '~/utils/atproto/helpers'

const props = defineProps<{
  identity: string
}>()

const emit = defineEmits<{
  added: []
}>()

const { user } = useAtproto()
const modal = useModal('add-known-account-modal')

const handleInput = ref('')
const accountType = ref<'project' | 'user' | 'organisation' | 'collective'>('user')
const isSubmitting = ref(false)
const formError = ref<string | null>(null)

const accountTypeItems = computed(() => [
  { label: $t('profile.known_accounts.add_dialog.type_user'), value: 'user' as const },
  { label: $t('profile.known_accounts.add_dialog.type_project'), value: 'project' as const },
  {
    label: $t('profile.known_accounts.add_dialog.type_organisation'),
    value: 'organisation' as const,
  },
  { label: $t('profile.known_accounts.add_dialog.type_collective'), value: 'collective' as const },
])

function resetForm() {
  handleInput.value = ''
  accountType.value = 'user'
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
  if (statusCode === 409 || message === 'Account already exists') {
    return $t('profile.known_accounts.add_dialog.duplicate')
  }
  if (statusCode === 404 || message === 'Actor profile not found') {
    return $t('profile.known_accounts.add_dialog.not_found')
  }
  if (statusCode === 400 && message === 'Cannot add your own account') {
    return $t('profile.known_accounts.add_dialog.self')
  }
  return $t('common.error')
}

async function handleSubmit() {
  const handle = handleInput.value.replace(/^@/, '').trim()
  if (!handle || isSubmitting.value) return

  isSubmitting.value = true
  formError.value = null

  try {
    await $fetch(`/api/social/profile/${props.identity}/accounts`, {
      method: 'POST',
      body: {
        handle,
        type: accountType.value,
      },
    })

    emit('added')
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
    id="add-known-account-modal"
    :modal-title="$t('profile.known_accounts.add_dialog.title')"
    :modal-subtitle="$t('profile.known_accounts.add_dialog.description')"
    class="max-w-md"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <label
          for="known-account-handle"
          class="block text-xs text-fg-subtle uppercase tracking-wider mb-1.5"
        >
          {{ $t('profile.known_accounts.add_dialog.handle_label') }}
        </label>
        <InputBase
          id="known-account-handle"
          v-model="handleInput"
          type="text"
          name="known-account-handle"
          :placeholder="$t('profile.known_accounts.add_dialog.handle_placeholder')"
          autocomplete="username"
          required
          class="w-full min-w-25"
        />
      </div>

      <SelectField
        id="known-account-type"
        v-model="accountType"
        name="known-account-type"
        :label="$t('profile.known_accounts.add_dialog.type_label')"
        block
        :items="accountTypeItems"
      />

      <p v-if="formError" class="text-sm text-badge-orange" role="alert">
        {{ formError }}
      </p>

      <div class="flex gap-3 justify-end">
        <ButtonBase type="button" @click="close">
          {{ $t('common.cancel') }}
        </ButtonBase>
        <ButtonBase variant="primary" type="submit" :disabled="!handleInput.trim() || isSubmitting">
          {{ $t('profile.known_accounts.add_dialog.submit') }}
        </ButtonBase>
      </div>
    </form>
  </Modal>
</template>
