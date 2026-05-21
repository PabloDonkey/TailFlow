<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '../components/layout/AppShell.vue'
import HeaderSection from '../components/header/HeaderSection.vue'
import WorkspaceLayout from '../components/layout/WorkspaceLayout.vue'
import WorkspaceMobileViewsTabs, {
  type MobileWorkspaceTab,
} from '../components/layout/WorkspaceMobileViewsTabs.vue'
import WorkspacePanelCard from '../components/layout/WorkspacePanelCard.vue'
import ProjectCreateModal from '../components/projects/ProjectCreateModal.vue'
import ImageBrowserCard from '../cards/image-browser/ImageBrowserCard.vue'
import WorkspaceSideCardContent from './workspace/WorkspaceSideCardContent.vue'
import WorkspacePanelColumn from './workspace/WorkspacePanelColumn.vue'
import { useWorkspaceMobileTabs } from './workspace/useWorkspaceMobileTabs'
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

const projectStore = useProjectStore()
const imageStore = useImageStore()
const route = useRoute()

const selectedProject = computed(() => projectStore.selectedProject)
const showProjectPicker = ref(false)
const showActionsMenu = ref(false)
const activeMobileTab = ref<MobileWorkspaceTab>('image-browser')

const WORKSPACE_CARD_STATE_KEY = 'tailflow.workspace-card-state.v1'
const DEFAULT_LEFT_VIEW_ORDER: SideViewId[] = defaultSideViewOrder('left')
const DEFAULT_RIGHT_VIEW_ORDER: SideViewId[] = defaultSideViewOrder('right')

type CardId = ToggleCardId | 'project-browser'
const cardMeta: Record<CardId, CardMeta> = workspaceCardMeta

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

const {
  mobileTabs,
  activeMobileSideViewId,
  activeMobileTabTitle,
} = useWorkspaceMobileTabs({
  activeMobileTab,
  cardOpenState,
  cardMeta,
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

  if (!nextState) {
    const tabView: MobileWorkspaceTab = view
    if (activeMobileTab.value === tabView) {
      const fallbackTab = mobileTabs.value.find((tab) => tab.id !== tabView)
      activeMobileTab.value = fallbackTab?.id ?? 'project-browser'
    }
  }
}

function isMobileTabClosable(tabId: MobileWorkspaceTab): boolean {
  return tabId !== 'project-browser'
}

function closeMobileActiveTab() {
  if (activeMobileTab.value === 'project-browser') {
    return
  }

  toggleView(activeMobileTab.value)
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
    activeMobileTab.value = 'canvas'
  }
}

async function handleSelectImage(imageId: string) {
  await selectImage(imageId)
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
  activeMobileTab,
  projectStore,
  imageStore,
  selectImage,
})

useWorkspacePersistence({
  storageKey: WORKSPACE_CARD_STATE_KEY,
  cardOpenState,
  leftViewOrder,
  rightViewOrder,
  activeMobileTab,
  defaultLeftViewOrder: DEFAULT_LEFT_VIEW_ORDER,
  defaultRightViewOrder: DEFAULT_RIGHT_VIEW_ORDER,
  projectStore,
  imageStore,
  selectImage,
  queryValue,
})

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
      v-if="!isMobileViewport()"
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
              v-if="centerPanelConfig.headerActions"
              :is="centerPanelConfig.headerActions.component"
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
      class="h-full min-h-0"
    >
      <WorkspaceMobileViewsTabs
        :tabs="mobileTabs"
        :active-tab="activeMobileTab"
        @select="(tab) => (activeMobileTab = tab)"
      />

      <WorkspacePanelCard
        :title="activeMobileTabTitle"
        :closable="isMobileTabClosable(activeMobileTab)"
        :draggable="false"
        @close="closeMobileActiveTab"
      >
        <template #actions>
          <component
            v-if="activeMobileTab === 'project-browser' && mobileProjectBrowserConfig.headerActions"
            :is="mobileProjectBrowserConfig.headerActions.component"
            v-bind="mobileProjectBrowserConfig.headerActions.props"
            v-on="mobileProjectBrowserConfig.headerActions.listeners"
          />
        </template>

        <div
          v-if="activeMobileTab === 'image-browser'"
          v-memo="[imageBrowserMemoKey]"
        >
          <ImageBrowserCard
            :selected-project-id="projectStore.selectedProjectId"
            @select-image="handleSelectImage"
          />
        </div>

        <component
          v-else-if="activeMobileTab === 'canvas'"
          :is="mobileCanvasConfig.component"
          v-bind="mobileCanvasConfig.props"
          v-on="mobileCanvasConfig.listeners"
        />

        <WorkspaceSideCardContent
          v-else-if="activeMobileSideViewId"
          :config="sideCardConfig(activeMobileSideViewId, false)"
        />

        <component
          v-else
          :is="mobileProjectBrowserConfig.component"
          v-bind="mobileProjectBrowserConfig.props"
          v-on="mobileProjectBrowserConfig.listeners"
        />
      </WorkspacePanelCard>
    </section>

    <ProjectCreateModal
      v-if="showCreateProjectModal"
      @close="closeCreateProjectModal"
      @created="handleProjectCreated"
    />
  </AppShell>
</template>
