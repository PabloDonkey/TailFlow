<script setup lang="ts">
import type { Project } from '../../api'
import ProjectDetailsEditor from './components/ProjectDetailsEditor.vue'

defineProps<{
  selectedProject: Project | null
}>()
</script>

<template>
  <div class="w-full max-w-5xl space-y-3">
    <h2 class="m-0 text-sm font-semibold text-[var(--tf-color-text-default)]">
      Project Details
    </h2>

    <p
      v-if="!selectedProject"
      class="m-0 rounded-[var(--tf-radius-md)] border border-dashed border-[var(--tf-color-surface-border)] px-3 py-4 text-sm text-[var(--tf-color-text-muted)]"
    >
      Select a project from Project Browser to view metadata, sync state, and upload controls.
    </p>

    <ProjectDetailsEditor
      v-else
      :selected-project="selectedProject"
    />
  </div>
</template>