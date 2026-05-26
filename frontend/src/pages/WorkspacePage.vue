<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '../components/layout/AppShell.vue'
import HeaderSection from '../components/header/HeaderSection.vue'
import WorkspaceLayout from '../components/layout/WorkspaceLayout.vue'
import WorkspaceMobileSplitLayout from '../components/layout/WorkspaceMobileSplitLayout.vue'
import WorkspacePanelCard from '../components/layout/WorkspacePanelCard.vue'
import ProjectCreateModal from '../components/projects/ProjectCreateModal.vue'
import ImageBrowserCard from '../cards/image-browser/ImageBrowserCard.vue'
import CurrentTagsCard from '../cards/current-tags/CurrentTagsCard.vue'
import WorkspaceSideCardContent from './workspace/WorkspaceSideCardContent.vue'
import WorkspacePanelColumn from './workspace/WorkspacePanelColumn.vue'
import AppText from '../components/ui/AppText.vue'
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
type MobileWorkspaceBottomPanel = 'current-tags' | 'ai-proposed-tags' | 'project-details'
type MobileCurrentTagsViewMode = 'tags-only' | 'filter-only' | 'search-only'

const mobileStage = ref<MobileWorkspaceStage>('project-browser')
const activeMobileBottomPanel = ref<MobileWorkspaceBottomPanel>('current-tags')
const mobileWorkspaceSplitPercent = ref(60)
const mobileCurrentTagsViewMode = ref<MobileCurrentTagsViewMode>('tags-only')

const WORKSPACE_CARD_STATE_KEY = 'tailflow.workspace-card-state.v1'
const DEFAULT_LEFT_VIEW_ORDER: SideViewId[] = defaultSideViewOrder('left')
const DEFAULT_RIGHT_VIEW_ORDER: SideViewId[] = defaultSideViewOrder('right')

type CardId = ToggleCardId | 'project-browser'
const cardMeta: Record<CardId, CardMeta> = workspaceCardMeta

const allMobileBottomPanels: Array<{ id: MobileWorkspaceBottomPanel; label: string }> = [
  { id: 'current-tags', label: cardMeta['current-tags'].name },
  { id: 'ai-proposed-tags', label: cardMeta['ai-proposed-tags'].name },
  { id: 'project-details', label: cardMeta['project-details'].name },
]

const mobileBottomPanelOptions = computed<Array<{ id: MobileWorkspaceBottomPanel; label: string }>>(() => (
  allMobileBottomPanels.filter((option) => option.id !== activeMobileBottomPanel.value)
))

const activeMobileBottomPanelTitle = computed(() => cardMeta[activeMobileBottomPanel.value].name)

const mobileCurrentPanelActions = computed<Array<{ id: string; label: string }>>(() => {
  if (activeMobileBottomPanel.value !== 'current-tags') {
    return []
  }

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
})
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
  mobileWorkspaceSplitPercent,
  defaultLeftViewOrder: DEFAULT_LEFT_VIEW_ORDER,
  defaultRightViewOrder: DEFAULT_RIGHT_VIEW_ORDER,
  projectStore,
  imageStore,
  selectImage,
  queryValue,
})

if (projectStore.selectedProjectId && mobileStage.value === 'project-browser') {
  mobileStage.value = 'image-browser'
}

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
      class="grid h-full min-h-0 place-items-center"
    >
      <AppText tone="muted">
        Loading workspace...
      </AppText>
    </section>

    <section
      v-else-if="!isMobileViewport()"
      class="h-full min-h-0"
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
      class="-mx-3 -mt-3 h-full min-h-0"
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
          />
        </div>
      </WorkspacePanelCard>

      <WorkspaceMobileSplitLayout
        v-else
        :split-percent="mobileWorkspaceSplitPercent"
        :panel-title="activeMobileBottomPanelTitle"
        :panel-options="mobileBottomPanelOptions"
        :active-panel-id="activeMobileBottomPanel"
        :current-panel-actions="mobileCurrentPanelActions"
        :rounded="false"
        @update:split-percent="(value) => (mobileWorkspaceSplitPercent = value)"
        @select-panel="(panelId) => (activeMobileBottomPanel = panelId as MobileWorkspaceBottomPanel)"
        @select-action="handleMobilePanelAction"
      >
        <template #canvas-header-actions>
          <button
            type="button"
            class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] px-2 py-1 text-xs text-[var(--tf-color-text-default)]"
            @click="goBackToImageBrowser"
          >
            Back
          </button>
        </template>

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

          <WorkspaceSideCardContent
            v-else
            :config="sideCardConfig(activeMobileBottomPanel, false)"
          />
        </template>
      </WorkspaceMobileSplitLayout>
    </section>

    <ProjectCreateModal
      v-if="showCreateProjectModal"
      @close="closeCreateProjectModal"
      @created="handleProjectCreated"
    />
  </AppShell>
</template>
