<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ProjectImageRead } from '../../api'
import { getProjectImageFileUrl } from '../../api'
import AppText from '../../components/ui/AppText.vue'

const props = defineProps<{
  projectId: string | null
  currentImage: ProjectImageRead | null
}>()

type ImageResolution = {
  width: number
  height: number
}

const resolution = ref<ImageResolution | null>(null)
const resolutionLoading = ref(false)
const resolutionError = ref<string | null>(null)
let resolutionRequestId = 0

const resolutionLabel = computed(() => {
  if (resolution.value) {
    return `${resolution.value.width} x ${resolution.value.height} px`
  }

  if (resolutionLoading.value) {
    return 'Loading...'
  }

  if (resolutionError.value) {
    return 'Unavailable'
  }

  return 'Not available'
})

function loadImageResolution(imageUrl: string): Promise<ImageResolution> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => {
      reject(new Error('Unable to read image resolution.'))
    }
    image.src = imageUrl
  })
}

watch(
  () => ({ projectId: props.projectId, imageId: props.currentImage?.id ?? null }),
  async ({ projectId, imageId }) => {
    const currentImage = props.currentImage
    if (!projectId || !imageId || !currentImage) {
      resolution.value = null
      resolutionError.value = null
      resolutionLoading.value = false
      return
    }

    const requestId = ++resolutionRequestId
    resolutionLoading.value = true
    resolutionError.value = null

    try {
      const imageUrl = getProjectImageFileUrl(projectId, currentImage.id, currentImage.content_hash ?? currentImage.discovered_at)
      const nextResolution = await loadImageResolution(imageUrl)
      if (requestId !== resolutionRequestId) {
        return
      }

      resolution.value = nextResolution
    } catch {
      if (requestId !== resolutionRequestId) {
        return
      }

      resolution.value = null
      resolutionError.value = 'Failed to load image resolution.'
    } finally {
      if (requestId === resolutionRequestId) {
        resolutionLoading.value = false
      }
    }
  },
  { immediate: true },
)
</script>

<template>
  <section class="space-y-3">
    <AppText
      v-if="!currentImage"
      tone="muted"
    >
      Select an image from the browser panel.
    </AppText>

    <dl
      v-else
      class="space-y-2"
    >
      <div class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] px-3 py-2">
        <dt class="text-[0.72rem] uppercase tracking-[0.08em] text-[var(--tf-color-text-muted)]">
          Resolution
        </dt>
        <dd class="mt-1 break-all text-sm text-[var(--tf-color-text-default)]">
          {{ resolutionLabel }}
        </dd>
      </div>

      <div class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] px-3 py-2">
        <dt class="text-[0.72rem] uppercase tracking-[0.08em] text-[var(--tf-color-text-muted)]">
          Filename
        </dt>
        <dd class="mt-1 break-all text-sm text-[var(--tf-color-text-default)]">
          {{ currentImage.filename }}
        </dd>
      </div>

      <div class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] px-3 py-2">
        <dt class="text-[0.72rem] uppercase tracking-[0.08em] text-[var(--tf-color-text-muted)]">
          Relative path
        </dt>
        <dd class="mt-1 break-all text-sm text-[var(--tf-color-text-default)]">
          {{ currentImage.relative_path }}
        </dd>
      </div>
    </dl>
  </section>
</template>
