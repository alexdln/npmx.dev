<script setup lang="ts">
const emit = defineEmits<{
  parsed: [file: File, text: string]
  clear: []
}>()

const props = defineProps<{
  fileName?: string | null
  error?: string | null
}>()

const inputRef = useTemplateRef<HTMLInputElement>('inputRef')
const isDragging = shallowRef(false)

async function readFile(file: File) {
  const text = await file.text()
  emit('parsed', file, text)
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  void readFile(file)
}

function onDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  void readFile(file)
}

function clearSelection() {
  if (inputRef.value) inputRef.value.value = ''
  emit('clear')
}
</script>

<template>
  <label
    class="rounded-lg border border-dashed px-4 py-2 transition-colors h-20 flex items-center justify-center"
    :class="
      isDragging
        ? 'border-accent bg-accent/5'
        : error
          ? 'border-red-500/50 bg-red-500/5'
          : 'border-border hover:border-border-hover'
    "
    @dragenter.prevent="isDragging = true"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="onDrop"
  >
    <span class="sr-only">{{ $t('deps_stats.upload.label') }}</span>
    <input
      ref="inputRef"
      type="file"
      accept=".json,application/json"
      class="block w-full text-sm font-mono text-fg-muted file:me-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-border file:bg-bg-subtle file:text-fg file:font-mono file:text-sm file:cursor-pointer hover:file:border-border-hover hover:file:bg-bg-muted transition-colors"
      @change="onFileChange"
      hidden
    />
    <div
      v-if="fileName"
      class="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
    >
      <p class="text-sm font-mono text-fg-muted">{{ fileName }}</p>
      <ButtonBase size="md" :aria-label="$t('deps_stats.upload.clear')" @click="clearSelection">
        {{ $t('deps_stats.upload.clear') }}
      </ButtonBase>
    </div>
    <div v-else>
      <p class="text-sm text-fg-subtle">
        {{ $t('deps_stats.upload.hint') }}
      </p>
      <p v-if="error" class="mt-2 text-sm text-red-700 dark:text-red-400" role="alert">
        {{ error }}
      </p>
    </div>
  </label>
</template>
