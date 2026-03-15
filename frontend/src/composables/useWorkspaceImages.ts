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

  async function loadFirstImageForSelectedProject(): Promise<void> {
    if (!projectStore.selectedProjectId) {
      return
    }

    await imageStore.fetchImages(projectStore.selectedProjectId)
    const firstImage = imageStore.sortedImages[0]
    if (firstImage) {
      await imageStore.fetchImage(projectStore.selectedProjectId, firstImage.id)
    }
  }

  async function bootstrapWorkspaceImages(): Promise<void> {
    if (!projectStore.projects.length) {
      await projectStore.fetchProjects()
    }

    await loadFirstImageForSelectedProject()
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

  watch(
    () => projectStore.selectedProjectId,
    async (projectId) => {
      if (!projectId) {
        imageStore.images = []
        imageStore.currentImage = null
        return
      }

      await imageStore.fetchImages(projectId)
      const firstImage = imageStore.sortedImages[0]
      if (firstImage) {
        await imageStore.fetchImage(projectId, firstImage.id)
      } else {
        imageStore.currentImage = null
      }
    },
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
  }
}