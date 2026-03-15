<script setup lang="ts">
import type { Project } from '../../api'
import AppHeader from './AppHeader.vue'
import WorkspaceHeaderOverlays from './WorkspaceHeaderOverlays.vue'

defineProps<{
  projectName?: string
  showProjectPicker: boolean
  showActionsMenu: boolean
  showTagsLibrary: boolean
  projects: Project[]
  selectedProjectId: string | null
  loading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  openProjectPicker: []
  openOverflow: []
  closeProjectPicker: []
  refreshProjects: []
  selectProject: [projectId: string]
  closeActionsMenu: []
  showTagsLibraryPanel: []
  showTagInspectorPanel: []
}>()
</script>

<template>
  <AppHeader
    :project-name="projectName"
    :project-picker-open="showProjectPicker"
    :overflow-open="showActionsMenu"
    @open-project-picker="emit('openProjectPicker')"
    @open-overflow="emit('openOverflow')"
  />

  <WorkspaceHeaderOverlays
    :show-project-picker="showProjectPicker"
    :show-actions-menu="showActionsMenu"
    :show-tags-library="showTagsLibrary"
    :projects="projects"
    :selected-project-id="selectedProjectId"
    :loading="loading"
    :error="error"
    @close-project-picker="emit('closeProjectPicker')"
    @refresh-projects="emit('refreshProjects')"
    @select-project="(projectId) => emit('selectProject', projectId)"
    @close-actions-menu="emit('closeActionsMenu')"
    @show-tags-library-panel="emit('showTagsLibraryPanel')"
    @show-tag-inspector-panel="emit('showTagInspectorPanel')"
  />
</template>