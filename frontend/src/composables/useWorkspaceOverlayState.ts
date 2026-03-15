import { ref, type Ref } from 'vue'

export type MobileWorkspacePanel = 'browser' | 'inspector' | 'tags' | 'projects'
export type WorkspaceRightPanel = 'inspector' | 'tags' | 'projects'

type UseWorkspaceOverlayStateOptions = {
  activeRightPanel: Ref<WorkspaceRightPanel>
}

export function useWorkspaceOverlayState(options: UseWorkspaceOverlayStateOptions) {
  const { activeRightPanel } = options

  const showMobilePanel = ref(false)
  const mobilePanel = ref<MobileWorkspacePanel>('browser')
  const showProjectPicker = ref(false)
  const showActionsMenu = ref(false)

  function openMobilePanel(panel: MobileWorkspacePanel) {
    mobilePanel.value = panel
    showMobilePanel.value = true
  }

  function closeMobilePanel() {
    showMobilePanel.value = false
  }

  function openProjectPicker() {
    showProjectPicker.value = !showProjectPicker.value
    showActionsMenu.value = false
  }

  function openOverflow() {
    showProjectPicker.value = false
    showActionsMenu.value = !showActionsMenu.value
  }

  function closeActionsMenu() {
    showActionsMenu.value = false
  }

  function closeProjectPicker() {
    showProjectPicker.value = false
  }

  function showTagsLibraryPanel() {
    activeRightPanel.value = 'tags'
    closeActionsMenu()
  }

  function showTagInspectorPanel() {
    activeRightPanel.value = 'inspector'
    closeActionsMenu()
  }

  function showProjectsPanel() {
    activeRightPanel.value = 'projects'
    closeActionsMenu()
  }

  return {
    showMobilePanel,
    mobilePanel,
    showProjectPicker,
    showActionsMenu,
    openMobilePanel,
    closeMobilePanel,
    openProjectPicker,
    openOverflow,
    closeActionsMenu,
    closeProjectPicker,
    showTagsLibraryPanel,
    showTagInspectorPanel,
    showProjectsPanel,
  }
}