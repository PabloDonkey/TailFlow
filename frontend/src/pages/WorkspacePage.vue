<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '../components/layout/AppShell.vue'
import HeaderSection from '../components/header/HeaderSection.vue'
import WorkspaceLayout from '../components/layout/WorkspaceLayout.vue'
import WorkspacePanelCard from '../components/layout/WorkspacePanelCard.vue'
import ProjectCreateModal from '../components/projects/ProjectCreateModal.vue'
import ImageBrowserCard from '../cards/image-browser/ImageBrowserCard.vue'
import CurrentTagsCard from '../cards/current-tags/CurrentTagsCard.vue'
import AiProposedTagsCard from '../cards/ai-proposed-tags/AiProposedTagsCard.vue'
import WorkspaceSideCardContent from './workspace/WorkspaceSideCardContent.vue'
import WorkspacePanelColumn from './workspace/WorkspacePanelColumn.vue'
import AppText from '../components/ui/AppText.vue'
import WorkspaceMobileCanvas from './workspace/WorkspaceMobileCanvas.vue'
import {
  defaultSideViewOrder,
  defaultToggleCardOpenState,
  type CardMeta,
  type SideViewId,
  type ToggleCardId,
  workspaceCardMeta,
} from './workspace/side-card-service'
import { useWorkspaceHeaderActions } from '../composables/useWorkspaceHeaderActions'
import { useWorkspaceImages } from '../composables/useWorkspaceImages'
import { useProjectStore } from '../stores/projects'
import { useImageStore } from '../stores/images'
import { useWorkspaceViewport } from './workspace/useWorkspaceViewport'
import { useWorkspaceProjectFlows } from './workspace/useWorkspaceProjectFlows'
import { useWorkspaceAiTagActions } from './workspace/useWorkspaceAiTagActions'
import { useWorkspacePanelState } from './workspace/useWorkspacePanelState'
import { useWorkspaceRouteSync } from './workspace/useWorkspaceRouteSync'
import { useWorkspacePersistence } from './workspace/useWorkspacePersistence'
import { useWorkspaceCardRuntime } from './workspace/useWorkspaceCardRuntime'
import { useToast } from '../composables/useToast'

const projectStore = useProjectStore()
const imageStore = useImageStore()
const route = useRoute()

const selectedProject = computed(() => projectStore.selectedProject)
const showProjectPicker = ref(false)
const showActionsMenu = ref(false)

type MobileWorkspaceStage = 'project-browser' | 'image-browser' | 'workspace'
type MobileWorkspaceBottomPanel = 'current-tags' | 'ai-proposed-tags' | 'project-details' | 'image-info'
type MobileCurrentTagsViewMode = 'tags-only' | 'filter-only' | 'search-only'
type MobileAiProposedTagsViewMode = 'essentials' | 'advanced'

const mobileStage = ref<MobileWorkspaceStage>('project-browser')
const activeMobileBottomPanel = ref<MobileWorkspaceBottomPanel>('current-tags')
const mobileWorkspaceSplitPercent = ref(60)
const mobileCurrentTagsViewMode = ref<MobileCurrentTagsViewMode>('tags-only')
const mobileAiProposedTagsViewMode = ref<MobileAiProposedTagsViewMode>('essentials')
const mobileAiScanRequestNonce = ref(0)
const mobileAiSelectedToggleRequestNonce = ref(0)

const WORKSPACE_CARD_STATE_KEY = 'tailflow.workspace-card-state.v1'
const DEFAULT_LEFT_VIEW_ORDER: SideViewId[] = defaultSideViewOrder('left')
const DEFAULT_RIGHT_VIEW_ORDER: SideViewId[] = defaultSideViewOrder('right')

type CardId = ToggleCardId | 'project-browser'
const cardMeta: Record<CardId, CardMeta> = workspaceCardMeta

const allMobileBottomPanels: Array<{ id: MobileWorkspaceBottomPanel; label: string }> = [
  { id: 'current-tags', label: cardMeta['current-tags'].name },
  { id: 'ai-proposed-tags', label: cardMeta['ai-proposed-tags'].name },
  { id: 'project-details', label: cardMeta['project-details'].name },
  { id: 'image-info', label: cardMeta['image-info'].name },
]

const mobileBottomPanelOptions = computed<Array<{ id: MobileWorkspaceBottomPanel; label: string }>>(() => (
  allMobileBottomPanels.filter((option) => option.id !== activeMobileBottomPanel.value)
))

const activeMobileBottomPanelTitle = computed(() => cardMeta[activeMobileBottomPanel.value].name)

const mobileCurrentPanelActions = computed<Array<{ id: string; label: string }>>(() => {
  if (activeMobileBottomPanel.value === 'current-tags') {
    const mode = mobileCurrentTagsViewMode.value

    return [
      {
        id: 'copy-current-tags',
        label: `Copy Current Tags${currentImageTagsPayload.value ? '' : ' (Empty)'}`,
      },
      {
        id: 'set-current-tags-view-tags-only',
        label: `${mode === 'tags-only' ? 'Active: ' : ''}Show Only Tags`,
      },
      {
        id: 'set-current-tags-view-filter-only',
        label: `${mode === 'filter-only' ? 'Active: ' : ''}Show Only Filter`,
      },
      {
        id: 'set-current-tags-view-search-only',
        label: `${mode === 'search-only' ? 'Active: ' : ''}Show Only Search`,
      },
    ]
  }

  if (activeMobileBottomPanel.value === 'ai-proposed-tags') {
    const mode = mobileAiProposedTagsViewMode.value

    return [
      {
        id: 'set-ai-proposed-tags-view-essentials',
        label: `${mode === 'essentials' ? 'Active: ' : ''}Show Proposals + Filter + Scan`,
      },
      {
        id: 'set-ai-proposed-tags-view-advanced',
        label: `${mode === 'advanced' ? 'Active: ' : ''}Show Advanced Controls`,
      },
    ]
  }

  return []
})

const mobileAiProposedTagsDisplay = computed(() => ({
  showTopBar: mobileAiProposedTagsViewMode.value === 'advanced',
  showFilter: true,
  showScanControls: false,
  showAdvancedControls: mobileAiProposedTagsViewMode.value === 'advanced',
  showTagsList: mobileAiProposedTagsViewMode.value !== 'advanced',
}))
const currentImageTagsPayload = computed(() => {
  const tags = imageStore.currentImage?.tags ?? []
  return tags.map((tag) => tag.name.trim()).filter((name) => name.length > 0).join(',')
})

const {
  isMobileViewport,
} = useWorkspaceViewport()

const {
  showCreateProjectModal,
  openCreateProjectModal,
  closeCreateProjectModal,
  handleProjectCreated,
  discoverProjectsFromBrowser,
} = useWorkspaceProjectFlows({ projectStore })

const {
  orderedImages,
  currentImageIndex,
  selectImage,
  goToImageByIndex,
  goToPreviousImage,
  goToNextImage,
  deleteCurrentImage,
} = useWorkspaceImages({ projectStore, imageStore })

const {
  handleAiProposedTagAdd,
  handleAiProposedTagRemove,
} = useWorkspaceAiTagActions({ projectStore, imageStore })

const { showToast } = useToast()

function closeProjectPicker() {
  showProjectPicker.value = false
}

const {
  refreshProjects,
  selectProjectFromPicker,
} = useWorkspaceHeaderActions({
  projectStore,
  closeProjectPicker,
})

const {
  cardOpenState,
  leftViewOrder,
  rightViewOrder,
  draggedSideView,
  sideDropIndicator,
  leftVisibleViewIds,
  rightVisibleViewIds,
  centerPanel,
  headerOpenViews,
  leftColumnPanels,
  rightColumnPanels,
  centerColumnPanels,
  isCardOpen,
  setViewOpen,
  closeView,
  closeCenterPanel,
  onSidePanelDragStart,
  onSidePanelDragEnd,
  handleSidePanelDragOver,
  handleSideColumnDragOver,
  handleSideDrop,
  ensureSideViewPlacement,
} = useWorkspacePanelState({
  cardMeta,
  defaultToggleCardOpenState,
  defaultLeftViewOrder: DEFAULT_LEFT_VIEW_ORDER,
  defaultRightViewOrder: DEFAULT_RIGHT_VIEW_ORDER,
  selectedProjectId: computed(() => projectStore.selectedProjectId),
  onCanvasClosed: () => {
    projectStore.selectedProjectId = null
  },
})

function closeActionsMenu() {
  showActionsMenu.value = false
}

function openProjectPicker() {
  showProjectPicker.value = !showProjectPicker.value
  showActionsMenu.value = false
}

function openOverflow() {
  showProjectPicker.value = false
  showActionsMenu.value = !showActionsMenu.value
}

function toggleView(view: ToggleCardId) {
  closeActionsMenu()

  const nextState = !isCardOpen(view)
  setViewOpen(view, nextState)

  if (nextState && view !== 'canvas') {
    ensureSideViewPlacement(view)
  }
}

function selectProject(projectId: string) {
  projectStore.selectProject(projectId)
}

function handleShowTaggingFromProjectBrowser(projectId: string) {
  if (projectStore.selectedProjectId !== projectId) {
    projectStore.selectProject(projectId)
  }

  setViewOpen('canvas', true)

  if (isMobileViewport()) {
    mobileStage.value = 'image-browser'
  }
}

async function handleSelectImage(imageId: string) {
  await selectImage(imageId)

  if (isMobileViewport() && mobileStage.value === 'image-browser') {
    mobileStage.value = 'workspace'
  }
}

function openMobileWorkspace() {
  if (!projectStore.selectedProjectId) {
    return
  }

  mobileStage.value = 'workspace'
}

function goBackToProjectBrowser() {
  mobileStage.value = 'project-browser'
}

function goBackToImageBrowser() {
  if (!projectStore.selectedProjectId) {
    mobileStage.value = 'project-browser'
    return
  }

  mobileStage.value = 'image-browser'
}

async function handleMobileDeleteConfirm(): Promise<void> {
  await deleteCurrentImage()
}

async function handleUploadImagesToCurrentProject(files: File[]): Promise<void> {
  const projectId = projectStore.selectedProjectId
  if (!projectId || files.length === 0) {
    return
  }

  const uploadResult = await projectStore.uploadImagesToProject(projectId, files)
  if (!uploadResult) {
    return
  }

  await imageStore.fetchImages(projectId)

  const firstUploadedPath = uploadResult.uploaded_files[0]
  if (firstUploadedPath) {
    const uploadedImage = imageStore.images.find((image) => image.relative_path === firstUploadedPath)
    if (uploadedImage) {
      await imageStore.fetchImage(projectId, uploadedImage.id)
    }
  }

  showToast(`Added ${uploadResult.uploaded_files.length} image(s) to dataset`)
}

async function handleReplaceCurrentImage(file: File): Promise<void> {
  const projectId = projectStore.selectedProjectId
  const currentImage = imageStore.currentImage
  if (!projectId || !currentImage) {
    return
  }

  const replaced = await imageStore.replaceImage(projectId, currentImage.id, file)
  if (!replaced) {
    return
  }

  await imageStore.fetchImages(projectId)
  await imageStore.fetchImage(projectId, currentImage.id)
  showToast(`Replaced image ${currentImage.filename}`)
}

async function handleSetCurrentImageAsFeatured(): Promise<void> {
  const projectId = projectStore.selectedProjectId
  const currentImage = imageStore.currentImage
  if (!projectId || !currentImage) {
    return
  }

  const updated = await projectStore.setFeaturedImage(projectId, currentImage.id)
  if (!updated) {
    return
  }

  showToast(`Featured image set to ${currentImage.filename}`)
}

function handleMobileAiScanRequest(): void {
  if (activeMobileBottomPanel.value !== 'ai-proposed-tags') {
    return
  }

  mobileAiScanRequestNonce.value += 1
}

function handleMobileAiSelectedToggleRequest(): void {
  if (activeMobileBottomPanel.value !== 'ai-proposed-tags') {
    return
  }

  mobileAiSelectedToggleRequestNonce.value += 1
}

async function handleMobilePanelAction(actionId: string) {
  if (actionId === 'copy-current-tags') {
    if (!currentImageTagsPayload.value || !navigator.clipboard?.writeText) {
      return
    }

    await navigator.clipboard.writeText(currentImageTagsPayload.value)
    showToast('tags copied to clipboard')
    return
  }

  if (actionId === 'set-current-tags-view-tags-only') {
    mobileCurrentTagsViewMode.value = 'tags-only'
    return
  }

  if (actionId === 'set-current-tags-view-filter-only') {
    mobileCurrentTagsViewMode.value = 'filter-only'
    return
  }

  if (actionId === 'set-current-tags-view-search-only') {
    mobileCurrentTagsViewMode.value = 'search-only'
    return
  }

  if (actionId === 'set-ai-proposed-tags-view-essentials') {
    mobileAiProposedTagsViewMode.value = 'essentials'
    return
  }

  if (actionId === 'set-ai-proposed-tags-view-advanced') {
    mobileAiProposedTagsViewMode.value = 'advanced'
  }
}

const {
  sideCardConfig,
  centerPanelConfig,
  mobileCanvasConfig,
  mobileProjectBrowserConfig,
} = useWorkspaceCardRuntime({
  projectStore,
  imageStore,
  selectedProject,
  orderedImages,
  currentImageIndex,
  centerPanel,
  selectImage,
  addAiTag: handleAiProposedTagAdd,
  removeAiTag: handleAiProposedTagRemove,
  selectProject,
  openCreateProject: openCreateProjectModal,
  discoverProjects: discoverProjectsFromBrowser,
  showTaggingFromProjectBrowser: handleShowTaggingFromProjectBrowser,
  previousImage: goToPreviousImage,
  nextImage: goToNextImage,
  jumpToImage: goToImageByIndex,
  deleteCurrentImage,
  setCurrentImageAsFeatured: handleSetCurrentImageAsFeatured,
  uploadImagesToCurrentProject: handleUploadImagesToCurrentProject,
  replaceCurrentImage: handleReplaceCurrentImage,
})

const {
  queryValue,
} = useWorkspaceRouteSync({
  route,
  setViewOpen,
  mobileStage,
  activeMobileBottomPanel,
  projectStore,
  imageStore,
  selectImage,
})

const {
  isWorkspaceRestorePending,
} = useWorkspacePersistence({
  storageKey: WORKSPACE_CARD_STATE_KEY,
  cardOpenState,
  leftViewOrder,
  rightViewOrder,
  mobileStage,
  activeMobileBottomPanel,
  mobileCurrentTagsViewMode,
  mobileAiProposedTagsViewMode,
  mobileWorkspaceSplitPercent,
  defaultLeftViewOrder: DEFAULT_LEFT_VIEW_ORDER,
  defaultRightViewOrder: DEFAULT_RIGHT_VIEW_ORDER,
  projectStore,
  imageStore,
  selectImage,
  queryValue,
})

watch(
  () => projectStore.selectedProjectId,
  (projectId) => {
    if (!isMobileViewport()) {
      return
    }

    if (!projectId) {
      mobileStage.value = 'project-browser'
    }
  },
  { immediate: true },
)

function sidePanelDefaultSize(panelIndex: number, totalPanels: number): number {
  if (totalPanels <= 0) {
    return 100
  }

  const base = Math.floor(100 / totalPanels)
  const remainder = 100 - base * totalPanels

  if (panelIndex === 0) {
    return base + remainder
  }

  return base
}

const imageBrowserMemoKey = computed(() => {
  const imageSnapshot = imageStore.images
    .map((image) => `${image.id}:${image.tag_count}:${image.filename}`)
    .join('|')
  return `${projectStore.selectedProjectId ?? 'none'}|${imageStore.sortOption}|${imageSnapshot}`
})
</script>

<template>
  <AppShell :full-width="true">
    <template #header>
      <HeaderSection
        :project-name="selectedProject?.name"
        :show-project-picker="showProjectPicker"
        :show-actions-menu="showActionsMenu"
        :open-views="headerOpenViews"
        :projects="projectStore.projects"
        :selected-project-id="projectStore.selectedProjectId"
        :loading="projectStore.loading"
        :workspace-loading="isWorkspaceRestorePending"
        :error="projectStore.error"
        @open-project-picker="openProjectPicker"
        @open-overflow="openOverflow"
        @close-project-picker="closeProjectPicker"
        @refresh-projects="refreshProjects"
        @select-project="selectProjectFromPicker"
        @close-actions-menu="closeActionsMenu"
        @toggle-view="toggleView"
      />
    </template>

    <section
      v-if="isWorkspaceRestorePending"
      class="grid min-h-0 flex-1 place-items-center"
    >
      <AppText tone="muted">
        Loading workspace...
      </AppText>
    </section>

    <section
      v-else-if="!isMobileViewport()"
      class="min-h-0 flex-1"
    >
      <WorkspaceLayout
        :show-left="leftVisibleViewIds.length > 0"
        :show-right="rightVisibleViewIds.length > 0"
        class="h-full min-h-0"
      >
        <template #left>
          <WorkspacePanelColumn
            column-id="left"
            :panels="leftColumnPanels"
            :enable-drag-drop="true"
            :dragged-panel-id="draggedSideView"
            :drop-indicator="sideDropIndicator"
            :panel-default-size="sidePanelDefaultSize"
            @close="(panelId) => closeView(panelId as SideViewId)"
            @panel-drag-start="(panelId, event) => onSidePanelDragStart(panelId as SideViewId, event)"
            @panel-drag-end="onSidePanelDragEnd"
            @panel-drag-over="(panelIndex, event) => handleSidePanelDragOver('left', panelIndex, event)"
            @panel-drop="(panelIndex, event) => handleSideDrop('left', leftVisibleViewIds.length, event, panelIndex)"
            @column-drag-over="(_total, event) => handleSideColumnDragOver('left', leftVisibleViewIds.length, event)"
            @column-drop="(_total, event) => handleSideDrop('left', leftVisibleViewIds.length, event, null)"
          >
            <template #default="{ panel }">
              <WorkspaceSideCardContent
                v-if="panel"
                :config="sideCardConfig(panel.id as SideViewId, false)"
              />
            </template>
          </WorkspacePanelColumn>
        </template>

        <WorkspacePanelColumn
          column-id="center"
          :panels="centerColumnPanels"
          :panel-default-size="sidePanelDefaultSize"
          @close="closeCenterPanel"
        >
          <template #actions>
            <component
              :is="centerPanelConfig.headerActions.component"
              v-if="centerPanelConfig.headerActions"
              v-bind="centerPanelConfig.headerActions.props"
              v-on="centerPanelConfig.headerActions.listeners"
            />
          </template>

          <template #default>
            <component
              :is="centerPanelConfig.component"
              v-bind="centerPanelConfig.props"
              v-on="centerPanelConfig.listeners"
            />
          </template>
        </WorkspacePanelColumn>

        <template #right>
          <WorkspacePanelColumn
            column-id="right"
            :panels="rightColumnPanels"
            :enable-drag-drop="true"
            :dragged-panel-id="draggedSideView"
            :drop-indicator="sideDropIndicator"
            :panel-default-size="sidePanelDefaultSize"
            @close="(panelId) => closeView(panelId as SideViewId)"
            @panel-drag-start="(panelId, event) => onSidePanelDragStart(panelId as SideViewId, event)"
            @panel-drag-end="onSidePanelDragEnd"
            @panel-drag-over="(panelIndex, event) => handleSidePanelDragOver('right', panelIndex, event)"
            @panel-drop="(panelIndex, event) => handleSideDrop('right', rightVisibleViewIds.length, event, panelIndex)"
            @column-drag-over="(_total, event) => handleSideColumnDragOver('right', rightVisibleViewIds.length, event)"
            @column-drop="(_total, event) => handleSideDrop('right', rightVisibleViewIds.length, event, null)"
          >
            <template #default="{ panel }">
              <WorkspaceSideCardContent
                v-if="panel"
                :config="sideCardConfig(panel.id as SideViewId, false)"
              />
            </template>
          </WorkspacePanelColumn>
        </template>
      </WorkspaceLayout>
    </section>

    <section
      v-else
      class="-mx-3 -mb-3 -mt-3 min-h-0 flex-1"
    >
      <WorkspacePanelCard
        v-if="mobileStage === 'project-browser'"
        title="Project Browser"
        :closable="false"
        :draggable="false"
        :rounded="false"
      >
        <template #actions>
          <component
            :is="mobileProjectBrowserConfig.headerActions.component"
            v-if="mobileProjectBrowserConfig.headerActions"
            v-bind="mobileProjectBrowserConfig.headerActions.props"
            v-on="mobileProjectBrowserConfig.headerActions.listeners"
          />
        </template>

        <component
          :is="mobileProjectBrowserConfig.component"
          v-bind="mobileProjectBrowserConfig.props"
          v-on="mobileProjectBrowserConfig.listeners"
        />
      </WorkspacePanelCard>

      <WorkspacePanelCard
        v-else-if="mobileStage === 'image-browser'"
        title="Image Browser"
        :closable="false"
        :draggable="false"
        :rounded="false"
      >
        <template #actions>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] px-2 py-1 text-xs text-[var(--tf-color-text-default)]"
              @click="goBackToProjectBrowser"
            >
              Back
            </button>

            <button
              type="button"
              class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] px-2 py-1 text-xs text-[var(--tf-color-text-default)]"
              :disabled="!imageStore.currentImage"
              @click="openMobileWorkspace"
            >
              Open Workspace
            </button>
          </div>
        </template>

        <div
          v-memo="[imageBrowserMemoKey]"
        >
          <ImageBrowserCard
            :selected-project-id="projectStore.selectedProjectId"
            @select-image="handleSelectImage"
            @upload-images="handleUploadImagesToCurrentProject"
          />
        </div>
      </WorkspacePanelCard>

      <WorkspaceMobileCanvas
        v-else
        :split-percent="mobileWorkspaceSplitPercent"
        :panel-title="activeMobileBottomPanelTitle"
        :panel-options="mobileBottomPanelOptions"
        :active-panel-id="activeMobileBottomPanel"
        :current-panel-actions="mobileCurrentPanelActions"
        :show-panel-scan-button="activeMobileBottomPanel === 'ai-proposed-tags' && mobileAiProposedTagsViewMode !== 'advanced'"
        :show-panel-selected-toggle-button="activeMobileBottomPanel === 'ai-proposed-tags' && mobileAiProposedTagsViewMode !== 'advanced'"
        :current-image-exists="!!imageStore.currentImage"
        :current-image-is-featured="Boolean(
          imageStore.currentImage
          && selectedProject?.featured_image_id === imageStore.currentImage.id
        )"
        :current-image-filename="imageStore.currentImage?.filename"
        :can-go-to-previous="currentImageIndex > 0"
        :can-go-to-next="currentImageIndex >= 0 && currentImageIndex < orderedImages.length - 1"
        :rounded="false"
        @update:split-percent="(value) => (mobileWorkspaceSplitPercent = value)"
        @select-panel="(panelId) => (activeMobileBottomPanel = panelId as MobileWorkspaceBottomPanel)"
        @select-action="handleMobilePanelAction"
        @delete-confirm="handleMobileDeleteConfirm"
        @go-back="goBackToImageBrowser"
        @scan-panel="handleMobileAiScanRequest"
        @toggle-panel-selected-filter="handleMobileAiSelectedToggleRequest"
        @navigate-previous="goToPreviousImage"
        @navigate-next="goToNextImage"
        @replace-image="handleReplaceCurrentImage"
        @upload-images="handleUploadImagesToCurrentProject"
        @set-featured="handleSetCurrentImageAsFeatured"
      >
        <template #canvas>
          <component
            :is="mobileCanvasConfig.component"
            v-bind="mobileCanvasConfig.props"
            v-on="mobileCanvasConfig.listeners"
          />
        </template>

        <template #panel>
          <CurrentTagsCard
            v-if="activeMobileBottomPanel === 'current-tags'"
            :project-id="projectStore.selectedProjectId"
            :selected-project="selectedProject"
            :framed="false"
            :show-controls="mobileCurrentTagsViewMode === 'search-only'"
            :show-search="mobileCurrentTagsViewMode === 'search-only'"
            :show-filter="mobileCurrentTagsViewMode === 'filter-only'"
            :show-tags="mobileCurrentTagsViewMode === 'tags-only'"
            :show-copy-button="false"
          />

          <AiProposedTagsCard
            v-else-if="activeMobileBottomPanel === 'ai-proposed-tags'"
            :project-id="projectStore.selectedProjectId"
            :image-id="imageStore.currentImage?.id ?? null"
            :mode="selectedProject?.tagging_mode ?? 'booru'"
            :current-tags="imageStore.currentImage?.tags ?? []"
            :framed="false"
            :show-top-bar="mobileAiProposedTagsDisplay.showTopBar"
            :show-filter="mobileAiProposedTagsDisplay.showFilter"
            :show-scan-controls="mobileAiProposedTagsDisplay.showScanControls"
            :show-advanced-controls="mobileAiProposedTagsDisplay.showAdvancedControls"
            :show-tags-list="mobileAiProposedTagsDisplay.showTagsList"
            :show-controls-toggle="false"
            :show-selected-toggle="false"
            :show-inline-scan-button="false"
            :scan-request-nonce="mobileAiScanRequestNonce"
            :selected-toggle-request-nonce="mobileAiSelectedToggleRequestNonce"
            @add="handleAiProposedTagAdd"
            @remove="handleAiProposedTagRemove"
          />

          <WorkspaceSideCardContent
            v-else
            :config="sideCardConfig(activeMobileBottomPanel, false)"
          />
        </template>
      </WorkspaceMobileCanvas>
    </section>

    <ProjectCreateModal
      v-if="showCreateProjectModal"
      @close="closeCreateProjectModal"
      @created="handleProjectCreated"
    />
  </AppShell>
</template>
