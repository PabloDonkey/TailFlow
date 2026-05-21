<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { hasExternalImageDropPayload, useProjectImageDrop } from '../../composables/useProjectImageDrop'
import { useImageStore } from '../../stores/images'
import { useProjectStore } from '../../stores/projects'

const props = withDefaults(defineProps<{
  projectId: string | null
  existingFilenames: string[]
  existingContentHashes?: string[]
  ensureCurrentImage?: boolean
}>(), {
  existingContentHashes: () => [],
  ensureCurrentImage: false,
})

const emit = defineEmits<{
  uploaded: [projectId: string]
}>()

const imageStore = useImageStore()
const projectStore = useProjectStore()

function preventExternalDropNavigation(event: DragEvent): void {
  if (!hasExternalImageDropPayload(event.dataTransfer)) {
    return
  }

  event.preventDefault()
}

const {
  isDropActive,
  dropFeedback,
  dropFeedbackTone,
  clearFeedback,
  handleDropZoneDragEnter,
  handleDropZoneDragOver,
  handleDropZoneDragLeave,
  handleDropZoneDrop,
} = useProjectImageDrop({
  projectId: computed(() => props.projectId),
  existingFilenames: computed(() => props.existingFilenames),
  existingContentHashes: computed(() => props.existingContentHashes),
  uploadImages: async (projectId, files) => projectStore.uploadImagesToProject(projectId, files),
  afterUpload: async (projectId) => {
    await imageStore.fetchImages(projectId)
    if (props.ensureCurrentImage && !imageStore.currentImage) {
      const firstImage = imageStore.sortedImages[0]
      if (firstImage) {
        await imageStore.fetchImage(projectId, firstImage.id)
      }
    }
    emit('uploaded', projectId)
  },
})

onMounted(() => {
  window.addEventListener('dragover', preventExternalDropNavigation, true)
  window.addEventListener('drop', preventExternalDropNavigation, true)
})

onUnmounted(() => {
  window.removeEventListener('dragover', preventExternalDropNavigation, true)
  window.removeEventListener('drop', preventExternalDropNavigation, true)
})
</script>

<template>
  <div
    class="flex h-full min-h-0 flex-col"
    @dragenter.capture="handleDropZoneDragEnter"
    @dragover.capture="handleDropZoneDragOver"
    @dragleave.capture="handleDropZoneDragLeave"
    @drop.capture="handleDropZoneDrop"
  >
    <slot
      :is-drop-active="isDropActive"
      :drop-feedback="dropFeedback"
      :drop-feedback-tone="dropFeedbackTone"
      :clear-drop-feedback="clearFeedback"
    />
  </div>
</template>