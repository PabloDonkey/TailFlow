import { ref, type Ref } from 'vue'

export type MobileWorkspacePanel = 'browser' | 'inspector' | 'tags'

type UseWorkspaceOverlayStateOptions = {
  showTagsLibrary: Ref<boolean>
}

export function useWorkspaceOverlayState(options: UseWorkspaceOverlayStateOptions) {
  const { showTagsLibrary } = options

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
    showTagsLibrary.value = true
    closeActionsMenu()
  }

  function showTagInspectorPanel() {
    showTagsLibrary.value = false
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
  }
}