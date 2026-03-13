<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Project, ProjectImageRead, ProjectImageSummary } from '../../api'
import { getProjectImageFileUrl } from '../../api'
import AppErrorText from '../ui/AppErrorText.vue'
import AppSectionTitle from '../ui/AppSectionTitle.vue'
import AppText from '../ui/AppText.vue'

const props = defineProps<{
  projectId: string | null
  selectedProject: Project | null
  currentImage: ProjectImageRead | null
  orderedImages: ProjectImageSummary[]
  currentImageIndex: number
  loading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  previous: []
  next: []
  jump: [index: number]
}>()

const imageJumpInput = ref('1')

const previousAvailable = computed(() => props.currentImageIndex > 0)
const nextAvailable = computed(() => props.currentImageIndex >= 0 && props.currentImageIndex < props.orderedImages.length - 1)

watch(
  () => props.currentImageIndex,
  (index) => {
    if (index >= 0) {
      imageJumpInput.value = String(index + 1)
    }
  },
)

function formatTagCount(tagCount: number): string {
  return `${tagCount} tag${tagCount === 1 ? '' : 's'}`
}

function submitImageJump() {
  const requested = Number.parseInt(imageJumpInput.value, 10)
  if (!Number.isFinite(requested)) {
    imageJumpInput.value = props.currentImageIndex >= 0 ? String(props.currentImageIndex + 1) : '1'
    return
  }
  const clampedIndex = Math.min(Math.max(requested, 1), props.orderedImages.length) - 1
  imageJumpInput.value = String(clampedIndex + 1)
  emit('jump', clampedIndex)
}
</script>

<template>
  <section class="flex flex-col gap-3">
    <AppSectionTitle>Tagging Workspace</AppSectionTitle>

    <AppText v-if="loading">
      Loading…
    </AppText>
    <AppErrorText v-else-if="error">
      {{ error }}
    </AppErrorText>
    <AppText v-else-if="!currentImage">
      Select an image from the browser panel.
    </AppText>

    <template v-else>
      <div class="flex justify-center">
        <img
          :src="getProjectImageFileUrl(projectId!, currentImage.id)"
          :alt="currentImage.filename"
          class="max-h-[420px] w-full rounded-[var(--tf-radius-md)] object-contain"
        >
      </div>

      <AppText class="font-semibold text-[var(--tf-color-text-title)]">
        {{ currentImage.filename }}
      </AppText>

      <div class="flex flex-wrap items-center justify-center gap-3">
        <button
          data-testid="previous-image-button"
          class="btn btn-secondary rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] px-3 py-1.5"
          :disabled="!previousAvailable"
          @click="emit('previous')"
        >
          Previous
        </button>

        <label
          v-if="orderedImages.length"
          class="inline-flex items-center gap-2"
        >
          <input
            v-model="imageJumpInput"
            data-testid="image-number-input"
            class="image-select w-20 rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] px-2 py-1"
            inputmode="numeric"
            @keyup.enter="submitImageJump"
            @blur="submitImageJump"
          >
          <span class="text-[0.85rem] text-[var(--tf-color-text-muted)]">of {{ orderedImages.length }}</span>
        </label>

        <button
          data-testid="next-image-button"
          class="btn btn-secondary rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] px-3 py-1.5"
          :disabled="!nextAvailable"
          @click="emit('next')"
        >
          Next
        </button>
      </div>

      <AppText tone="muted">
        Discovered {{ new Date(currentImage.discovered_at).toLocaleString() }}
      </AppText>
      <AppText
        v-if="selectedProject"
        tone="muted"
      >
        Mode: <strong>{{ selectedProject.tagging_mode }}</strong>
      </AppText>
      <AppText tone="muted">
        {{ formatTagCount(currentImage.tag_count) }}
      </AppText>
    </template>
  </section>
</template>
