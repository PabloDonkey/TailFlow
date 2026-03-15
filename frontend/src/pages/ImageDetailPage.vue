<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '../stores/projects'
import { useImageStore } from '../stores/images'
import WorkspaceImageViewerPanel from '../components/layout/WorkspaceImageViewerPanel.vue'
import WorkspaceTagInspectorPanel from '../components/inspector/WorkspaceTagInspectorPanel.vue'
import AppErrorText from '../components/ui/AppErrorText.vue'

const route = useRoute()
const router = useRouter()
const imageStore = useImageStore()
const projectStore = useProjectStore()

const projectId = ref<string | null>(null)
const pageError = ref<string | null>(null)

const selectedProject = computed(() => projectStore.selectedProject)
const orderedImages = computed(() => imageStore.sortedImages)

const currentImageIndex = computed(() => {
  const currentImageId = imageStore.currentImage?.id
  if (!currentImageId) {
    return -1
  }
  return orderedImages.value.findIndex((image) => image.id === currentImageId)
})

async function loadImageContext() {
  const projectFromQuery = route.query.project as string | undefined
  if (!projectStore.projects.length) {
    await projectStore.fetchProjects()
  }

  const resolvedProjectId = projectFromQuery ?? projectStore.selectedProjectId
  if (!resolvedProjectId) {
    pageError.value = 'Project context is required to view this image.'
    return
  }

  pageError.value = null
  projectId.value = resolvedProjectId

  if (projectStore.selectedProjectId !== resolvedProjectId) {
    projectStore.selectProject(resolvedProjectId)
  }

  const needsImageList =
    !imageStore.images.length || imageStore.images[0]?.project_id !== resolvedProjectId
  if (needsImageList) {
    await imageStore.fetchImages(resolvedProjectId)
  }

  const id = route.params.id as string
  await imageStore.fetchImage(resolvedProjectId, id)
}

watch(
  () => [route.params.id, route.query.project],
  async () => {
    await loadImageContext()
  },
  { immediate: true },
)

function goToImage(imageId: string) {
  if (!projectId.value) {
    return
  }
  router.push({ path: `/image/${imageId}`, query: { project: projectId.value } })
}

function goToImageByIndex(index: number) {
  const target = orderedImages.value[index]
  if (target) {
    goToImage(target.id)
  }
}

function goToPreviousImage() {
  if (currentImageIndex.value <= 0) {
    return
  }
  goToImageByIndex(currentImageIndex.value - 1)
}

function goToNextImage() {
  if (currentImageIndex.value < 0 || currentImageIndex.value >= orderedImages.value.length - 1) {
    return
  }
  goToImageByIndex(currentImageIndex.value + 1)
}
</script>

<template>
  <div class="detail-page">
    <AppErrorText v-if="pageError">
      {{ pageError }}
    </AppErrorText>

    <WorkspaceImageViewerPanel
      :project-id="projectId"
      :current-image="imageStore.currentImage"
      :ordered-images="orderedImages"
      :current-image-index="currentImageIndex"
      :loading="imageStore.imageLoading"
      :error="pageError || imageStore.error"
      @previous="goToPreviousImage"
      @next="goToNextImage"
      @jump="goToImageByIndex"
    />

    <WorkspaceTagInspectorPanel
      :project-id="projectId"
      :selected-project="selectedProject"
    />
  </div>
</template>

<style scoped>
.detail-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
