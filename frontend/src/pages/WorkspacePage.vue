<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '../components/layout/AppShell.vue'
import WorkspaceHeaderSection from '../components/layout/WorkspaceHeaderSection.vue'
import WorkspaceMobileQuickActions from '../components/layout/WorkspaceMobileQuickActions.vue'
import WorkspaceMobilePanelContent from '../components/layout/WorkspaceMobilePanelContent.vue'
import WorkspaceMobilePanelSheet from '../components/layout/WorkspaceMobilePanelSheet.vue'
import WorkspaceRightPanel from '../components/layout/WorkspaceRightPanel.vue'
import WorkspaceLayout from '../components/layout/WorkspaceLayout.vue'
import WorkspaceImageBrowserPanel from '../components/sidebar/WorkspaceImageBrowserPanel.vue'
import WorkspaceTagsLibraryPanel from '../components/sidebar/WorkspaceTagsLibraryPanel.vue'
import WorkspaceImageViewerPanel from '../components/layout/WorkspaceImageViewerPanel.vue'
import { useWorkspaceHeaderActions } from '../composables/useWorkspaceHeaderActions'
import { useWorkspaceOverlayState } from '../composables/useWorkspaceOverlayState'
import { useWorkspaceImages } from '../composables/useWorkspaceImages'
import { useProjectStore } from '../stores/projects'
import { useImageStore } from '../stores/images'

const projectStore = useProjectStore()
const imageStore = useImageStore()
const route = useRoute()
const selectedProject = computed(() => projectStore.selectedProject)
const activeRightPanel = ref<'inspector' | 'tags' | 'projects'>('inspector')
type WorkspaceMode = 'tagging' | 'projects' | 'tag-library'

const workspaceMode = computed<WorkspaceMode>(() => {
  if (activeRightPanel.value === 'projects') {
    return 'projects'
  }
  if (activeRightPanel.value === 'tags') {
    return 'tag-library'
  }
  return 'tagging'
})

const orderedProjects = computed(() =>
  [...projectStore.projects].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
)
const imageBrowserMemoKey = computed(() => {
  const imageSnapshot = imageStore.images
    .map((image) => `${image.id}:${image.tag_count}:${image.filename}`)
    .join('|')
  return `${projectStore.selectedProjectId ?? 'none'}|${imageStore.sortOption}|${imageSnapshot}`
})

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
  showProjectsPanel,
} = useWorkspaceOverlayState({ activeRightPanel })

const mobilePanelTitle = computed(() => {
  if (mobilePanel.value === 'browser') {
    return 'Image Browser'
  }
  if (mobilePanel.value === 'inspector') {
    return 'Tag Inspector'
  }
  if (mobilePanel.value === 'projects') {
    return 'Project Manager'
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

function selectProject(projectId: string) {
  projectStore.selectProject(projectId)
}

function openCreateProjectModal() {
  // Slice D will replace this with a modal flow.
}

function closeTagsLibrary() {
  activeRightPanel.value = 'inspector'
}

function isMobileViewport(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(max-width: 1023px)').matches
}

function handleShowTagsLibraryPanel() {
  showTagsLibraryPanel()
  if (isMobileViewport()) {
    openMobilePanel('tags')
  }
}

function handleShowTagInspectorPanel() {
  showTagInspectorPanel()
  if (isMobileViewport()) {
    openMobilePanel('inspector')
  }
}

function handleShowProjectsPanel() {
  showProjectsPanel()
  if (isMobileViewport()) {
    openMobilePanel('projects')
  }
}

function queryValue(key: string): string | null {
  const rawValue = route.query[key]
  return typeof rawValue === 'string' ? rawValue : null
}

watch(
  () => queryValue('panel'),
  (panel) => {
    if (panel === 'tags') {
      showTagsLibraryPanel()
      if (isMobileViewport()) {
        openMobilePanel('tags')
      }
      return
    }

    if (panel === 'projects') {
      showProjectsPanel()
      if (isMobileViewport()) {
        openMobilePanel('projects')
      }
      return
    }

    showTagInspectorPanel()

    if (panel === 'browser' && isMobileViewport()) {
      openMobilePanel('browser')
    }
  },
  { immediate: true },
)

watch(
  () => [queryValue('project'), projectStore.projects.length] as const,
  ([projectFromQuery]) => {
    if (!projectFromQuery || projectFromQuery === projectStore.selectedProjectId) {
      return
    }

    const projectExists = projectStore.projects.some((project) => project.id === projectFromQuery)
    if (!projectExists) {
      return
    }

    projectStore.selectProject(projectFromQuery)
  },
  { immediate: true },
)

watch(
  () => [queryValue('image'), projectStore.selectedProjectId] as const,
  async ([imageFromQuery, selectedProjectId]) => {
    if (!imageFromQuery || !selectedProjectId) {
      return
    }

    if (imageStore.currentImage?.id === imageFromQuery) {
      return
    }

    await selectImage(imageFromQuery)
  },
  { immediate: true },
)

</script>

<template>
  <AppShell :full-width="true">
    <template #header>
      <WorkspaceHeaderSection
        :project-name="selectedProject?.name"
        :show-project-picker="showProjectPicker"
        :show-actions-menu="showActionsMenu"
        :active-right-panel="activeRightPanel"
        :projects="projectStore.projects"
        :selected-project-id="projectStore.selectedProjectId"
        :loading="projectStore.loading"
        :error="projectStore.error"
        @open-project-picker="openProjectPicker"
        @open-overflow="openOverflow"
        @close-project-picker="closeProjectPicker"
        @refresh-projects="refreshProjects"
        @select-project="selectProjectFromPicker"
        @close-actions-menu="closeActionsMenu"
        @show-tags-library-panel="handleShowTagsLibraryPanel"
        @show-tag-inspector-panel="handleShowTagInspectorPanel"
        @show-projects-panel="handleShowProjectsPanel"
      />
    </template>

    <WorkspaceLayout
      v-if="workspaceMode === 'tagging'"
      class="h-full min-h-0"
    >
      <template #left>
        <div v-memo="[imageBrowserMemoKey]">
          <WorkspaceImageBrowserPanel
            :selected-project-id="projectStore.selectedProjectId"
            @select-image="handleSelectImage"
          />
        </div>
      </template>

      <WorkspaceImageViewerPanel
        :project-id="projectStore.selectedProjectId"
        :current-image="imageStore.currentImage"
        :ordered-images="orderedImages"
        :current-image-index="currentImageIndex"
        :loading="projectStore.loading || imageStore.imageLoading"
        :error="projectStore.error || imageStore.error"
        @previous="goToPreviousImage"
        @next="goToNextImage"
        @jump="goToImageByIndex"
      />

      <template #right>
        <WorkspaceRightPanel
          :active-panel="activeRightPanel"
          :project-id="projectStore.selectedProjectId"
          :selected-project="selectedProject"
          @close-tags-library="closeTagsLibrary"
        />
      </template>
    </WorkspaceLayout>

    <section
      v-else-if="workspaceMode === 'projects'"
      class="grid min-h-0 grid-cols-1 gap-3 lg:h-full lg:grid-cols-[minmax(240px,320px)_minmax(0,1fr)] lg:items-stretch"
    >
      <section class="rounded-[var(--tf-radius-lg)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-3 lg:h-full lg:min-h-0 lg:overflow-y-auto">
        <div class="mb-3 flex items-center justify-between gap-2">
          <h2 class="m-0 text-sm font-semibold text-[var(--tf-color-text-default)]">
            Project Browser
          </h2>
          <button
            type="button"
            class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-transparent px-2 py-1 text-xs font-medium text-[var(--tf-color-text-default)]"
            @click="openCreateProjectModal"
          >
            Create Project
          </button>
        </div>

        <div class="space-y-2">
          <button
            v-for="project in orderedProjects"
            :key="project.id"
            type="button"
            class="flex w-full items-start gap-2 rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-transparent p-2 text-left"
            :class="project.id === projectStore.selectedProjectId ? 'ring-1 ring-[var(--tf-color-accent)]' : ''"
            @click="selectProject(project.id)"
          >
            <span class="mt-0.5 grid h-10 w-10 place-items-center rounded-[var(--tf-radius-sm)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface-muted)] text-xs text-[var(--tf-color-text-muted)]">
              IMG
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium text-[var(--tf-color-text-default)]">{{ project.name }}</span>
              <span class="block truncate text-xs text-[var(--tf-color-text-muted)]">class: {{ project.class_tag }}</span>
            </span>
          </button>
        </div>
      </section>

      <section class="rounded-[var(--tf-radius-lg)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-3 lg:h-full lg:min-h-0 lg:overflow-y-auto">
        <WorkspaceRightPanel
          active-panel="projects"
          :project-id="projectStore.selectedProjectId"
          :selected-project="selectedProject"
          @close-tags-library="closeTagsLibrary"
        />
      </section>
    </section>

    <section
      v-else
      class="rounded-[var(--tf-radius-lg)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-3 lg:h-full lg:min-h-0 lg:overflow-y-auto"
    >
      <WorkspaceTagsLibraryPanel :show-close="false" />
    </section>

    <WorkspaceMobileQuickActions
      v-if="workspaceMode === 'tagging'"
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
