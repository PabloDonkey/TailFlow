<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ProjectImageRead, ProjectImageSummary } from '../../api'
import { getProjectImageFileUrl } from '../../api'
import { useDelayedLoading } from '../../composables/useDelayedLoading'
import UploadImageDropZone from '../../components/ui/UploadImageDropZone.vue'
import AppAlertDialog from '../../design-system/reka/AppAlertDialog.vue'
import AppErrorText from '../../components/ui/AppErrorText.vue'
import AppText from '../../components/ui/AppText.vue'

const props = defineProps<{
  projectId: string | null
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
  deleteCurrent: []
}>()

const imageJumpInput = ref('1')
const showDeleteConfirm = ref(false)
const showLoading = useDelayedLoading(computed(() => props.loading), 200)

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

function requestDeleteCurrent(): void {
  showDeleteConfirm.value = true
}

function confirmDeleteCurrent(): void {
  showDeleteConfirm.value = false
  emit('deleteCurrent')
}
</script>

<template>
  <UploadImageDropZone
    :project-id="projectId"
    :existing-filenames="orderedImages.map((image) => image.filename)"
    :existing-content-hashes="orderedImages.flatMap((image) => image.content_hash ? [image.content_hash] : [])"
    :ensure-current-image="true"
  >
    <template #default="{ isDropActive, dropFeedback, dropFeedbackTone }">
      <section
        class="flex h-full min-h-0 flex-col overflow-hidden gap-3 rounded-[var(--tf-radius-md)] border border-transparent p-2 transition"
        :class="isDropActive ? 'border-[var(--tf-color-accent)] bg-[var(--tf-color-surface-muted)]/50' : ''"
      >
        <p
          v-if="dropFeedback"
          class="text-xs"
          :class="dropFeedbackTone === 'error' ? 'text-[var(--tf-color-danger)]' : dropFeedbackTone === 'success' ? 'text-[var(--tf-color-success)]' : 'text-[var(--tf-color-text-muted)]'"
        >
          {{ dropFeedback }}
        </p>

        <AppText v-if="showLoading">
          Loading…
        </AppText>
        <AppErrorText v-else-if="error">
          {{ error }}
        </AppErrorText>
        <AppText v-else-if="!currentImage">
          Select an image from the browser panel.
        </AppText>

        <template v-else>
          <div class="min-h-0 flex-1 overflow-hidden">
            <img
              :src="getProjectImageFileUrl(projectId!, currentImage.id)"
              :alt="currentImage.filename"
              :aria-description="`Current canvas image: ${currentImage.filename}`"
              class="block h-full w-full object-contain"
            >
          </div>

          <div class="hidden shrink-0 border-t border-[var(--tf-color-surface-border)] pt-3 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-3">
            <div />

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

            <div class="flex justify-end">
              <button
                data-testid="delete-image-button"
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] text-[var(--tf-color-text-muted)] transition hover:border-[var(--tf-color-danger)] hover:text-[var(--tf-color-danger)] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Delete current image"
                title="Delete current image"
                :disabled="!currentImage"
                @click="requestDeleteCurrent"
              >
                <svg
                  viewBox="0 0 24 24"
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                </svg>
              </button>
            </div>
          </div>

          <AppAlertDialog
            :open="showDeleteConfirm"
            title="Delete current image?"
            :description="currentImage ? `This permanently deletes ${currentImage.filename} from the project dataset.` : 'This permanently deletes the current image from the project dataset.'"
            confirm-label="Delete"
            cancel-label="Cancel"
            @update:open="(open) => (showDeleteConfirm = open)"
            @confirm="confirmDeleteCurrent"
          />
        </template>
      </section>
    </template>
  </UploadImageDropZone>
</template>
