import { computed, type ComputedRef } from 'vue'
import type { Project } from '../../api'
import type { ProjectImageSummary } from '../../api'
import type { useImageStore } from '../../stores/images'
import type { useProjectStore } from '../../stores/projects'
import {
  buildWorkspaceCardConfig,
  type CenterCardId,
  type SideCardConfig,
  type SideViewId,
} from './side-card-service'

type UseWorkspaceCardRuntimeOptions = {
  projectStore: ReturnType<typeof useProjectStore>
  imageStore: ReturnType<typeof useImageStore>
  selectedProject: ComputedRef<Project | null>
  orderedImages: ComputedRef<ProjectImageSummary[]>
  currentImageIndex: ComputedRef<number>
  centerPanel: ComputedRef<CenterCardId>
  selectImage: (imageId: string) => Promise<void>
  addAiTag: (tagName: string) => Promise<void>
  removeAiTag: (tagName: string) => Promise<void>
  selectProject: (projectId: string) => void
  openCreateProject: () => void
  discoverProjects: () => Promise<void>
  showTaggingFromProjectBrowser: (projectId: string) => void
  previousImage: () => Promise<void>
  nextImage: () => Promise<void>
  jumpToImage: (index: number) => Promise<void>
  deleteCurrentImage: () => Promise<void>
  uploadImagesToCurrentProject: (files: File[]) => Promise<void>
  replaceCurrentImage: (file: File) => Promise<void>
}

export function useWorkspaceCardRuntime(options: UseWorkspaceCardRuntimeOptions) {
  const {
    projectStore,
    imageStore,
    selectedProject,
    orderedImages,
    currentImageIndex,
    centerPanel,
    selectImage,
    addAiTag,
    removeAiTag,
    selectProject,
    openCreateProject,
    discoverProjects,
    showTaggingFromProjectBrowser,
    previousImage,
    nextImage,
    jumpToImage,
    deleteCurrentImage,
    uploadImagesToCurrentProject,
    replaceCurrentImage,
  } = options

  function workspaceCardState(framed: boolean) {
    return {
      selectedProjectId: projectStore.selectedProjectId,
      selectedProject: selectedProject.value,
      currentImageId: imageStore.currentImage?.id ?? null,
      currentImageTags: imageStore.currentImage?.tags ?? [],
      framed,
      currentImage: imageStore.currentImage,
      orderedImages: orderedImages.value,
      currentImageIndex: currentImageIndex.value,
      loading: projectStore.loading || projectStore.uploading || imageStore.imageLoading,
      error: projectStore.error || imageStore.error,
      projects: projectStore.projects,
    }
  }

  function workspaceCardActions() {
    return {
      selectImage: (imageId: string) => {
        void selectImage(imageId)
      },
      addAiTag: (tagName: string) => {
        void addAiTag(tagName)
      },
      removeAiTag: (tagName: string) => {
        void removeAiTag(tagName)
      },
      selectProject,
      openCreateProject,
      discoverProjects: () => {
        void discoverProjects()
      },
      showTaggingFromProjectBrowser,
      previousImage: () => {
        void previousImage()
      },
      nextImage: () => {
        void nextImage()
      },
      jumpToImage: (index: number) => {
        void jumpToImage(index)
      },
      deleteCurrentImage: () => {
        void deleteCurrentImage()
      },
      uploadImagesToCurrentProject: (files: File[]) => {
        void uploadImagesToCurrentProject(files)
      },
      replaceCurrentImage: (file: File) => {
        void replaceCurrentImage(file)
      },
    }
  }

  function sideCardConfig(viewId: SideViewId, framed = false): SideCardConfig {
    return buildWorkspaceCardConfig(viewId, workspaceCardState(framed), workspaceCardActions())
  }

  function centerCardConfig(cardId: CenterCardId): SideCardConfig {
    return buildWorkspaceCardConfig(cardId, workspaceCardState(false), workspaceCardActions())
  }

  const centerPanelConfig = computed(() => centerCardConfig(centerPanel.value))
  const mobileCanvasConfig = computed(() => centerCardConfig('canvas'))
  const mobileProjectBrowserConfig = computed(() => centerCardConfig('project-browser'))

  return {
    sideCardConfig,
    centerPanelConfig,
    mobileCanvasConfig,
    mobileProjectBrowserConfig,
  }
}
