<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from 'reka-ui'
import AppShell from '../components/layout/AppShell.vue'
import HeaderSection from '../components/header/HeaderSection.vue'
import WorkspaceLayout from '../components/layout/WorkspaceLayout.vue'
import ImageCanvasCard from '../cards/image-canvas/ImageCanvasCard.vue'
import WorkspaceMobileViewsTabs, {
  type MobileWorkspaceTab,
} from '../components/layout/WorkspaceMobileViewsTabs.vue'
import WorkspacePanelCard from '../components/layout/WorkspacePanelCard.vue'
import ProjectBrowserCard from '../cards/project-browser/ProjectBrowserCard.vue'
import ProjectCreateModal from '../components/projects/ProjectCreateModal.vue'
import ProjectDetailsCard from '../cards/project-details/ProjectDetailsCard.vue'
import CurrentTagsCard from '../cards/current-tags/CurrentTagsCard.vue'
import AiProposedTagsCard from '../cards/ai-proposed-tags/AiProposedTagsCard.vue'
import ImageBrowserCard from '../cards/image-browser/ImageBrowserCard.vue'
import TagsLibraryCard from '../cards/tags-library/TagsLibraryCard.vue'
import { useWorkspaceHeaderActions } from '../composables/useWorkspaceHeaderActions'
import { useWorkspaceImages } from '../composables/useWorkspaceImages'
import { useProjectStore } from '../stores/projects'
import { useImageStore } from '../stores/images'

const projectStore = useProjectStore()
const imageStore = useImageStore()
const route = useRoute()

const selectedProject = computed(() => projectStore.selectedProject)
const showCreateProjectModal = ref(false)
const showProjectPicker = ref(false)
const showActionsMenu = ref(false)
const isMobileViewportRef = ref(false)

type SideViewId = 'image-browser' | 'current-tags' | 'ai-proposed-tags' | 'tags-library' | 'project-details'
type ToggleCardId = SideViewId | 'canvas'
type CardId = ToggleCardId | 'project-browser'

const cardMeta: Record<CardId, { name: string; draggable: boolean; requiresProjectSelected: boolean }> = {
  'image-browser': {
    name: 'Image Browser',
    draggable: true,
    requiresProjectSelected: true,
  },
  canvas: {
    name: 'Image Canvas',
    draggable: false,
    requiresProjectSelected: true,
  },
  'current-tags': {
    name: 'Current Tags',
    draggable: true,
    requiresProjectSelected: true,
  },
  'ai-proposed-tags': {
    name: 'AI Proposed Tags',
    draggable: true,
    requiresProjectSelected: true,
  },
  'tags-library': {
    name: 'Tags Library',
    draggable: true,
    requiresProjectSelected: false,
  },
  'project-details': {
    name: 'Project Details',
    draggable: true,
    requiresProjectSelected: true,
  },
  'project-browser': {
    name: 'Project Browser',
    draggable: false,
    requiresProjectSelected: false,
  },
}

const cardOpenState = ref<Record<ToggleCardId, boolean>>({
  'image-browser': true,
  canvas: true,
  'current-tags': true,
  'ai-proposed-tags': true,
  'tags-library': false,
  'project-details': false,
})

const leftViewOrder = ref<SideViewId[]>(['image-browser'])
const rightViewOrder = ref<SideViewId[]>(['current-tags', 'ai-proposed-tags', 'tags-library', 'project-details'])
const draggedSideView = ref<SideViewId | null>(null)
const activeMobileTab = ref<MobileWorkspaceTab>('image-browser')
const hasSelectedProject = computed(() => Boolean(projectStore.selectedProjectId))
const WORKSPACE_CARD_STATE_KEY = 'tailflow.workspace-card-state.v1'

const imageBrowserMemoKey = computed(() => {
  const imageSnapshot = imageStore.images
    .map((image) => `${image.id}:${image.tag_count}:${image.filename}`)
    .join('|')
  return `${projectStore.selectedProjectId ?? 'none'}|${imageStore.sortOption}|${imageSnapshot}`
})

const {
  orderedImages,
  currentImageIndex,
  selectImage,
  goToImageByIndex,
  goToPreviousImage,
  goToNextImage,
} = useWorkspaceImages({ projectStore, imageStore })

const {
  refreshProjects,
  selectProjectFromPicker,
} = useWorkspaceHeaderActions({
  projectStore,
  closeProjectPicker,
})

function cardTitle(cardId: CardId): string {
  return cardMeta[cardId].name
}

function isCardOpen(cardId: ToggleCardId): boolean {
  return cardOpenState.value[cardId]
}

function isCardVisible(cardId: CardId): boolean {
  if (cardId !== 'project-browser' && !isCardOpen(cardId)) {
    return false
  }

  if (cardMeta[cardId].requiresProjectSelected && !hasSelectedProject.value) {
    return false
  }

  return true
}

const leftVisibleViewIds = computed<SideViewId[]>(() =>
  leftViewOrder.value.filter((viewId) => isCardVisible(viewId)),
)

const rightVisibleViewIds = computed<SideViewId[]>(() =>
  rightViewOrder.value.filter((viewId) => isCardVisible(viewId)),
)

const centerPanel = computed<'canvas' | 'project-browser'>(() =>
  isCardVisible('canvas') ? 'canvas' : 'project-browser',
)

const mobileTabs = computed<Array<{ id: MobileWorkspaceTab; label: string }>>(() => {
  const tabs: Array<{ id: MobileWorkspaceTab; label: string }> = []
  if (isCardVisible('image-browser')) {
    tabs.push({ id: 'image-browser', label: cardTitle('image-browser') })
  }
  if (isCardVisible('canvas')) {
    tabs.push({ id: 'canvas', label: cardTitle('canvas') })
  }
  if (isCardVisible('current-tags')) {
    tabs.push({ id: 'current-tags', label: cardTitle('current-tags') })
  }
  if (isCardVisible('ai-proposed-tags')) {
    tabs.push({ id: 'ai-proposed-tags', label: cardTitle('ai-proposed-tags') })
  }
  if (isCardVisible('tags-library')) {
    tabs.push({ id: 'tags-library', label: cardTitle('tags-library') })
  }
  if (isCardVisible('project-details')) {
    tabs.push({ id: 'project-details', label: cardTitle('project-details') })
  }
  tabs.push({ id: 'project-browser', label: cardTitle('project-browser') })
  return tabs
})

const activeMobileTabTitle = computed(() => cardTitle(activeMobileTab.value))

const headerOpenViews = computed(() => ({
  imageBrowser: isCardOpen('image-browser'),
  canvas: isCardOpen('canvas'),
  currentTags: isCardOpen('current-tags'),
  aiProposedTags: isCardOpen('ai-proposed-tags'),
  tagsLibrary: isCardOpen('tags-library'),
  projectDetails: isCardOpen('project-details'),
}))

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

function sanitizeSideOrder(candidate: unknown, fallback: SideViewId[]): SideViewId[] {
  if (!Array.isArray(candidate)) {
    return [...fallback]
  }

  const valid = new Set<SideViewId>(fallback)
  const nextOrder: SideViewId[] = []

  for (const value of candidate) {
    if (typeof value !== 'string') {
      continue
    }
    if (!valid.has(value as SideViewId)) {
      continue
    }
    const asSideViewId = value as SideViewId
    if (nextOrder.includes(asSideViewId)) {
      continue
    }
    nextOrder.push(asSideViewId)
  }

  for (const fallbackId of fallback) {
    if (!nextOrder.includes(fallbackId)) {
      nextOrder.push(fallbackId)
    }
  }

  return nextOrder
}

function loadWorkspaceCardState() {
  if (typeof window === 'undefined') {
    return
  }

  const raw = window.localStorage.getItem(WORKSPACE_CARD_STATE_KEY)
  if (!raw) {
    return
  }

  try {
    const parsed = JSON.parse(raw) as {
      openState?: Partial<Record<ToggleCardId, boolean>>
      leftOrder?: SideViewId[]
      rightOrder?: SideViewId[]
      activeMobileTab?: MobileWorkspaceTab
    }

    if (parsed.openState) {
      for (const [key, value] of Object.entries(parsed.openState)) {
        if (typeof value !== 'boolean') {
          continue
        }
        if (!(key in cardOpenState.value)) {
          continue
        }
        cardOpenState.value[key as ToggleCardId] = value
      }
    }

    leftViewOrder.value = sanitizeSideOrder(parsed.leftOrder, leftViewOrder.value)
    rightViewOrder.value = sanitizeSideOrder(parsed.rightOrder, rightViewOrder.value)

    if (parsed.activeMobileTab && typeof parsed.activeMobileTab === 'string') {
      activeMobileTab.value = parsed.activeMobileTab
    }
  } catch {
    // Ignore malformed persisted state and continue with defaults.
  }
}

function saveWorkspaceCardState() {
  if (typeof window === 'undefined') {
    return
  }

  const payload = {
    openState: cardOpenState.value,
    leftOrder: leftViewOrder.value,
    rightOrder: rightViewOrder.value,
    activeMobileTab: activeMobileTab.value,
  }

  window.localStorage.setItem(WORKSPACE_CARD_STATE_KEY, JSON.stringify(payload))
}

function closeProjectPicker() {
  showProjectPicker.value = false
}

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

function isMobileViewport(): boolean {
  return isMobileViewportRef.value
}

function updateMobileViewportState() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    isMobileViewportRef.value = false
    return
  }

  isMobileViewportRef.value = window.matchMedia('(max-width: 1023px)').matches
}

function selectProject(projectId: string) {
  projectStore.selectProject(projectId)
}

function openCreateProjectModal() {
  showCreateProjectModal.value = true
}

function closeCreateProjectModal() {
  showCreateProjectModal.value = false
}

async function handleProjectCreated(projectId: string) {
  await projectStore.fetchProjects()
  projectStore.selectProject(projectId)
  closeCreateProjectModal()
}

async function discoverProjectsFromBrowser() {
  await projectStore.discoverAndRefresh()
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

function setViewOpen(
  view: ToggleCardId,
  isOpen: boolean,
) {
  cardOpenState.value[view] = isOpen

  if (view === 'canvas' && !isOpen) {
    projectStore.selectedProjectId = null
  }
}

function ensureSideViewPlacement(viewId: SideViewId) {
  if (leftViewOrder.value.includes(viewId) || rightViewOrder.value.includes(viewId)) {
    return
  }

  if (viewId === 'image-browser') {
    leftViewOrder.value.push(viewId)
    return
  }

  rightViewOrder.value.push(viewId)
}

function toggleView(
  view: ToggleCardId,
) {
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

function closeView(viewId: SideViewId) {
  setViewOpen(viewId, false)
}

function closeCenterPanel() {
  setViewOpen('canvas', false)
}

function onSidePanelDragStart(viewId: SideViewId, event: DragEvent) {
  if (!cardMeta[viewId].draggable) {
    return
  }

  draggedSideView.value = viewId
  if (!event.dataTransfer) {
    return
  }
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', viewId)
}

function removeFromColumns(viewId: SideViewId) {
  leftViewOrder.value = leftViewOrder.value.filter((candidate) => candidate !== viewId)
  rightViewOrder.value = rightViewOrder.value.filter((candidate) => candidate !== viewId)
}

function moveDraggedSideView(targetColumn: 'left' | 'right', targetIndex: number | null) {
  if (!draggedSideView.value) {
    return
  }

  const movedView = draggedSideView.value
  removeFromColumns(movedView)

  const destination = targetColumn === 'left' ? [...leftViewOrder.value] : [...rightViewOrder.value]
  const insertionIndex = targetIndex === null ? destination.length : Math.max(0, Math.min(targetIndex, destination.length))
  destination.splice(insertionIndex, 0, movedView)

  if (targetColumn === 'left') {
    leftViewOrder.value = destination
  } else {
    rightViewOrder.value = destination
  }

  draggedSideView.value = null
}

function allowSideDrop(event: DragEvent) {
  event.preventDefault()
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

function queryValue(key: string): string | null {
  const rawValue = route.query[key]
  return typeof rawValue === 'string' ? rawValue : null
}

watch(
  () => mobileTabs.value,
  (tabs) => {
    if (tabs.some((tab) => tab.id === activeMobileTab.value)) {
      return
    }
    activeMobileTab.value = tabs[0]?.id ?? 'project-browser'
  },
  { immediate: true },
)

watch(
  [cardOpenState, leftViewOrder, rightViewOrder, activeMobileTab],
  () => {
    saveWorkspaceCardState()
  },
  { deep: true },
)

watch(
  () => queryValue('panel'),
  (panel) => {
    if (panel === 'tags') {
      setViewOpen('tags-library', true)
      activeMobileTab.value = 'tags-library'
      return
    }

    if (panel === 'projects') {
      setViewOpen('project-details', true)
      activeMobileTab.value = 'project-details'
      return
    }

    if (panel === 'browser') {
      setViewOpen('image-browser', true)
      activeMobileTab.value = 'image-browser'
      return
    }

    setViewOpen('current-tags', true)
    setViewOpen('ai-proposed-tags', true)
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

onMounted(() => {
  loadWorkspaceCardState()
  updateMobileViewportState()
  window.addEventListener('resize', updateMobileViewportState)
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateMobileViewportState)
  }
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
          <div
            v-if="leftVisibleViewIds.length > 1"
            class="h-full min-h-0"
            @dragover="allowSideDrop"
            @drop="moveDraggedSideView('left', null)"
          >
            <SplitterGroup
              :auto-save-id="`workspace-left-column-vertical-${leftVisibleViewIds.length}`"
              class="h-full min-h-0 w-full"
              direction="vertical"
            >
              <template
                v-for="(viewId, index) in leftVisibleViewIds"
                :key="viewId"
              >
                <SplitterPanel
                  :default-size="sidePanelDefaultSize(index, leftVisibleViewIds.length)"
                  :min-size="16"
                  class="min-h-0"
                >
                  <div
                    class="h-full min-h-0"
                    @dragover="allowSideDrop"
                    @drop="moveDraggedSideView('left', index)"
                  >
                    <WorkspacePanelCard
                      :title="cardTitle(viewId)"
                      :closable="true"
                      :draggable="cardMeta[viewId].draggable"
                      @close="closeView(viewId)"
                      @dragstart="(event) => onSidePanelDragStart(viewId, event)"
                    >
                      <div v-if="viewId === 'image-browser'">
                        <ImageBrowserCard
                          :selected-project-id="projectStore.selectedProjectId"
                          @select-image="handleSelectImage"
                        />
                      </div>

                      <CurrentTagsCard
                        v-else-if="viewId === 'current-tags'"
                        :project-id="projectStore.selectedProjectId"
                        :selected-project="selectedProject"
                        :framed="false"
                      />

                      <AiProposedTagsCard
                        v-else-if="viewId === 'ai-proposed-tags'"
                        :project-id="projectStore.selectedProjectId"
                        :image-id="imageStore.currentImage?.id ?? null"
                        :mode="selectedProject?.tagging_mode ?? 'booru'"
                        :current-tags="imageStore.currentImage?.tags ?? []"
                        :get-tag-role-label="(tag) => !tag.is_protected ? null : tag.position === 0 ? 'Trigger' : tag.position === 1 ? 'Class' : 'Protected'"
                        :framed="false"
                      />

                      <TagsLibraryCard
                        v-else-if="viewId === 'tags-library'"
                        :show-close="false"
                      />

                      <ProjectDetailsCard
                        v-else
                        :selected-project="selectedProject"
                      />
                    </WorkspacePanelCard>
                  </div>
                </SplitterPanel>

                <SplitterResizeHandle
                  v-if="index < leftVisibleViewIds.length - 1"
                  class="mx-1 my-1 h-1.5 rounded bg-[var(--tf-color-surface-border)] transition data-[state=drag]:bg-[var(--tf-color-accent)]"
                />
              </template>
            </SplitterGroup>
          </div>

          <div
            v-else
            class="flex h-full min-h-0 flex-col"
            @dragover="allowSideDrop"
            @drop="moveDraggedSideView('left', null)"
          >
            <div
              v-for="(viewId, index) in leftVisibleViewIds"
              :key="viewId"
              class="h-full min-h-0"
              @dragover="allowSideDrop"
              @drop="moveDraggedSideView('left', index)"
            >
              <WorkspacePanelCard
                :title="cardTitle(viewId)"
                :closable="true"
                :draggable="cardMeta[viewId].draggable"
                @close="closeView(viewId)"
                @dragstart="(event) => onSidePanelDragStart(viewId, event)"
              >
                <div v-if="viewId === 'image-browser'">
                  <ImageBrowserCard
                    :selected-project-id="projectStore.selectedProjectId"
                    @select-image="handleSelectImage"
                  />
                </div>

                <CurrentTagsCard
                  v-else-if="viewId === 'current-tags'"
                  :project-id="projectStore.selectedProjectId"
                  :selected-project="selectedProject"
                  :framed="false"
                />

                <AiProposedTagsCard
                  v-else-if="viewId === 'ai-proposed-tags'"
                  :project-id="projectStore.selectedProjectId"
                  :image-id="imageStore.currentImage?.id ?? null"
                  :mode="selectedProject?.tagging_mode ?? 'booru'"
                  :current-tags="imageStore.currentImage?.tags ?? []"
                  :get-tag-role-label="(tag) => !tag.is_protected ? null : tag.position === 0 ? 'Trigger' : tag.position === 1 ? 'Class' : 'Protected'"
                  :framed="false"
                />

                <TagsLibraryCard
                  v-else-if="viewId === 'tags-library'"
                  :show-close="false"
                />

                <ProjectDetailsCard
                  v-else
                  :selected-project="selectedProject"
                />
              </WorkspacePanelCard>
            </div>
          </div>
        </template>

        <WorkspacePanelCard
          :title="cardTitle(centerPanel)"
          :closable="centerPanel === 'canvas'"
          :draggable="cardMeta[centerPanel].draggable"
          @close="closeCenterPanel"
        >
          <ImageCanvasCard
            v-if="centerPanel === 'canvas'"
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

          <ProjectBrowserCard
            v-else
            :projects="projectStore.projects"
            :selected-project-id="projectStore.selectedProjectId"
            :loading="projectStore.loading"
            :discovering="projectStore.loading"
            @select-project="selectProject"
            @open-create-project="openCreateProjectModal"
            @discover-projects="discoverProjectsFromBrowser"
            @show-tagging="handleShowTaggingFromProjectBrowser"
          />
        </WorkspacePanelCard>

        <template #right>
          <div
            v-if="rightVisibleViewIds.length > 1"
            class="h-full min-h-0"
            @dragover="allowSideDrop"
            @drop="moveDraggedSideView('right', null)"
          >
            <SplitterGroup
              :auto-save-id="`workspace-right-column-vertical-${rightVisibleViewIds.length}`"
              class="h-full min-h-0 w-full"
              direction="vertical"
            >
              <template
                v-for="(viewId, index) in rightVisibleViewIds"
                :key="viewId"
              >
                <SplitterPanel
                  :default-size="sidePanelDefaultSize(index, rightVisibleViewIds.length)"
                  :min-size="16"
                  class="min-h-0"
                >
                  <div
                    class="h-full min-h-0"
                    @dragover="allowSideDrop"
                    @drop="moveDraggedSideView('right', index)"
                  >
                    <WorkspacePanelCard
                      :title="cardTitle(viewId)"
                      :closable="true"
                      :draggable="cardMeta[viewId].draggable"
                      @close="closeView(viewId)"
                      @dragstart="(event) => onSidePanelDragStart(viewId, event)"
                    >
                      <CurrentTagsCard
                        v-if="viewId === 'current-tags'"
                        :project-id="projectStore.selectedProjectId"
                        :selected-project="selectedProject"
                        :framed="false"
                      />

                      <AiProposedTagsCard
                        v-else-if="viewId === 'ai-proposed-tags'"
                        :project-id="projectStore.selectedProjectId"
                        :image-id="imageStore.currentImage?.id ?? null"
                        :mode="selectedProject?.tagging_mode ?? 'booru'"
                        :current-tags="imageStore.currentImage?.tags ?? []"
                        :get-tag-role-label="(tag) => !tag.is_protected ? null : tag.position === 0 ? 'Trigger' : tag.position === 1 ? 'Class' : 'Protected'"
                        :framed="false"
                      />

                      <TagsLibraryCard
                        v-else-if="viewId === 'tags-library'"
                        :show-close="false"
                      />

                      <ProjectDetailsCard
                        v-else-if="viewId === 'project-details'"
                        :selected-project="selectedProject"
                      />

                      <div v-else>
                        <ImageBrowserCard
                          :selected-project-id="projectStore.selectedProjectId"
                          @select-image="handleSelectImage"
                        />
                      </div>
                    </WorkspacePanelCard>
                  </div>
                </SplitterPanel>

                <SplitterResizeHandle
                  v-if="index < rightVisibleViewIds.length - 1"
                  class="mx-1 my-1 h-1.5 rounded bg-[var(--tf-color-surface-border)] transition data-[state=drag]:bg-[var(--tf-color-accent)]"
                />
              </template>
            </SplitterGroup>
          </div>

          <div
            v-else
            class="flex h-full min-h-0 flex-col"
            @dragover="allowSideDrop"
            @drop="moveDraggedSideView('right', null)"
          >
            <div
              v-for="(viewId, index) in rightVisibleViewIds"
              :key="viewId"
              class="h-full min-h-0"
              @dragover="allowSideDrop"
              @drop="moveDraggedSideView('right', index)"
            >
              <WorkspacePanelCard
                :title="cardTitle(viewId)"
                :closable="true"
                :draggable="cardMeta[viewId].draggable"
                @close="closeView(viewId)"
                @dragstart="(event) => onSidePanelDragStart(viewId, event)"
              >
                <CurrentTagsCard
                  v-if="viewId === 'current-tags'"
                  :project-id="projectStore.selectedProjectId"
                  :selected-project="selectedProject"
                  :framed="false"
                />

                <AiProposedTagsCard
                  v-else-if="viewId === 'ai-proposed-tags'"
                  :project-id="projectStore.selectedProjectId"
                  :image-id="imageStore.currentImage?.id ?? null"
                  :mode="selectedProject?.tagging_mode ?? 'booru'"
                  :current-tags="imageStore.currentImage?.tags ?? []"
                  :get-tag-role-label="(tag) => !tag.is_protected ? null : tag.position === 0 ? 'Trigger' : tag.position === 1 ? 'Class' : 'Protected'"
                  :framed="false"
                />

                <TagsLibraryCard
                  v-else-if="viewId === 'tags-library'"
                  :show-close="false"
                />

                <ProjectDetailsCard
                  v-else-if="viewId === 'project-details'"
                  :selected-project="selectedProject"
                />

                <div v-else>
                  <ImageBrowserCard
                    :selected-project-id="projectStore.selectedProjectId"
                    @select-image="handleSelectImage"
                  />
                </div>
              </WorkspacePanelCard>
            </div>
          </div>
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
        <div
          v-if="activeMobileTab === 'image-browser'"
          v-memo="[imageBrowserMemoKey]"
        >
          <ImageBrowserCard
            :selected-project-id="projectStore.selectedProjectId"
            @select-image="handleSelectImage"
          />
        </div>

        <ImageCanvasCard
          v-else-if="activeMobileTab === 'canvas'"
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

        <CurrentTagsCard
          v-else-if="activeMobileTab === 'current-tags'"
          :project-id="projectStore.selectedProjectId"
          :selected-project="selectedProject"
          :framed="false"
        />

        <AiProposedTagsCard
          v-else-if="activeMobileTab === 'ai-proposed-tags'"
          :project-id="projectStore.selectedProjectId"
          :image-id="imageStore.currentImage?.id ?? null"
          :mode="selectedProject?.tagging_mode ?? 'booru'"
          :current-tags="imageStore.currentImage?.tags ?? []"
          :get-tag-role-label="(tag) => !tag.is_protected ? null : tag.position === 0 ? 'Trigger' : tag.position === 1 ? 'Class' : 'Protected'"
          :framed="false"
        />

        <TagsLibraryCard
          v-else-if="activeMobileTab === 'tags-library'"
          :show-close="false"
        />

        <ProjectDetailsCard
          v-else-if="activeMobileTab === 'project-details'"
          :selected-project="selectedProject"
        />

        <ProjectBrowserCard
          v-else
          :projects="projectStore.projects"
          :selected-project-id="projectStore.selectedProjectId"
          :loading="projectStore.loading"
          :discovering="projectStore.loading"
          @select-project="selectProject"
          @open-create-project="openCreateProjectModal"
          @discover-projects="discoverProjectsFromBrowser"
          @show-tagging="handleShowTaggingFromProjectBrowser"
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
