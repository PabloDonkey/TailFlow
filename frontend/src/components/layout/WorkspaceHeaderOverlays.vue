<script setup lang="ts">
import type { Project } from '../../api'
import WorkspaceActionsMenu from './WorkspaceActionsMenu.vue'
import WorkspaceProjectPickerPanel from '../sidebar/WorkspaceProjectPickerPanel.vue'

defineProps<{
  showProjectPicker: boolean
  showActionsMenu: boolean
  activeRightPanel: 'inspector' | 'tags' | 'projects'
  projects: Project[]
  selectedProjectId: string | null
  loading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  closeProjectPicker: []
  refreshProjects: []
  selectProject: [projectId: string]
  closeActionsMenu: []
  showTagsLibraryPanel: []
  showTagInspectorPanel: []
  showProjectsPanel: []
}>()
</script>

<template>
  <WorkspaceProjectPickerPanel
    v-if="showProjectPicker"
    :projects="projects"
    :selected-project-id="selectedProjectId"
    :loading="loading"
    :error="error"
    @close="emit('closeProjectPicker')"
    @refresh="emit('refreshProjects')"
    @select-project="(projectId) => emit('selectProject', projectId)"
  />

  <WorkspaceActionsMenu
    v-if="showActionsMenu"
    :active-right-panel="activeRightPanel"
    @close="emit('closeActionsMenu')"
    @show-tags-library="emit('showTagsLibraryPanel')"
    @show-inspector="emit('showTagInspectorPanel')"
    @show-projects="emit('showProjectsPanel')"
  />
</template>