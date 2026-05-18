import { ref, watch, type Ref } from 'vue'
import type { MobileWorkspaceTab } from '../../components/layout/WorkspaceMobileViewsTabs.vue'
import type { SideViewId, ToggleCardId } from './side-card-service'
import type { useImageStore } from '../../stores/images'
import type { useProjectStore } from '../../stores/projects'

type UseWorkspacePersistenceOptions = {
  storageKey: string
  cardOpenState: Ref<Record<ToggleCardId, boolean>>
  leftViewOrder: Ref<SideViewId[]>
  rightViewOrder: Ref<SideViewId[]>
  activeMobileTab: Ref<MobileWorkspaceTab>
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
    activeMobileTab,
    defaultLeftViewOrder,
    defaultRightViewOrder,
    projectStore,
    imageStore,
    selectImage,
    queryValue,
  } = options

  const defaultSideViewOrder: SideViewId[] = [...defaultLeftViewOrder, ...defaultRightViewOrder]
  const validMobileTabs: MobileWorkspaceTab[] = [
    'image-browser',
    'canvas',
    'current-tags',
    'ai-proposed-tags',
    'tags-library',
    'project-details',
    'project-browser',
  ]
  const restoredProjectSelectionHandled = ref(false)
  const restoredImageSelectionHandled = ref(false)
  const restoredSelectionProjectId = ref<string | null>(null)
  const restoredSelectionImageId = ref<string | null>(null)

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

  function loadWorkspaceCardState() {
    if (typeof window === 'undefined') {
      return
    }

    const raw = window.localStorage.getItem(storageKey)
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

      if (
        parsed.activeMobileTab
        && typeof parsed.activeMobileTab === 'string'
        && validMobileTabs.includes(parsed.activeMobileTab)
      ) {
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

  loadWorkspaceCardState()

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

    window.localStorage.setItem(storageKey, JSON.stringify(payload))
  }

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

}
