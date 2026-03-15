<script setup lang="ts">
import type { Project } from '../../api'
import AppErrorText from '../ui/AppErrorText.vue'
import AppSectionTitle from '../ui/AppSectionTitle.vue'
import AppText from '../ui/AppText.vue'

const props = defineProps<{
  projects: Project[]
  selectedProjectId: string | null
  loading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  close: []
  refresh: []
  selectProject: [projectId: string]
}>()
</script>

<template>
  <div class="fixed inset-0 z-[130] lg:pointer-events-none lg:inset-auto lg:left-4 lg:top-[3.9rem]">
    <button
      type="button"
      class="absolute inset-0 bg-black/25 lg:hidden"
      aria-label="Close project picker"
      @click="emit('close')"
    />

    <section class="absolute left-3 top-[3.7rem] w-[min(20rem,calc(100vw-1.5rem))] rounded-[var(--tf-radius-lg)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-2 shadow-xl lg:pointer-events-auto lg:left-0 lg:top-0">
      <div class="flex items-center justify-between gap-2 px-1 pb-1">
        <AppSectionTitle>Project Picker</AppSectionTitle>
        <button
          type="button"
          class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] px-2 py-1 text-xs text-[var(--tf-color-text-default)]"
          :disabled="loading"
          @click="emit('refresh')"
        >
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>

      <AppErrorText v-if="error">
        {{ error }}
      </AppErrorText>

      <AppText
        v-if="!props.projects.length"
        tone="muted"
      >
        No projects found.
      </AppText>

      <ul
        v-else
        class="m-0 flex list-none flex-col gap-1 p-0"
      >
        <li
          v-for="project in props.projects"
          :key="project.id"
        >
          <button
            type="button"
            class="flex w-full items-center justify-between rounded-[var(--tf-radius-md)] border px-2 py-1.5 text-left"
            :class="project.id === props.selectedProjectId
              ? 'border-[var(--tf-color-header-action-bg)] bg-[var(--tf-color-surface-border)]'
              : 'border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)]'"
            @click="emit('selectProject', project.id)"
          >
            <span class="truncate text-sm text-[var(--tf-color-text-default)]">{{ project.name }}</span>
            <span
              v-if="project.id === props.selectedProjectId"
              class="text-[0.72rem] font-semibold text-[var(--tf-color-header-action-bg)]"
            >
              Active
            </span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>