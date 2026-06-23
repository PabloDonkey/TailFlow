import { onMounted, onScopeDispose, ref, watch, type Ref } from 'vue'
import type { SideViewId, ToggleCardId } from './side-card-service'
import type { useImageStore } from '../../stores/images'
import type { useProjectStore } from '../../stores/projects'

type MobileWorkspaceStage = 'project-browser' | 'image-browser' | 'workspace'
type MobileWorkspaceBottomPanel = 'current-tags' | 'ai-proposed-tags' | 'project-details' | 'image-info'
type MobileCurrentTagsViewMode = 'tags-only' | 'filter-only' | 'search-only'
type MobileAiProposedTagsViewMode = 'essentials' | 'advanced'

type UseWorkspacePersistenceOptions = {
  storageKey: string
  cardOpenState: Ref<Record<ToggleCardId, boolean>>
  leftViewOrder: Ref<SideViewId[]>
  rightViewOrder: Ref<SideViewId[]>
  mobileStage: Ref<MobileWorkspaceStage>
  activeMobileBottomPanel: Ref<MobileWorkspaceBottomPanel>
  mobileCurrentTagsViewMode: Ref<MobileCurrentTagsViewMode>
  mobileAiProposedTagsViewMode: Ref<MobileAiProposedTagsViewMode>
  mobileWorkspaceSplitPercent: Ref<number>
  defaultLeftViewOrder: SideViewId[]
  defaultRightViewOrder: SideViewId[]
  projectStore: ReturnType<typeof useProjectStore>
  imageStore: ReturnType<typeof useImageStore>
  selectImage: (imageId: string) => Promise<void>
  queryValue: (key: string) => string | null
}

export function useWorkspacePersistence(options: UseWorkspacePersistenceOptions) {
  const {
    storageKey,
    cardOpenState,
    leftViewOrder,
    rightViewOrder,
    mobileStage,
    activeMobileBottomPanel,
    mobileCurrentTagsViewMode,
    mobileAiProposedTagsViewMode,
    mobileWorkspaceSplitPercent,
    defaultLeftViewOrder,
    defaultRightViewOrder,
    projectStore,
    imageStore,
    selectImage,
    queryValue,
  } = options

  const defaultSideViewOrder: SideViewId[] = [...defaultLeftViewOrder, ...defaultRightViewOrder]
  const validMobileBottomPanels: MobileWorkspaceBottomPanel[] = [
    'current-tags',
    'ai-proposed-tags',
    'project-details',
    'image-info',
  ]
  const validMobileStages: MobileWorkspaceStage[] = ['project-browser', 'image-browser', 'workspace']
  const validMobileCurrentTagsViewModes: MobileCurrentTagsViewMode[] = ['tags-only', 'filter-only', 'search-only']
  const validMobileAiProposedTagsViewModes: MobileAiProposedTagsViewMode[] = ['essentials', 'advanced']
  const isWorkspaceRestorePending = ref(true)

  function sanitizeSideOrder(candidate: unknown): SideViewId[] {
    if (!Array.isArray(candidate)) {
      return []
    }

    const valid = new Set<SideViewId>(defaultSideViewOrder)
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

    for (const defaultViewId of defaultSideViewOrder) {
      if (used.has(defaultViewId)) {
        continue
      }

      if (defaultLeftViewOrder.includes(defaultViewId)) {
        left.push(defaultViewId)
      } else {
        right.push(defaultViewId)
      }

      used.add(defaultViewId)
    }

    return { left, right }
  }

  function applyParsedWorkspaceCardState(raw: string) {
    try {
      const parsed = JSON.parse(raw) as {
        openState?: Partial<Record<ToggleCardId, boolean>>
        leftOrder?: SideViewId[]
        rightOrder?: SideViewId[]
        mobileStage?: MobileWorkspaceStage
        activeMobileBottomPanel?: MobileWorkspaceBottomPanel
        mobileCurrentTagsViewMode?: MobileCurrentTagsViewMode
        mobileAiProposedTagsViewMode?: MobileAiProposedTagsViewMode
        mobileWorkspaceSplitPercent?: number
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

      if (typeof parsed.mobileStage === 'string') {
        if (validMobileStages.includes(parsed.mobileStage)) {
          mobileStage.value = parsed.mobileStage
        }
      }

      if (typeof parsed.activeMobileBottomPanel === 'string') {
        if (validMobileBottomPanels.includes(parsed.activeMobileBottomPanel)) {
          activeMobileBottomPanel.value = parsed.activeMobileBottomPanel
        }
      }

      if (typeof parsed.mobileCurrentTagsViewMode === 'string') {
        if (validMobileCurrentTagsViewModes.includes(parsed.mobileCurrentTagsViewMode)) {
          mobileCurrentTagsViewMode.value = parsed.mobileCurrentTagsViewMode
        }
      }

      if (typeof parsed.mobileAiProposedTagsViewMode === 'string') {
        if (validMobileAiProposedTagsViewModes.includes(parsed.mobileAiProposedTagsViewMode)) {
          mobileAiProposedTagsViewMode.value = parsed.mobileAiProposedTagsViewMode
        }
      }

      if (typeof parsed.mobileWorkspaceSplitPercent === 'number') {
        mobileWorkspaceSplitPercent.value = Math.max(0, Math.min(100, parsed.mobileWorkspaceSplitPercent))
      }

      const parsedSelectedProjectId = typeof parsed.selectedProjectId === 'string' ? parsed.selectedProjectId : null
      const parsedSelectedImageId = typeof parsed.selectedImageId === 'string' ? parsed.selectedImageId : null

      return {
        selectedProjectId: parsedSelectedProjectId,
        selectedImageId: parsedSelectedImageId,
      }
    } catch {
      // Ignore malformed persisted state and continue with defaults.
    }
  }

  function loadWorkspaceCardState() {
    if (typeof window === 'undefined') {
      return null
    }

    const raw = window.localStorage.getItem(storageKey)
    if (!raw) {
      return null
    }

    return applyParsedWorkspaceCardState(raw)
  }

  function saveWorkspaceCardState() {
    if (typeof window === 'undefined') {
      return
    }

    const payload = {
      openState: cardOpenState.value,
      leftOrder: leftViewOrder.value,
      rightOrder: rightViewOrder.value,
      mobileStage: mobileStage.value,
      activeMobileBottomPanel: activeMobileBottomPanel.value,
      mobileCurrentTagsViewMode: mobileCurrentTagsViewMode.value,
      mobileAiProposedTagsViewMode: mobileAiProposedTagsViewMode.value,
      mobileWorkspaceSplitPercent: mobileWorkspaceSplitPercent.value,
      selectedProjectId: projectStore.selectedProjectId,
      selectedImageId: imageStore.currentImage?.id ?? null,
    }

    window.localStorage.setItem(storageKey, JSON.stringify(payload))
  }

  watch(
    [
      cardOpenState,
      leftViewOrder,
      rightViewOrder,
      mobileStage,
      activeMobileBottomPanel,
      mobileCurrentTagsViewMode,
      mobileAiProposedTagsViewMode,
      mobileWorkspaceSplitPercent,
    ],
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

  if (typeof window !== 'undefined') {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey || !event.newValue) {
        return
      }

      // Treat storage updates as an observable external state stream.
      applyParsedWorkspaceCardState(event.newValue)
    }

    window.addEventListener('storage', onStorage)
    onScopeDispose(() => {
      window.removeEventListener('storage', onStorage)
    })
  }

  onMounted(async () => {
    // 1. load persisted snapshot
    const snapshot = loadWorkspaceCardState()
    
    // 2. load projects and resolve selected project
    if (!projectStore.projects.length) {
      await projectStore.fetchProjects()
    }
    
    const queryProjectId = queryValue('project')
    let resolvedProjectId = queryProjectId || snapshot?.selectedProjectId

    if (resolvedProjectId) {
      const exists = projectStore.projects.some(p => p.id === resolvedProjectId)
      if (exists) {
        projectStore.selectProject(resolvedProjectId)
      } else {
        resolvedProjectId = null
      }
    }

    // 3. load images and resolve selected image
    if (resolvedProjectId) {
      await imageStore.fetchImages(resolvedProjectId)
      
      const queryImageId = queryValue('image')
      const targetImageId = queryImageId || snapshot?.selectedImageId
      
      if (targetImageId) {
        const imageExists = imageStore.images.some(i => i.id === targetImageId)
        if (imageExists) {
          await selectImage(targetImageId)
        }
      }
    }
    
    // 4. release restore gate once
    isWorkspaceRestorePending.value = false
  })

  return {
    isWorkspaceRestorePending,
  }
}
