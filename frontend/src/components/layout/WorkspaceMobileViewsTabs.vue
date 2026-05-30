<script setup lang="ts">
export type MobileWorkspaceTab =
  | 'image-browser'
  | 'image-info'
  | 'canvas'
  | 'current-tags'
  | 'ai-proposed-tags'
  | 'tags-library'
  | 'project-details'
  | 'project-browser'

defineProps<{
  tabs: Array<{ id: MobileWorkspaceTab; label: string }>
  activeTab: MobileWorkspaceTab
}>()

const emit = defineEmits<{
  select: [tab: MobileWorkspaceTab]
}>()
</script>

<template>
  <nav
    aria-label="Workspace views tabs"
    class="mb-3 flex gap-2 overflow-x-auto rounded-[var(--tf-radius-lg)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-2"
  >
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      class="whitespace-nowrap rounded-[var(--tf-radius-md)] border px-2 py-1 text-xs"
      :class="tab.id === activeTab
        ? 'border-[var(--tf-color-accent)] bg-[var(--tf-color-surface-alt)] text-[var(--tf-color-text-default)]'
        : 'border-[var(--tf-color-surface-border)] text-[var(--tf-color-text-muted)]'"
      :aria-current="tab.id === activeTab ? 'page' : undefined"
      @click="emit('select', tab.id)"
    >
      {{ tab.label }}
    </button>
  </nav>
</template>
