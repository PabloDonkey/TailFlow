<script setup lang="ts">
import type { Project } from '../../api'
import WorkspaceTagInspectorPanel from '../inspector/WorkspaceTagInspectorPanel.vue'
import WorkspaceTagsLibraryPanel from '../sidebar/WorkspaceTagsLibraryPanel.vue'

defineProps<{
  showTagsLibrary: boolean
  projectId: string | null
  selectedProject: Project | null
}>()

const emit = defineEmits<{
  closeTagsLibrary: []
}>()
</script>

<template>
  <WorkspaceTagsLibraryPanel
    v-if="showTagsLibrary"
    :show-close="true"
    @close="emit('closeTagsLibrary')"
  />
  <WorkspaceTagInspectorPanel
    v-else
    :project-id="projectId"
    :selected-project="selectedProject"
  />
</template>