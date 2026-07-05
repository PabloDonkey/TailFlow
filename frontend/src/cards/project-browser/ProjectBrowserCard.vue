<script setup lang="ts">
import { computed } from 'vue'
import { getProjectImageFileUrl, type Project } from '../../api'

const props = withDefaults(defineProps<{
  projects: Project[]
  selectedProjectId: string | null
  loading: boolean
  discovering: boolean
  showActions?: boolean
}>(), {
  showActions: true,
})

const emit = defineEmits<{
  selectProject: [projectId: string]
  openCreateProject: []
  discoverProjects: []
  showTagging: [projectId: string]
}>()

const orderedProjects = computed(() =>
  [...props.projects].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
)

function projectPreviewUrl(project: Project): string | null {
  if (project.missing_at) {
    return null
  }

  const preview = project.preview_image
  if (!preview) {
    return null
  }

  return getProjectImageFileUrl(
    project.id,
    preview.id,
    preview.content_hash ?? preview.discovered_at,
  )
}

function projectStatusLabel(project: Project): string {
  return project.missing_at ? 'Missing' : 'Active'
}
</script>

<template>
  <div
    v-if="props.showActions !== false"
    class="mb-3 flex items-center justify-end gap-2"
  >
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-transparent px-2 py-1 text-xs font-medium text-[var(--tf-color-text-default)] disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="discovering"
        @click="emit('discoverProjects')"
      >
        {{ discovering ? 'Refreshing…' : 'Discover' }}
      </button>
      <button
        type="button"
        class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-transparent px-2 py-1 text-xs font-medium text-[var(--tf-color-text-default)] disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="loading"
        @click="emit('openCreateProject')"
      >
        Create Project
      </button>
    </div>
  </div>

  <p
    v-if="orderedProjects.length === 0"
    class="m-0 rounded-[var(--tf-radius-md)] border border-dashed border-[var(--tf-color-surface-border)] px-3 py-4 text-sm text-[var(--tf-color-text-muted)]"
  >
    No projects available yet.
  </p>

  <div
    v-else
    class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
  >
    <button
      v-for="project in orderedProjects"
      :key="project.id"
      type="button"
      class="w-full rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-transparent p-2 text-left"
      :class="project.id === selectedProjectId ? 'ring-1 ring-[var(--tf-color-accent)]' : ''"
      @click="() => { emit('selectProject', project.id); emit('showTagging', project.id) }"
    >
      <span class="grid h-32 w-full overflow-hidden rounded-[var(--tf-radius-sm)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface-muted)] text-xs text-[var(--tf-color-text-muted)] lg:h-40">
        <img
          v-if="projectPreviewUrl(project)"
          :src="projectPreviewUrl(project) ?? ''"
          :alt="`${project.name} preview`"
          class="h-full w-full object-cover"
        >
        <span
          v-else
          class="grid h-full w-full place-items-center"
        >
          IMG
        </span>
      </span>
      <span class="mt-2 block min-w-0">
        <span class="block truncate text-sm font-medium text-[var(--tf-color-text-default)]">{{ project.name }}</span>
        <span class="mt-1 block truncate text-xs text-[var(--tf-color-text-muted)]">class: {{ project.class_tag }}</span>
        <span class="mt-2 inline-flex items-center rounded-[var(--tf-radius-sm)] border border-[var(--tf-color-surface-border)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.04em] text-[var(--tf-color-text-muted)]">
          {{ projectStatusLabel(project) }}
        </span>
      </span>
    </button>
  </div>
</template>