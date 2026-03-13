import type { Ref } from 'vue'
import type { ProjectTag } from '../../../api'
import type { useImageStore } from '../../../stores/images'

type UseTagMutationOptions = {
  imageStore: ReturnType<typeof useImageStore>;
  projectId: string | null;
  selectedProject: any;
  currentImage: Ref<any>;
  newTag: Ref<string>;
  errorMsg: Ref<string | null>;
}

export function useTagMutation(options: UseTagMutationOptions) {
  const { imageStore, projectId, selectedProject, currentImage, newTag, errorMsg } = options
  function shouldConfirmTagCreation(error: string | null): boolean {
    return error?.includes('Confirm creation before adding it as a shared tag.') ?? false
  }

  function getTagRoleLabel(tag: ProjectTag): string | null {
    if (!tag.is_protected) {
      return null
    }
    if (tag.position === 0) {
      return 'Trigger'
    }
    if (tag.position === 1) {
      return 'Class'
    }
    return 'Protected'
  }

  function getTagSourceLabel(tag: ProjectTag): string | null {
    const catalogSources = Object.keys(tag.catalog_ids)
    if (!catalogSources.length) {
      return null
    }
    if (
      selectedProject &&
      tag.catalog_ids[(selectedProject.tagging_mode as keyof typeof tag.catalog_ids)]
    ) {
      return selectedProject.tagging_mode
    }
    return catalogSources.join(', ')
  }

  async function addTag() {
    const tag = newTag.value.trim()
    if (!tag) return
    const imageId = currentImage.value?.id
    if (!imageId || !projectId) return

    errorMsg.value = null

    let updated = await imageStore.updateTags(projectId, imageId, [tag], [])
    if (!updated && shouldConfirmTagCreation(imageStore.error)) {
      const confirmed = window.confirm(
        `Create "${tag}" as a shared user-defined tag for this project?`,
      )
      if (confirmed) {
        updated = await imageStore.updateTags(projectId, imageId, [tag], [], true)
      }
    }

    if (!updated && imageStore.error) {
      errorMsg.value = imageStore.error
    } else {
      newTag.value = ''
    }
  }

  async function removeTag(tag: ProjectTag) {
    if (tag.is_protected) {
      return
    }
    const imageId = currentImage.value?.id
    if (!imageId || !projectId) return
    errorMsg.value = null
    const updated = await imageStore.updateTags(projectId, imageId, [], [tag.name])
    if (!updated && imageStore.error) {
      errorMsg.value = imageStore.error
    }
  }

  return {
    getTagRoleLabel,
    getTagSourceLabel,
    addTag,
    removeTag,
  }
}
