import type { useProjectStore } from '../stores/projects'

type UseWorkspaceHeaderActionsOptions = {
  projectStore: ReturnType<typeof useProjectStore>
  closeProjectPicker: () => void
}

export function useWorkspaceHeaderActions(options: UseWorkspaceHeaderActionsOptions) {
  const { projectStore, closeProjectPicker } = options

  function refreshProjects() {
    void projectStore.fetchProjects()
  }

  function selectProjectFromPicker(projectId: string) {
    if (projectStore.selectedProjectId !== projectId) {
      projectStore.selectProject(projectId)
    }
    closeProjectPicker()
  }

  return {
    refreshProjects,
    selectProjectFromPicker,
  }
}