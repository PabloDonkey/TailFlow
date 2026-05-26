<script setup lang="ts">
import type { Project } from '../../api'
import AppHeader from '../layout/AppHeader.vue'
import HeaderOverlays from './HeaderOverlays.vue'

defineProps<{
  projectName?: string
  showProjectPicker: boolean
  showActionsMenu: boolean
  openViews: {
    imageBrowser: boolean
    canvas: boolean
    currentTags: boolean
    aiProposedTags: boolean
    tagsLibrary: boolean
    projectDetails: boolean
  }
  projects: Project[]
  selectedProjectId: string | null
  loading: boolean
  workspaceLoading?: boolean
  error: string | null
}>()

const emit = defineEmits<{
  openProjectPicker: []
  openOverflow: []
  closeProjectPicker: []
  refreshProjects: []
  selectProject: [projectId: string]
  closeActionsMenu: []
  toggleView: [
    view: 'image-browser' | 'canvas' | 'current-tags' | 'ai-proposed-tags' | 'tags-library' | 'project-details',
  ]
}>()
</script>

<template>
  <AppHeader
    :project-name="projectName"
    :projects="projects"
    :selected-project-id="selectedProjectId"
    :open-views="openViews"
    :loading="loading"
    :workspace-loading="workspaceLoading"
    :project-picker-open="showProjectPicker"
    :overflow-open="showActionsMenu"
    @open-project-picker="emit('openProjectPicker')"
    @open-overflow="emit('openOverflow')"
    @refresh-projects="emit('refreshProjects')"
    @select-project="(projectId) => emit('selectProject', projectId)"
    @toggle-view="(view) => emit('toggleView', view)"
  />

  <HeaderOverlays
    :show-project-picker="showProjectPicker"
    :show-actions-menu="showActionsMenu"
    :open-views="openViews"
    :projects="projects"
    :selected-project-id="selectedProjectId"
    :loading="loading"
    :error="error"
    @close-project-picker="emit('closeProjectPicker')"
    @refresh-projects="emit('refreshProjects')"
    @select-project="(projectId) => emit('selectProject', projectId)"
    @close-actions-menu="emit('closeActionsMenu')"
    @toggle-view="(view) => emit('toggleView', view)"
  />
</template>