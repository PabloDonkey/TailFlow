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
type SideColumnId = 'left' | 'right'
type SideDropIndicator = {
  column: SideColumnId
  panelIndex: number | null
  edge: 'top' | 'bottom'
}
const DEFAULT_LEFT_VIEW_ORDER: SideViewId[] = ['image-browser']
const DEFAULT_RIGHT_VIEW_ORDER: SideViewId[] = ['current-tags', 'ai-proposed-tags', 'tags-library', 'project-details']
const DEFAULT_SIDE_VIEW_ORDER: SideViewId[] = [...DEFAULT_LEFT_VIEW_ORDER, ...DEFAULT_RIGHT_VIEW_ORDER]

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

const leftViewOrder = ref<SideViewId[]>([...DEFAULT_LEFT_VIEW_ORDER])
const rightViewOrder = ref<SideViewId[]>([...DEFAULT_RIGHT_VIEW_ORDER])
const draggedSideView = ref<SideViewId | null>(null)
const sideDropIndicator = ref<SideDropIndicator | null>(null)
const activeMobileTab = ref<MobileWorkspaceTab>('image-browser')
const hasSelectedProject = computed(() => Boolean(projectStore.selectedProjectId))
const WORKSPACE_CARD_STATE_KEY = 'tailflow.workspace-card-state.v1'
const restoredProjectSelectionHandled = ref(false)
const restoredImageSelectionHandled = ref(false)
const restoredSelectionProjectId = ref<string | null>(null)
const restoredSelectionImageId = ref<string | null>(null)

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

function sanitizeSideOrder(candidate: unknown): SideViewId[] {
  if (!Array.isArray(candidate)) {
    return []
  }

  const valid = new Set<SideViewId>(DEFAULT_SIDE_VIEW_ORDER)
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

  return nextOrder
}

function normalizeSideOrders(candidateLeft: unknown, candidateRight: unknown): {
  left: SideViewId[]
  right: SideViewId[]
} {
  const left = sanitizeSideOrder(candidateLeft)
  const used = new Set<SideViewId>(left)

  const right = sanitizeSideOrder(candidateRight).filter((viewId) => {
    if (used.has(viewId)) {
      return false
    }
    used.add(viewId)
    return true
  })

  for (const defaultViewId of DEFAULT_SIDE_VIEW_ORDER) {
    if (used.has(defaultViewId)) {
      continue
    }

    if (DEFAULT_LEFT_VIEW_ORDER.includes(defaultViewId)) {
      left.push(defaultViewId)
    } else {
      right.push(defaultViewId)
    }

    used.add(defaultViewId)
  }

  return { left, right }
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
      selectedProjectId?: string | null
      selectedImageId?: string | null
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

    const normalized = normalizeSideOrders(parsed.leftOrder, parsed.rightOrder)
    leftViewOrder.value = normalized.left
    rightViewOrder.value = normalized.right

    if (parsed.activeMobileTab && typeof parsed.activeMobileTab === 'string') {
      activeMobileTab.value = parsed.activeMobileTab
    }

    restoredSelectionProjectId.value =
      typeof parsed.selectedProjectId === 'string' ? parsed.selectedProjectId : null
    restoredSelectionImageId.value =
      typeof parsed.selectedImageId === 'string' ? parsed.selectedImageId : null
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
    selectedProjectId: projectStore.selectedProjectId,
    selectedImageId: imageStore.currentImage?.id ?? null,
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

function shouldConfirmSharedTagCreation(error: string | null): boolean {
  return error?.includes('Confirm creation before adding it as a shared tag.') ?? false
}

async function handleAiProposedTagAdd(tagName: string) {
  const projectId = projectStore.selectedProjectId
  const imageId = imageStore.currentImage?.id
  const tag = tagName.trim()

  if (!projectId || !imageId || !tag) {
    return
  }

  const added = await imageStore.updateTags(projectId, imageId, [tag], [])
  if (!added && shouldConfirmSharedTagCreation(imageStore.error)) {
    const confirmed = window.confirm(
      `Create "${tag}" as a shared user-defined tag for this project?`,
    )
    if (confirmed) {
      await imageStore.updateTags(projectId, imageId, [tag], [], true)
    }
  }
}

async function handleAiProposedTagRemove(tagName: string) {
  const projectId = projectStore.selectedProjectId
  const imageId = imageStore.currentImage?.id
  const tag = tagName.trim()

  if (!projectId || !imageId || !tag) {
    return
  }

  await imageStore.updateTags(projectId, imageId, [], [tag])
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
  sideDropIndicator.value = null
  if (!event.dataTransfer) {
    return
  }
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', viewId)
}

function onSidePanelDragEnd() {
  draggedSideView.value = null
  sideDropIndicator.value = null
}

function handleSidePanelDragOver(
  column: SideColumnId,
  panelIndex: number,
  event: DragEvent,
) {
  event.preventDefault()

  if (!draggedSideView.value) {
    sideDropIndicator.value = null
    return
  }

  const targetElement = event.currentTarget as HTMLElement | null
  if (!targetElement) {
    sideDropIndicator.value = null
    return
  }

  const rect = targetElement.getBoundingClientRect()
  const edgeThreshold = Math.min(28, rect.height * 0.25)

  if (event.clientY <= rect.top + edgeThreshold) {
    sideDropIndicator.value = { column, panelIndex, edge: 'top' }
    return
  }

  if (event.clientY >= rect.bottom - edgeThreshold) {
    sideDropIndicator.value = { column, panelIndex, edge: 'bottom' }
    return
  }

  sideDropIndicator.value = null
}

function handleSideColumnDragOver(
  column: SideColumnId,
  totalPanels: number,
  event: DragEvent,
) {
  event.preventDefault()

  if (!draggedSideView.value) {
    sideDropIndicator.value = null
    return
  }

  if (totalPanels <= 0) {
    sideDropIndicator.value = null
    return
  }

  const targetElement = event.currentTarget as HTMLElement | null
  if (!targetElement) {
    return
  }

  const rect = targetElement.getBoundingClientRect()
  const bottomThreshold = Math.min(56, rect.height * 0.2)
  const isNearBottomEdge = event.clientY >= rect.bottom - bottomThreshold

  if (!isNearBottomEdge) {
    return
  }

  sideDropIndicator.value = { column, panelIndex: totalPanels - 1, edge: 'bottom' }
}

function showSideDropIndicator(column: SideColumnId, panelIndex: number, edge: 'top' | 'bottom'): boolean {
  const indicator = sideDropIndicator.value
  return Boolean(
    draggedSideView.value
    && indicator
    && indicator.column === column
    && indicator.panelIndex === panelIndex
    && indicator.edge === edge,
  )
}

function resolveDropInsertionIndex(
  column: SideColumnId,
  totalPanels: number,
  fallbackIndex: number | null,
): number | null {
  if (!sideDropIndicator.value || sideDropIndicator.value.column !== column) {
    return fallbackIndex
  }

  const { panelIndex, edge } = sideDropIndicator.value
  if (panelIndex === null) {
    return fallbackIndex
  }

  if (edge === 'top') {
    return panelIndex
  }

  return Math.min(panelIndex + 1, totalPanels)
}

function handleSideDrop(
  column: SideColumnId,
  totalPanels: number,
  event: DragEvent,
  fallbackIndex: number | null,
) {
  event.preventDefault()
  const insertionIndex = resolveDropInsertionIndex(column, totalPanels, fallbackIndex)
  moveDraggedSideView(column, insertionIndex)
  sideDropIndicator.value = null
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
  sideDropIndicator.value = null
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
  [
    () => projectStore.selectedProjectId,
    () => imageStore.currentImage?.id ?? null,
  ],
  () => {
    saveWorkspaceCardState()
  },
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

watch(
  () => [projectStore.projects.length, queryValue('project')] as const,
  ([, projectFromQuery]) => {
    if (restoredProjectSelectionHandled.value) {
      return
    }

    if (projectFromQuery) {
      restoredProjectSelectionHandled.value = true
      return
    }

    const restoredProjectId = restoredSelectionProjectId.value
    if (!restoredProjectId) {
      restoredProjectSelectionHandled.value = true
      return
    }

    const projectExists = projectStore.projects.some((project) => project.id === restoredProjectId)
    if (!projectExists) {
      restoredProjectSelectionHandled.value = true
      return
    }

    if (projectStore.selectedProjectId !== restoredProjectId) {
      projectStore.selectProject(restoredProjectId)
    }

    restoredProjectSelectionHandled.value = true
  },
  { immediate: true },
)

watch(
  () => [
    queryValue('image'),
    projectStore.selectedProjectId,
    imageStore.imagesLoading,
    imageStore.images.length,
  ] as const,
  async ([imageFromQuery, selectedProjectId, imagesLoading]) => {
    if (restoredImageSelectionHandled.value) {
      return
    }

    if (imageFromQuery) {
      restoredImageSelectionHandled.value = true
      return
    }

    const restoredImageId = restoredSelectionImageId.value
    if (!restoredImageId) {
      restoredImageSelectionHandled.value = true
      return
    }

    if (!selectedProjectId || imagesLoading) {
      return
    }

    const restoredProjectId = restoredSelectionProjectId.value
    if (restoredProjectId && restoredProjectId !== selectedProjectId) {
      restoredImageSelectionHandled.value = true
      return
    }

    const imageExists = imageStore.images.some((image) => image.id === restoredImageId)
    if (imageExists && imageStore.currentImage?.id !== restoredImageId) {
      await selectImage(restoredImageId)
    }

    restoredImageSelectionHandled.value = true
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
            class="relative h-full min-h-0 overflow-hidden"
            @dragover="(event) => handleSideColumnDragOver('left', leftVisibleViewIds.length, event)"
            @drop="(event) => handleSideDrop('left', leftVisibleViewIds.length, event, null)"
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
                    class="relative flex h-full min-h-0 flex-col overflow-hidden"
                    @dragover="(event) => handleSidePanelDragOver('left', index, event)"
                    @drop="(event) => handleSideDrop('left', leftVisibleViewIds.length, event, index)"
                  >
                    <div
                      v-if="showSideDropIndicator('left', index, 'top')"
                      data-testid="side-drop-indicator"
                      data-column="left"
                      data-edge="top"
                      class="mx-2 my-1 h-10 shrink-0 rounded-[8px] border-2 border-dashed border-[var(--tf-color-accent)] bg-[color-mix(in_srgb,var(--tf-color-accent)_12%,transparent)]"
                    />

                    <div class="min-h-0 flex-1">
                      <WorkspacePanelCard
                        :title="cardTitle(viewId)"
                        :closable="true"
                        :draggable="cardMeta[viewId].draggable"
                        @close="closeView(viewId)"
                        @dragstart="(event) => onSidePanelDragStart(viewId, event)"
                        @dragend="onSidePanelDragEnd"
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
                          @add="handleAiProposedTagAdd"
                          @remove="handleAiProposedTagRemove"
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

                    <div
                      v-if="showSideDropIndicator('left', index, 'bottom')"
                      data-testid="side-drop-indicator"
                      data-column="left"
                      data-edge="bottom"
                      class="mx-2 my-1 h-10 shrink-0 rounded-[8px] border-2 border-dashed border-[var(--tf-color-accent)] bg-[color-mix(in_srgb,var(--tf-color-accent)_12%,transparent)]"
                    />
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
            class="relative flex h-full min-h-0 flex-col overflow-hidden"
            @dragover="(event) => handleSideColumnDragOver('left', leftVisibleViewIds.length, event)"
            @drop="(event) => handleSideDrop('left', leftVisibleViewIds.length, event, null)"
          >
            <div
              v-for="(viewId, index) in leftVisibleViewIds"
              :key="viewId"
              class="relative flex h-full min-h-0 flex-col overflow-hidden"
              @dragover="(event) => handleSidePanelDragOver('left', index, event)"
              @drop="(event) => handleSideDrop('left', leftVisibleViewIds.length, event, index)"
            >
              <div
                v-if="showSideDropIndicator('left', index, 'top')"
                data-testid="side-drop-indicator"
                data-column="left"
                data-edge="top"
                class="mx-2 my-1 h-10 shrink-0 rounded-[8px] border-2 border-dashed border-[var(--tf-color-accent)] bg-[color-mix(in_srgb,var(--tf-color-accent)_12%,transparent)]"
              />

              <div class="min-h-0 flex-1">
                <WorkspacePanelCard
                  :title="cardTitle(viewId)"
                  :closable="true"
                  :draggable="cardMeta[viewId].draggable"
                  @close="closeView(viewId)"
                  @dragstart="(event) => onSidePanelDragStart(viewId, event)"
                  @dragend="onSidePanelDragEnd"
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
                    @add="handleAiProposedTagAdd"
                    @remove="handleAiProposedTagRemove"
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

              <div
                v-if="showSideDropIndicator('left', index, 'bottom')"
                data-testid="side-drop-indicator"
                data-column="left"
                data-edge="bottom"
                class="mx-2 my-1 h-10 shrink-0 rounded-[8px] border-2 border-dashed border-[var(--tf-color-accent)] bg-[color-mix(in_srgb,var(--tf-color-accent)_12%,transparent)]"
              />
            </div>

          </div>
        </template>

        <WorkspacePanelCard
          :title="cardTitle(centerPanel)"
          :closable="centerPanel === 'canvas'"
          :draggable="cardMeta[centerPanel].draggable"
          @close="closeCenterPanel"
        >
          <template v-if="centerPanel === 'project-browser'" #actions>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="rounded-[8px] border border-[var(--tf-color-surface-border)] bg-transparent px-2 py-1 text-xs font-medium text-[var(--tf-color-text-default)] disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="projectStore.loading"
                @click="discoverProjectsFromBrowser"
              >
                {{ projectStore.loading ? 'Refreshing…' : 'Discover' }}
              </button>
              <button
                type="button"
                class="rounded-[8px] border border-[var(--tf-color-surface-border)] bg-transparent px-2 py-1 text-xs font-medium text-[var(--tf-color-text-default)] disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="projectStore.loading"
                @click="openCreateProjectModal"
              >
                Create Project
              </button>
            </div>
          </template>

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
            :show-actions="false"
            @select-project="selectProject"
            @open-create-project="openCreateProjectModal"
            @discover-projects="discoverProjectsFromBrowser"
            @show-tagging="handleShowTaggingFromProjectBrowser"
          />
        </WorkspacePanelCard>

        <template #right>
          <div
            v-if="rightVisibleViewIds.length > 1"
            class="relative h-full min-h-0 overflow-hidden"
            @dragover="(event) => handleSideColumnDragOver('right', rightVisibleViewIds.length, event)"
            @drop="(event) => handleSideDrop('right', rightVisibleViewIds.length, event, null)"
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
                    class="relative flex h-full min-h-0 flex-col overflow-hidden"
                    @dragover="(event) => handleSidePanelDragOver('right', index, event)"
                    @drop="(event) => handleSideDrop('right', rightVisibleViewIds.length, event, index)"
                  >
                    <div
                      v-if="showSideDropIndicator('right', index, 'top')"
                      data-testid="side-drop-indicator"
                      data-column="right"
                      data-edge="top"
                      class="mx-2 my-1 h-10 shrink-0 rounded-[8px] border-2 border-dashed border-[var(--tf-color-accent)] bg-[color-mix(in_srgb,var(--tf-color-accent)_12%,transparent)]"
                    />

                    <div class="min-h-0 flex-1">
                      <WorkspacePanelCard
                        :title="cardTitle(viewId)"
                        :closable="true"
                        :draggable="cardMeta[viewId].draggable"
                        @close="closeView(viewId)"
                        @dragstart="(event) => onSidePanelDragStart(viewId, event)"
                        @dragend="onSidePanelDragEnd"
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
                          @add="handleAiProposedTagAdd"
                          @remove="handleAiProposedTagRemove"
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

                    <div
                      v-if="showSideDropIndicator('right', index, 'bottom')"
                      data-testid="side-drop-indicator"
                      data-column="right"
                      data-edge="bottom"
                      class="mx-2 my-1 h-10 shrink-0 rounded-[8px] border-2 border-dashed border-[var(--tf-color-accent)] bg-[color-mix(in_srgb,var(--tf-color-accent)_12%,transparent)]"
                    />
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
            class="relative flex h-full min-h-0 flex-col overflow-hidden"
            @dragover="(event) => handleSideColumnDragOver('right', rightVisibleViewIds.length, event)"
            @drop="(event) => handleSideDrop('right', rightVisibleViewIds.length, event, null)"
          >
            <div
              v-for="(viewId, index) in rightVisibleViewIds"
              :key="viewId"
              class="relative flex h-full min-h-0 flex-col overflow-hidden"
              @dragover="(event) => handleSidePanelDragOver('right', index, event)"
              @drop="(event) => handleSideDrop('right', rightVisibleViewIds.length, event, index)"
            >
              <div
                v-if="showSideDropIndicator('right', index, 'top')"
                data-testid="side-drop-indicator"
                data-column="right"
                data-edge="top"
                class="mx-2 my-1 h-10 shrink-0 rounded-[8px] border-2 border-dashed border-[var(--tf-color-accent)] bg-[color-mix(in_srgb,var(--tf-color-accent)_12%,transparent)]"
              />

              <div class="min-h-0 flex-1">
                <WorkspacePanelCard
                  :title="cardTitle(viewId)"
                  :closable="true"
                  :draggable="cardMeta[viewId].draggable"
                  @close="closeView(viewId)"
                  @dragstart="(event) => onSidePanelDragStart(viewId, event)"
                  @dragend="onSidePanelDragEnd"
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
                    @add="handleAiProposedTagAdd"
                    @remove="handleAiProposedTagRemove"
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

              <div
                v-if="showSideDropIndicator('right', index, 'bottom')"
                data-testid="side-drop-indicator"
                data-column="right"
                data-edge="bottom"
                class="mx-2 my-1 h-10 shrink-0 rounded-[8px] border-2 border-dashed border-[var(--tf-color-accent)] bg-[color-mix(in_srgb,var(--tf-color-accent)_12%,transparent)]"
              />
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
        <template v-if="activeMobileTab === 'project-browser'" #actions>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-[8px] border border-[var(--tf-color-surface-border)] bg-transparent px-2 py-1 text-xs font-medium text-[var(--tf-color-text-default)] disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="projectStore.loading"
              @click="discoverProjectsFromBrowser"
            >
              {{ projectStore.loading ? 'Refreshing…' : 'Discover' }}
            </button>
            <button
              type="button"
              class="rounded-[8px] border border-[var(--tf-color-surface-border)] bg-transparent px-2 py-1 text-xs font-medium text-[var(--tf-color-text-default)] disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="projectStore.loading"
              @click="openCreateProjectModal"
            >
              Create Project
            </button>
          </div>
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
          @add="handleAiProposedTagAdd"
          @remove="handleAiProposedTagRemove"
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
          :show-actions="false"
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
