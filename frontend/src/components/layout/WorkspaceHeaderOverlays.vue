<script setup lang="ts">
import type { Project } from '../../api'
import WorkspaceActionsMenu from './WorkspaceActionsMenu.vue'
import WorkspaceProjectPickerPanel from '../sidebar/WorkspaceProjectPickerPanel.vue'

defineProps<{
  showProjectPicker: boolean
  showActionsMenu: boolean
  showTagsLibrary: boolean
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
    :show-tags-library="showTagsLibrary"
    @close="emit('closeActionsMenu')"
    @show-tags-library="emit('showTagsLibraryPanel')"
    @show-inspector="emit('showTagInspectorPanel')"
  />
</template>