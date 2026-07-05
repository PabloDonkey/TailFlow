<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  currentImageExists: boolean
  currentImageIsFeatured: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  setFeaturedImage: []
  replaceImage: [file: File]
  uploadImages: [files: File[]]
}>()

const showMenu = ref(false)
const replaceInputRef = ref<HTMLInputElement | null>(null)
const uploadInputRef = ref<HTMLInputElement | null>(null)

function openReplacePicker(): void {
  showMenu.value = false
  if (!props.currentImageExists || props.loading) {
    return
  }
  replaceInputRef.value?.click()
}

function openUploadPicker(): void {
  showMenu.value = false
  if (props.loading) {
    return
  }
  uploadInputRef.value?.click()
}

function setFeaturedImage(): void {
  showMenu.value = false
  if (!props.currentImageExists || props.currentImageIsFeatured || props.loading) {
    return
  }
  emit('setFeaturedImage')
}

function handleReplaceFileChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }
  emit('replaceImage', file)
  input.value = ''
}

function handleUploadFilesChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (files.length === 0) {
    return
  }
  emit('uploadImages', files)
  input.value = ''
}
</script>

<template>
  <div class="relative">
    <input
      ref="replaceInputRef"
      type="file"
      accept="image/*"
      class="sr-only"
      aria-label="Replace current image"
      @change="handleReplaceFileChange"
    >
    <input
      ref="uploadInputRef"
      type="file"
      accept="image/*"
      multiple
      class="sr-only"
      aria-label="Upload images to dataset"
      @change="handleUploadFilesChange"
    >

    <button
      type="button"
      class="inline-flex h-7 w-7 items-center justify-center rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] text-[var(--tf-color-text-default)] transition hover:bg-[var(--tf-color-surface-alt)] disabled:cursor-not-allowed disabled:opacity-60"
      aria-label="Open canvas image actions menu"
      :disabled="props.loading"
      @click="showMenu = !showMenu"
    >
      ...
    </button>

    <div
      v-if="showMenu"
      class="absolute right-0 top-[calc(100%+0.25rem)] z-20 flex min-w-44 flex-col gap-1 rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-1 shadow-md"
    >
      <button
        type="button"
        class="flex items-center justify-between rounded-[var(--tf-radius-sm)] px-2 py-1 text-left text-xs text-[var(--tf-color-text-default)] hover:bg-[var(--tf-color-surface-alt)] disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="!props.currentImageExists || props.currentImageIsFeatured || props.loading"
        @click="setFeaturedImage"
      >
        <span>Set as featured image</span>
        <span
          v-if="props.currentImageIsFeatured"
          aria-label="Current image is featured"
          class="text-[var(--tf-color-success)]"
        >
          [x]
        </span>
      </button>
      <button
        type="button"
        class="rounded-[var(--tf-radius-sm)] px-2 py-1 text-left text-xs text-[var(--tf-color-text-default)] hover:bg-[var(--tf-color-surface-alt)] disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="!props.currentImageExists || props.loading"
        @click="openReplacePicker"
      >
        Replace image
      </button>
      <button
        type="button"
        class="rounded-[var(--tf-radius-sm)] px-2 py-1 text-left text-xs text-[var(--tf-color-text-default)] hover:bg-[var(--tf-color-surface-alt)] disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="props.loading"
        @click="openUploadPicker"
      >
        Upload image
      </button>
    </div>
  </div>
</template>
