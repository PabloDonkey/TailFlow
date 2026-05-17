import { watch, type Ref } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import type { MobileWorkspaceTab } from '../../components/layout/WorkspaceMobileViewsTabs.vue'
import type { ToggleCardId } from './side-card-service'
import type { useImageStore } from '../../stores/images'
import type { useProjectStore } from '../../stores/projects'

type UseWorkspaceRouteSyncOptions = {
  route: RouteLocationNormalizedLoaded
  setViewOpen: (view: ToggleCardId, isOpen: boolean) => void
  activeMobileTab: Ref<MobileWorkspaceTab>
  projectStore: ReturnType<typeof useProjectStore>
  imageStore: ReturnType<typeof useImageStore>
  selectImage: (imageId: string) => Promise<void>
}

export function useWorkspaceRouteSync(options: UseWorkspaceRouteSyncOptions) {
  const {
    route,
    setViewOpen,
    activeMobileTab,
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

  return {
    queryValue,
  }
}
