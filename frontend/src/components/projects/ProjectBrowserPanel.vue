<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getProjectImageFileUrl, listProjectImages, type Project } from '../../api'

const props = defineProps<{
  projects: Project[]
  selectedProjectId: string | null
  loading: boolean
  discovering: boolean
}>()

const emit = defineEmits<{
  selectProject: [projectId: string]
  openCreateProject: []
  discoverProjects: []
  showTagging: [projectId: string]
}>()

const orderedProjects = computed(() =>
  [...props.projects].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
)

const projectPreviewUrls = ref<Record<string, string | null>>({})

async function loadProjectPreviews(projects: Project[]): Promise<void> {
  const nextPreviewEntries = await Promise.all(
    projects.map(async (project) => {
      if (project.missing_at) {
        return [project.id, null] as const
      }

      try {
        const images = await listProjectImages(project.id)
        const firstImage = images[0]
        if (!firstImage) {
          return [project.id, null] as const
        }
        return [project.id, getProjectImageFileUrl(project.id, firstImage.id)] as const
      } catch {
        return [project.id, null] as const
      }
    }),
  )

  projectPreviewUrls.value = Object.fromEntries(nextPreviewEntries)
}

watch(
  () => orderedProjects.value,
  async (projects) => {
    await loadProjectPreviews(projects)
  },
  { immediate: true },
)

function projectStatusLabel(project: Project): string {
  return project.missing_at ? 'Missing' : 'Active'
}
</script>

<template>
  <section class="rounded-[var(--tf-radius-lg)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-3 lg:h-full lg:min-h-0 lg:overflow-y-auto">
    <div class="mb-3 flex items-center justify-between gap-2">
      <h2 class="m-0 text-sm font-semibold text-[var(--tf-color-text-default)]">
        Project Browser
      </h2>
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
      class="space-y-2"
    >
      <button
        v-for="project in orderedProjects"
        :key="project.id"
        type="button"
        class="w-full rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-transparent p-2 text-left"
        :class="project.id === selectedProjectId ? 'ring-1 ring-[var(--tf-color-accent)]' : ''"
        @click="emit('selectProject', project.id)"
      >
        <span class="grid h-32 w-full overflow-hidden rounded-[var(--tf-radius-sm)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface-muted)] text-xs text-[var(--tf-color-text-muted)] lg:h-40">
          <img
            v-if="projectPreviewUrls[project.id]"
            :src="projectPreviewUrls[project.id] ?? ''"
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
          <span class="mt-2 flex items-center justify-between gap-2">
            <span class="inline-flex items-center rounded-[var(--tf-radius-sm)] border border-[var(--tf-color-surface-border)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.04em] text-[var(--tf-color-text-muted)]">
              {{ projectStatusLabel(project) }}
            </span>
            <button
              type="button"
              class="rounded-[var(--tf-radius-sm)] border border-[var(--tf-color-surface-border)] bg-transparent px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--tf-color-text-default)]"
              @click.stop="emit('showTagging', project.id)"
            >
              Tagging
            </button>
          </span>
        </span>
      </button>
    </div>
  </section>
</template>