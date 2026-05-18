import { computed, ref, type Ref } from 'vue'
import type { WorkspaceColumnPanel } from './WorkspacePanelColumn.vue'
import type { CardMeta, CenterCardId, SideViewId, ToggleCardId } from './side-card-service'

type CardId = ToggleCardId | 'project-browser'
type SideColumnId = 'left' | 'right'
type SideDropIndicator = {
  column: SideColumnId
  panelIndex: number | null
  edge: 'top' | 'bottom'
}

type UseWorkspacePanelStateOptions = {
  cardMeta: Record<CardId, CardMeta>
  defaultToggleCardOpenState: Record<ToggleCardId, boolean>
  defaultLeftViewOrder: SideViewId[]
  defaultRightViewOrder: SideViewId[]
  selectedProjectId: Ref<string | null>
  onCanvasClosed: () => void
}

export function useWorkspacePanelState(options: UseWorkspacePanelStateOptions) {
  const {
    cardMeta,
    defaultToggleCardOpenState,
    defaultLeftViewOrder,
    defaultRightViewOrder,
    selectedProjectId,
    onCanvasClosed,
  } = options

  const cardOpenState = ref<Record<ToggleCardId, boolean>>({ ...defaultToggleCardOpenState })
  const leftViewOrder = ref<SideViewId[]>([...defaultLeftViewOrder])
  const rightViewOrder = ref<SideViewId[]>([...defaultRightViewOrder])
  const draggedSideView = ref<SideViewId | null>(null)
  const sideDropIndicator = ref<SideDropIndicator | null>(null)

  function cardTitle(cardId: CardId): string {
    return cardMeta[cardId].name
  }

  function isCardOpen(cardId: ToggleCardId): boolean {
    return cardOpenState.value[cardId]
  }

  function cardVisibility(cardId: CardId): boolean {
    return cardMeta[cardId].isVisible({
      isOpen: cardId === 'project-browser' ? true : isCardOpen(cardId),
      selectedProjectId: selectedProjectId.value,
    })
  }

  const leftVisibleViewIds = computed<SideViewId[]>(() =>
    leftViewOrder.value.filter((viewId) => cardVisibility(viewId)),
  )

  const rightVisibleViewIds = computed<SideViewId[]>(() =>
    rightViewOrder.value.filter((viewId) => cardVisibility(viewId)),
  )

  const centerPanelViewIds = computed<CenterCardId[]>(() => {
    const orderedCenterViewIds: CenterCardId[] = ['canvas', 'project-browser']
    return orderedCenterViewIds.filter((viewId) => cardVisibility(viewId))
  })

  const centerPanel = computed<CenterCardId>(() => centerPanelViewIds.value[0] ?? 'project-browser')

  const headerOpenViews = computed(() => ({
    imageBrowser: isCardOpen('image-browser'),
    canvas: isCardOpen('canvas'),
    currentTags: isCardOpen('current-tags'),
    aiProposedTags: isCardOpen('ai-proposed-tags'),
    tagsLibrary: isCardOpen('tags-library'),
    projectDetails: isCardOpen('project-details'),
  }))

  const leftColumnPanels = computed<WorkspaceColumnPanel[]>(() =>
    leftVisibleViewIds.value.map((viewId) => ({
      id: viewId,
      title: cardTitle(viewId),
      closable: true,
      draggable: cardMeta[viewId].draggable,
    })),
  )

  const rightColumnPanels = computed<WorkspaceColumnPanel[]>(() =>
    rightVisibleViewIds.value.map((viewId) => ({
      id: viewId,
      title: cardTitle(viewId),
      closable: true,
      draggable: cardMeta[viewId].draggable,
    })),
  )

  const centerColumnPanels = computed<WorkspaceColumnPanel[]>(() => {
    const panelId = centerPanel.value
    return [{
      id: panelId,
      title: cardTitle(panelId),
      closable: panelId === 'canvas',
      draggable: cardMeta[panelId].draggable,
    }]
  })

  function setViewOpen(view: ToggleCardId, isOpen: boolean) {
    cardOpenState.value[view] = isOpen

    if (view === 'canvas' && !isOpen) {
      onCanvasClosed()
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

    const hasDragData = Boolean(event.dataTransfer)
    if (!draggedSideView.value && !hasDragData) {
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

    const hasDragData = Boolean(event.dataTransfer)
    if (!draggedSideView.value && !hasDragData) {
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
    const insertionIndex = targetIndex === null
      ? destination.length
      : Math.max(0, Math.min(targetIndex, destination.length))
    destination.splice(insertionIndex, 0, movedView)

    if (targetColumn === 'left') {
      leftViewOrder.value = destination
    } else {
      rightViewOrder.value = destination
    }

    draggedSideView.value = null
    sideDropIndicator.value = null
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

  return {
    cardOpenState,
    leftViewOrder,
    rightViewOrder,
    draggedSideView,
    sideDropIndicator,
    cardTitle,
    isCardOpen,
    cardVisibility,
    leftVisibleViewIds,
    rightVisibleViewIds,
    centerPanelViewIds,
    centerPanel,
    headerOpenViews,
    leftColumnPanels,
    rightColumnPanels,
    centerColumnPanels,
    setViewOpen,
    closeView,
    closeCenterPanel,
    onSidePanelDragStart,
    onSidePanelDragEnd,
    handleSidePanelDragOver,
    handleSideColumnDragOver,
    handleSideDrop,
    ensureSideViewPlacement,
  }
}
