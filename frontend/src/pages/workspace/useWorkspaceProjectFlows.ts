import { ref } from 'vue'
import type { useProjectStore } from '../../stores/projects'

type UseWorkspaceProjectFlowsOptions = {
  projectStore: ReturnType<typeof useProjectStore>
}

export function useWorkspaceProjectFlows(options: UseWorkspaceProjectFlowsOptions) {
  const { projectStore } = options

  const showCreateProjectModal = ref(false)

  function openCreateProjectModal() {
    showCreateProjectModal.value = true
  }

  function closeCreateProjectModal() {
    showCreateProjectModal.value = false
  }

  async function handleProjectCreated(projectId: string) {
    await projectStore.fetchProjects()
    projectStore.selectProject(projectId)
    closeCreateProjectModal()
  }

  async function discoverProjectsFromBrowser() {
    await projectStore.discoverAndRefresh()
  }

  return {
    showCreateProjectModal,
    openCreateProjectModal,
    closeCreateProjectModal,
    handleProjectCreated,
    discoverProjectsFromBrowser,
  }
}
