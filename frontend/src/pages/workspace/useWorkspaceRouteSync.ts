import { watch, type Ref } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import type { ToggleCardId } from './side-card-service'
import type { useImageStore } from '../../stores/images'
import type { useProjectStore } from '../../stores/projects'

type MobileWorkspaceStage = 'project-browser' | 'image-browser' | 'workspace'
type MobileWorkspaceBottomPanel = 'current-tags' | 'ai-proposed-tags' | 'project-details' | 'image-info'

type UseWorkspaceRouteSyncOptions = {
  route: RouteLocationNormalizedLoaded
  setViewOpen: (view: ToggleCardId, isOpen: boolean) => void
  mobileStage: Ref<MobileWorkspaceStage>
  activeMobileBottomPanel: Ref<MobileWorkspaceBottomPanel>
  projectStore: ReturnType<typeof useProjectStore>
  imageStore: ReturnType<typeof useImageStore>
  selectImage: (imageId: string) => Promise<void>
}

export function useWorkspaceRouteSync(options: UseWorkspaceRouteSyncOptions) {
  const {
    route,
    setViewOpen,
    mobileStage,
    activeMobileBottomPanel,
    projectStore,
    imageStore,
    selectImage,
  } = options

  function queryValue(key: string): string | null {
    const rawValue = route.query[key]
    return typeof rawValue === 'string' ? rawValue : null
  }

  watch(
    () => queryValue('panel'),
    (panel) => {
      if (panel === 'tags') {
        mobileStage.value = 'workspace'
        activeMobileBottomPanel.value = 'current-tags'
        return
      }

      if (panel === 'projects') {
        mobileStage.value = 'project-browser'
        return
      }

      if (panel === 'browser') {
        mobileStage.value = 'image-browser'
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

  return {
    queryValue,
  }
}
