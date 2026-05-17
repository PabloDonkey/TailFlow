<script setup lang="ts">
import type { Project } from '../../api'
import ProjectDetailsEditor from './components/ProjectDetailsEditor.vue'

defineProps<{
  selectedProject: Project | null
}>()
</script>

<template>
  <div class="w-full max-w-5xl space-y-3">
    <ProjectDetailsEditor
      v-if="selectedProject"
      :selected-project="selectedProject"
    />
  </div>
</template>