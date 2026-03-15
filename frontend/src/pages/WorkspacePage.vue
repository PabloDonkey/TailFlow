<script setup lang="ts">
import { computed, ref } from 'vue'
import AppShell from '../components/layout/AppShell.vue'
import AppHeader from '../components/layout/AppHeader.vue'
import WorkspaceMobileQuickActions from '../components/layout/WorkspaceMobileQuickActions.vue'
import WorkspaceMobilePanelContent from '../components/layout/WorkspaceMobilePanelContent.vue'
import WorkspaceMobilePanelSheet from '../components/layout/WorkspaceMobilePanelSheet.vue'
import WorkspaceActionsMenu from '../components/layout/WorkspaceActionsMenu.vue'
import WorkspaceRightPanel from '../components/layout/WorkspaceRightPanel.vue'
import WorkspaceLayout from '../components/layout/WorkspaceLayout.vue'
import WorkspaceImageBrowserPanel from '../components/sidebar/WorkspaceImageBrowserPanel.vue'
import WorkspaceProjectPickerPanel from '../components/sidebar/WorkspaceProjectPickerPanel.vue'
import WorkspaceImageViewerPanel from '../components/layout/WorkspaceImageViewerPanel.vue'
import { useWorkspaceHeaderActions } from '../composables/useWorkspaceHeaderActions'
import { useWorkspaceOverlayState } from '../composables/useWorkspaceOverlayState'
import { useWorkspaceImages } from '../composables/useWorkspaceImages'
import { useProjectStore } from '../stores/projects'
import { useImageStore } from '../stores/images'

const projectStore = useProjectStore()
const imageStore = useImageStore()
const selectedProject = computed(() => projectStore.selectedProject)
const showTagsLibrary = ref(false)

const {
  orderedImages,
  currentImageIndex,
  previousAvailable,
  nextAvailable,
  selectImage,
  goToImageByIndex,
  goToPreviousImage,
  goToNextImage,
} = useWorkspaceImages({ projectStore, imageStore })

const {
  showMobilePanel,
  mobilePanel,
  showProjectPicker,
  showActionsMenu,
  openMobilePanel,
  closeMobilePanel,
  openProjectPicker,
  openOverflow,
  closeActionsMenu,
  closeProjectPicker,
  showTagsLibraryPanel,
  showTagInspectorPanel,
} = useWorkspaceOverlayState({ showTagsLibrary })

const mobilePanelTitle = computed(() => {
  if (mobilePanel.value === 'browser') {
    return 'Image Browser'
  }
  if (mobilePanel.value === 'inspector') {
    return 'Tag Inspector'
  }
  return 'Tags Library'
})

const {
  refreshProjects,
  selectProjectFromPicker,
} = useWorkspaceHeaderActions({
  projectStore,
  closeProjectPicker,
})

async function handleSelectImage(imageId: string) {
  await selectImage(imageId)
  closeMobilePanel()
}

function closeTagsLibrary() {
  showTagsLibrary.value = false
}

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
          @select-image="handleSelectImage"
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
        <WorkspaceRightPanel
          :show-tags-library="showTagsLibrary"
          :project-id="projectStore.selectedProjectId"
          :selected-project="selectedProject"
          @close-tags-library="closeTagsLibrary"
        />
      </template>
    </WorkspaceLayout>

    <WorkspaceMobileQuickActions
      :previous-available="previousAvailable"
      :next-available="nextAvailable"
      @previous="goToPreviousImage"
      @next="goToNextImage"
      @open-panel="openMobilePanel"
    />

    <WorkspaceMobilePanelSheet
      v-if="showMobilePanel"
      :title="mobilePanelTitle"
      @close="closeMobilePanel"
    >
      <WorkspaceMobilePanelContent
        :panel="mobilePanel"
        :selected-project-id="projectStore.selectedProjectId"
        :selected-project="selectedProject"
        @select-image="handleSelectImage"
      />
    </WorkspaceMobilePanelSheet>
  </AppShell>
</template>
