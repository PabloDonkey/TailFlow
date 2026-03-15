import { computed, ref, type Ref } from 'vue'
import type { ProjectTag, ProjectImageRead } from '../api'
import type { useImageStore } from '../stores/images'

type UseTagMutationsOptions = {
  imageStore: ReturnType<typeof useImageStore>
  projectId: Ref<string | null>
  currentImage: Ref<ProjectImageRead | null>
}

function shouldConfirmTagCreation(error: string | null): boolean {
  return error?.includes('Confirm creation before adding it as a shared tag.') ?? false
}

export function useTagMutations(options: UseTagMutationsOptions) {
  const { imageStore, projectId, currentImage } = options

  const mutationError = ref<string | null>(null)
  const mutationLoading = computed(() => imageStore.loading)

  function clearMutationError() {
    mutationError.value = null
  }

  async function addTag(tagName: string): Promise<boolean> {
    const tag = tagName.trim()
    const imageId = currentImage.value?.id
    if (!tag || !imageId || !projectId.value) {
      return false
    }

    clearMutationError()

    let updated = await imageStore.updateTags(projectId.value, imageId, [tag], [])
    if (!updated && shouldConfirmTagCreation(imageStore.error)) {
      const confirmed = window.confirm(
        `Create "${tag}" as a shared user-defined tag for this project?`,
      )
      if (confirmed) {
        updated = await imageStore.updateTags(projectId.value, imageId, [tag], [], true)
      }
    }

    if (!updated && imageStore.error) {
      mutationError.value = imageStore.error
      return false
    }

    return true
  }

  async function removeTag(tag: ProjectTag): Promise<boolean> {
    if (tag.is_protected) {
      return false
    }

    const imageId = currentImage.value?.id
    if (!imageId || !projectId.value) {
      return false
    }

    clearMutationError()

    const updated = await imageStore.updateTags(projectId.value, imageId, [], [tag.name])
    if (!updated && imageStore.error) {
      mutationError.value = imageStore.error
      return false
    }

    return true
  }

  async function updateTag(tag: ProjectTag, nextName: string): Promise<boolean> {
    if (tag.is_protected) {
      return false
    }

    const nextTagName = nextName.trim()
    if (!nextTagName || nextTagName === tag.name) {
      return false
    }

    const imageId = currentImage.value?.id
    if (!imageId || !projectId.value) {
      return false
    }

    clearMutationError()

    let updated = await imageStore.updateTags(
      projectId.value,
      imageId,
      [nextTagName],
      [tag.name],
    )

    if (!updated && shouldConfirmTagCreation(imageStore.error)) {
      const confirmed = window.confirm(
        `Create "${nextTagName}" as a shared user-defined tag for this project?`,
      )
      if (confirmed) {
        updated = await imageStore.updateTags(
          projectId.value,
          imageId,
          [nextTagName],
          [tag.name],
          true,
        )
      }
    }

    if (!updated && imageStore.error) {
      mutationError.value = imageStore.error
      return false
    }

    return true
  }

  return {
    mutationError,
    mutationLoading,
    clearMutationError,
    addTag,
    removeTag,
    updateTag,
  }
}