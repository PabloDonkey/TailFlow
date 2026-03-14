<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppShell from '../components/layout/AppShell.vue'
import AppHeader from '../components/layout/AppHeader.vue'
import WorkspaceActionsMenu from '../components/layout/WorkspaceActionsMenu.vue'
import WorkspaceLayout from '../components/layout/WorkspaceLayout.vue'
import WorkspaceImageBrowserPanel from '../components/sidebar/WorkspaceImageBrowserPanel.vue'
import WorkspaceTagsLibraryPanel from '../components/sidebar/WorkspaceTagsLibraryPanel.vue'
import WorkspaceImageViewerPanel from '../components/layout/WorkspaceImageViewerPanel.vue'
import WorkspaceTagInspectorPanel from '../components/inspector/WorkspaceTagInspectorPanel.vue'
import { useProjectStore } from '../stores/projects'
import { useImageStore } from '../stores/images'

const projectStore = useProjectStore()
const imageStore = useImageStore()
const selectedProject = computed(() => projectStore.selectedProject)
const orderedImages = computed(() => imageStore.sortedImages)
const showActionsMenu = ref(false)
const showTagsLibrary = ref(false)

const currentImageIndex = computed(() => {
  const currentImageId = imageStore.currentImage?.id
  if (!currentImageId) {
    return -1
  }
  return orderedImages.value.findIndex((image) => image.id === currentImageId)
})

onMounted(async () => {
  if (!projectStore.projects.length) {
    await projectStore.fetchProjects()
  }
  if (projectStore.selectedProjectId) {
    await imageStore.fetchImages(projectStore.selectedProjectId)
    const firstImage = imageStore.sortedImages[0]
    if (firstImage) {
      await imageStore.fetchImage(projectStore.selectedProjectId, firstImage.id)
    }
  }
})

watch(
  () => projectStore.selectedProjectId,
  async (projectId) => {
    if (!projectId) {
      imageStore.images = []
      imageStore.currentImage = null
      return
    }
    await imageStore.fetchImages(projectId)
    const firstImage = imageStore.sortedImages[0]
    if (firstImage) {
      await imageStore.fetchImage(projectId, firstImage.id)
    } else {
      imageStore.currentImage = null
    }
  },
)

async function selectImage(imageId: string) {
  if (!projectStore.selectedProjectId) {
    return
  }
  await imageStore.fetchImage(projectStore.selectedProjectId, imageId)
}

function openProjectPicker() {
  void 0
}

function openOverflow() {
  showActionsMenu.value = !showActionsMenu.value
}

function closeTagsLibrary() {
  showTagsLibrary.value = false
}

function closeActionsMenu() {
  showActionsMenu.value = false
}

function showTagsLibraryPanel() {
  showTagsLibrary.value = true
  closeActionsMenu()
}

function showTagInspectorPanel() {
  showTagsLibrary.value = false
  closeActionsMenu()
}

async function goToImageByIndex(index: number) {
  if (!projectStore.selectedProjectId) {
    return
  }
  const targetImage = orderedImages.value[index]
  if (!targetImage) {
    return
  }
  await imageStore.fetchImage(projectStore.selectedProjectId, targetImage.id)
}

async function goToPreviousImage() {
  if (currentImageIndex.value <= 0) {
    return
  }
  await goToImageByIndex(currentImageIndex.value - 1)
}

async function goToNextImage() {
  if (currentImageIndex.value < 0 || currentImageIndex.value >= orderedImages.value.length - 1) {
    return
  }
  await goToImageByIndex(currentImageIndex.value + 1)
}
</script>

<template>
  <AppShell :full-width="true">
    <template #header>
      <AppHeader
        :project-name="selectedProject?.name"
        :overflow-open="showActionsMenu"
        @open-project-picker="openProjectPicker"
        @open-overflow="openOverflow"
      />
      <WorkspaceActionsMenu
        v-if="showActionsMenu"
        :show-tags-library="showTagsLibrary"
        @close="closeActionsMenu"
        @show-tags-library="showTagsLibraryPanel"
        @show-inspector="showTagInspectorPanel"
      />
    </template>

    <WorkspaceLayout>
      <template #left>
        <WorkspaceImageBrowserPanel
          :selected-project-id="projectStore.selectedProjectId"
          @select-image="selectImage"
        />
      </template>

      <WorkspaceImageViewerPanel
        :project-id="projectStore.selectedProjectId"
        :selected-project="selectedProject"
        :current-image="imageStore.currentImage"
        :ordered-images="orderedImages"
        :current-image-index="currentImageIndex"
        :loading="projectStore.loading || imageStore.loading"
        :error="projectStore.error || imageStore.error"
        @previous="goToPreviousImage"
        @next="goToNextImage"
        @jump="goToImageByIndex"
      />

      <template #right>
        <WorkspaceTagsLibraryPanel
          v-if="showTagsLibrary"
          :show-close="true"
          @close="closeTagsLibrary"
        />
        <WorkspaceTagInspectorPanel
          v-else
          :project-id="projectStore.selectedProjectId"
          :selected-project="selectedProject"
        />
      </template>
    </WorkspaceLayout>
  </AppShell>
</template>
