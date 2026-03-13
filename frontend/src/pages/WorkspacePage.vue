<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppShell from '../components/layout/AppShell.vue'
import AppHeader from '../components/layout/AppHeader.vue'
import WorkspaceLayout from '../components/layout/WorkspaceLayout.vue'
import AppSectionTitle from '../components/ui/AppSectionTitle.vue'
import AppText from '../components/ui/AppText.vue'
import AppErrorText from '../components/ui/AppErrorText.vue'
import { useProjectStore } from '../stores/projects'

const projectStore = useProjectStore()
const selectedProject = computed(() => projectStore.selectedProject)
const message = ref<string | null>(null)

onMounted(async () => {
  if (!projectStore.projects.length) {
    await projectStore.fetchProjects()
  }
})

function openProjectPicker() {
  message.value = 'Project picker panel scaffolded; implementation comes in the next phase.'
}

function openOverflow() {
  message.value = 'Workspace actions menu scaffolded; implementation comes in the next phase.'
}
</script>

<template>
  <AppShell :full-width="true">
    <template #header>
      <AppHeader
        :project-name="selectedProject?.name"
        @open-project-picker="openProjectPicker"
        @open-overflow="openOverflow"
      />
    </template>

    <WorkspaceLayout>
      <template #left>
        <AppSectionTitle>Image Browser</AppSectionTitle>
        <AppText class="mt-3">
          Desktop panel scaffold. Gallery logic moves here in Phase 2.
        </AppText>
      </template>

      <section>
        <AppSectionTitle>Tagging Workspace</AppSectionTitle>
        <AppText class="mt-3">
          This page scaffolds the future one-page workspace shell.
          Existing routes remain active during migration.
        </AppText>

        <AppText
          v-if="projectStore.loading"
          class="mt-3"
        >
          Loading projects…
        </AppText>
        <AppErrorText
          v-else-if="projectStore.error"
          class="mt-3"
        >
          {{ projectStore.error }}
        </AppErrorText>
        <AppText
          v-else-if="!selectedProject"
          class="mt-3"
        >
          No project selected yet.
        </AppText>
        <AppText
          v-else
          class="mt-3"
        >
          Selected project: <strong>{{ selectedProject.name }}</strong>
        </AppText>

        <AppText
          v-if="message"
          class="mt-3"
          tone="muted"
        >
          {{ message }}
        </AppText>
      </section>

      <template #right>
        <AppSectionTitle>Tag Inspector</AppSectionTitle>
        <AppText class="mt-3">
          Desktop panel scaffold. Image tags/editor move here in Phase 2.
        </AppText>
      </template>
    </WorkspaceLayout>
  </AppShell>
</template>
