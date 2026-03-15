<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppShell from '../components/layout/AppShell.vue'
import AppHeader from '../components/layout/AppHeader.vue'
import WorkspaceActionsMenu from '../components/layout/WorkspaceActionsMenu.vue'
import WorkspaceLayout from '../components/layout/WorkspaceLayout.vue'
import WorkspaceImageBrowserPanel from '../components/sidebar/WorkspaceImageBrowserPanel.vue'
import WorkspaceProjectPickerPanel from '../components/sidebar/WorkspaceProjectPickerPanel.vue'
import WorkspaceTagsLibraryPanel from '../components/sidebar/WorkspaceTagsLibraryPanel.vue'
import WorkspaceImageViewerPanel from '../components/layout/WorkspaceImageViewerPanel.vue'
import WorkspaceTagInspectorPanel from '../components/inspector/WorkspaceTagInspectorPanel.vue'
import { useProjectStore } from '../stores/projects'
import { useImageStore } from '../stores/images'

const projectStore = useProjectStore()
const imageStore = useImageStore()
const selectedProject = computed(() => projectStore.selectedProject)
const orderedImages = computed(() => imageStore.sortedImages)
const showMobilePanel = ref(false)
const mobilePanel = ref<'browser' | 'inspector' | 'tags'>('browser')
const showProjectPicker = ref(false)
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
  showMobilePanel.value = false
}

function openMobilePanel(panel: 'browser' | 'inspector' | 'tags') {
  mobilePanel.value = panel
  showMobilePanel.value = true
}

function closeMobilePanel() {
  showMobilePanel.value = false
}

function openProjectPicker() {
  showProjectPicker.value = !showProjectPicker.value
  showActionsMenu.value = false
}

function openOverflow() {
  showProjectPicker.value = false
  showActionsMenu.value = !showActionsMenu.value
}

function closeTagsLibrary() {
  showTagsLibrary.value = false
}

function closeActionsMenu() {
  showActionsMenu.value = false
}

function closeProjectPicker() {
  showProjectPicker.value = false
}

function refreshProjects() {
  void projectStore.fetchProjects()
}

function selectProjectFromPicker(projectId: string) {
  if (projectStore.selectedProjectId !== projectId) {
    projectStore.selectProject(projectId)
  }
  closeProjectPicker()
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

const previousAvailable = computed(() => currentImageIndex.value > 0)
const nextAvailable = computed(
  () => currentImageIndex.value >= 0 && currentImageIndex.value < orderedImages.value.length - 1,
)
</script>

<template>
  <AppShell :full-width="true">
    <template #header>
      <AppHeader
        :project-name="selectedProject?.name"
        :project-picker-open="showProjectPicker"
        :overflow-open="showActionsMenu"
        @open-project-picker="openProjectPicker"
        @open-overflow="openOverflow"
      />
      <WorkspaceProjectPickerPanel
        v-if="showProjectPicker"
        :projects="projectStore.projects"
        :selected-project-id="projectStore.selectedProjectId"
        :loading="projectStore.loading"
        :error="projectStore.error"
        @close="closeProjectPicker"
        @refresh="refreshProjects"
        @select-project="selectProjectFromPicker"
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

    <section class="sticky bottom-0 z-[105] mt-3 grid grid-cols-5 gap-2 rounded-[var(--tf-radius-lg)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-2 lg:hidden">
      <button
        type="button"
        class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] px-2 py-2 text-xs text-[var(--tf-color-text-default)]"
        :disabled="!previousAvailable"
        @click="goToPreviousImage"
      >
        Prev
      </button>
      <button
        type="button"
        class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] px-2 py-2 text-xs text-[var(--tf-color-text-default)]"
        :disabled="!nextAvailable"
        @click="goToNextImage"
      >
        Next
      </button>
      <button
        type="button"
        class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] px-2 py-2 text-xs text-[var(--tf-color-text-default)]"
        @click="openMobilePanel('browser')"
      >
        Browse
      </button>
      <button
        type="button"
        class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] px-2 py-2 text-xs text-[var(--tf-color-text-default)]"
        @click="openMobilePanel('inspector')"
      >
        Inspect
      </button>
      <button
        type="button"
        class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] px-2 py-2 text-xs text-[var(--tf-color-text-default)]"
        @click="openMobilePanel('tags')"
      >
        Tags
      </button>
    </section>

    <div
      v-if="showMobilePanel"
      class="fixed inset-0 z-[125] lg:hidden"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/30"
        aria-label="Close mobile workspace panel"
        @click="closeMobilePanel"
      />

      <section class="absolute bottom-0 left-0 right-0 max-h-[80dvh] overflow-auto rounded-t-[var(--tf-radius-lg)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-3">
        <div class="mb-2 flex items-center justify-between gap-2">
          <p class="m-0 text-sm font-semibold text-[var(--tf-color-text-title)]">
            {{ mobilePanel === 'browser' ? 'Image Browser' : mobilePanel === 'inspector' ? 'Tag Inspector' : 'Tags Library' }}
          </p>
          <button
            type="button"
            class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] px-2 py-1 text-xs text-[var(--tf-color-text-default)]"
            @click="closeMobilePanel"
          >
            Close
          </button>
        </div>

        <WorkspaceImageBrowserPanel
          v-if="mobilePanel === 'browser'"
          :selected-project-id="projectStore.selectedProjectId"
          @select-image="selectImage"
        />

        <WorkspaceTagInspectorPanel
          v-else-if="mobilePanel === 'inspector'"
          :project-id="projectStore.selectedProjectId"
          :selected-project="selectedProject"
        />

        <WorkspaceTagsLibraryPanel
          v-else
          :show-close="false"
        />
      </section>
    </div>
  </AppShell>
</template>
