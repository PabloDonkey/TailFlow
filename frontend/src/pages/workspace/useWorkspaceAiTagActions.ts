import type { useImageStore } from '../../stores/images'
import type { useProjectStore } from '../../stores/projects'

type UseWorkspaceAiTagActionsOptions = {
  projectStore: ReturnType<typeof useProjectStore>
  imageStore: ReturnType<typeof useImageStore>
}

export function useWorkspaceAiTagActions(options: UseWorkspaceAiTagActionsOptions) {
  const { projectStore, imageStore } = options

  function shouldConfirmSharedTagCreation(error: string | null): boolean {
    return error?.includes('Confirm creation before adding it as a shared tag.') ?? false
  }

  async function handleAiProposedTagAdd(tagName: string) {
    const projectId = projectStore.selectedProjectId
    const imageId = imageStore.currentImage?.id
    const tag = tagName.trim()

    if (!projectId || !imageId || !tag) {
      return
    }

    const added = await imageStore.updateTags(projectId, imageId, [tag], [])
    if (!added && shouldConfirmSharedTagCreation(imageStore.error)) {
      const confirmed = window.confirm(
        `Create "${tag}" as a shared user-defined tag for this project?`,
      )
      if (confirmed) {
        await imageStore.updateTags(projectId, imageId, [tag], [], true)
      }
    }
  }

  async function handleAiProposedTagRemove(tagName: string) {
    const projectId = projectStore.selectedProjectId
    const imageId = imageStore.currentImage?.id
    const tag = tagName.trim()

    if (!projectId || !imageId || !tag) {
      return
    }

    await imageStore.updateTags(projectId, imageId, [], [tag])
  }

  return {
    handleAiProposedTagAdd,
    handleAiProposedTagRemove,
  }
}
