import { computed, onMounted, watch } from 'vue'
import type { useImageStore } from '../stores/images'
import type { useProjectStore } from '../stores/projects'

type UseWorkspaceImagesOptions = {
  projectStore: ReturnType<typeof useProjectStore>
  imageStore: ReturnType<typeof useImageStore>
}

export function useWorkspaceImages(options: UseWorkspaceImagesOptions) {
  const { projectStore, imageStore } = options

  const orderedImages = computed(() => imageStore.sortedImages)

  const currentImageIndex = computed(() => {
    const currentImageId = imageStore.currentImage?.id
    if (!currentImageId) {
      return -1
    }
    return orderedImages.value.findIndex((image) => image.id === currentImageId)
  })

  const previousAvailable = computed(() => currentImageIndex.value > 0)
  const nextAvailable = computed(
    () => currentImageIndex.value >= 0 && currentImageIndex.value < orderedImages.value.length - 1,
  )

  async function bootstrapWorkspaceImages(): Promise<void> {
    if (!projectStore.projects.length) {
      await projectStore.fetchProjects()
    }
  }

  async function selectImage(imageId: string): Promise<void> {
    if (!projectStore.selectedProjectId) {
      return
    }
    await imageStore.fetchImage(projectStore.selectedProjectId, imageId)
  }

  async function goToImageByIndex(index: number): Promise<void> {
    if (!projectStore.selectedProjectId) {
      return
    }
    const targetImage = orderedImages.value[index]
    if (!targetImage) {
      return
    }
    await imageStore.fetchImage(projectStore.selectedProjectId, targetImage.id)
  }

  async function goToPreviousImage(): Promise<void> {
    if (!previousAvailable.value) {
      return
    }
    await goToImageByIndex(currentImageIndex.value - 1)
  }

  async function goToNextImage(): Promise<void> {
    if (!nextAvailable.value) {
      return
    }
    await goToImageByIndex(currentImageIndex.value + 1)
  }

  async function deleteCurrentImage(): Promise<void> {
    const projectId = projectStore.selectedProjectId
    const currentImage = imageStore.currentImage
    if (!projectId || !currentImage) {
      return
    }

    const deletedIndex = currentImageIndex.value
    const deletedImageId = currentImage.id
    const deleted = await imageStore.deleteImage(projectId, deletedImageId)
    if (!deleted) {
      return
    }

    if (imageStore.sortedImages.length === 0) {
      imageStore.currentImage = null
      return
    }

    const boundedDeletedIndex = deletedIndex < 0 ? 0 : deletedIndex
    const nextIndex = Math.min(boundedDeletedIndex, imageStore.sortedImages.length - 1)
    const nextImage = imageStore.sortedImages[nextIndex]
    if (nextImage) {
      await imageStore.fetchImage(projectId, nextImage.id)
    }
  }

  watch(
    () => projectStore.selectedProjectId,
    async (projectId) => {
      if (!projectId) {
        imageStore.images = []
        imageStore.currentImage = null
        imageStore.imagesLoadedProjectId = null
        return
      }

      const imagesAlreadyLoaded = imageStore.imagesLoadedProjectId === projectId
      const imagesLoadingForProject = imageStore.imagesLoadingProjectId === projectId

      if (!imagesAlreadyLoaded && !imagesLoadingForProject) {
        await imageStore.fetchImages(projectId)
      }

      const currentImage = imageStore.currentImage
      if (!currentImage || currentImage.project_id !== projectId) {
        imageStore.currentImage = null
        return
      }

      const currentImageStillExists = imageStore.images.some((image) => image.id === currentImage.id)
      if (!currentImageStillExists) {
        imageStore.currentImage = null
      }
    },
    { immediate: true },
  )

  onMounted(async () => {
    await bootstrapWorkspaceImages()
  })

  return {
    orderedImages,
    currentImageIndex,
    previousAvailable,
    nextAvailable,
    selectImage,
    goToImageByIndex,
    goToPreviousImage,
    goToNextImage,
    deleteCurrentImage,
  }
}