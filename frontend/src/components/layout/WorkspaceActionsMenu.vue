<script setup lang="ts">
const props = defineProps<{
  activeRightPanel: 'inspector' | 'tags' | 'projects'
}>()

const emit = defineEmits<{
  close: []
  showTagsLibrary: []
  showInspector: []
  showProjects: []
}>()

const actionButtonBaseClass =
  'w-full rounded-[var(--tf-radius-md)] border-0 px-2 py-2 text-left text-sm transition-colors'

const actionButtonActiveClass =
  'bg-[var(--tf-color-surface-border)] text-[var(--tf-color-text-default)] font-semibold'

const actionButtonInactiveClass =
  'bg-transparent text-[var(--tf-color-text-default)] hover:bg-[var(--tf-color-surface-border)]'

const isPanelSelected = (panel: 'inspector' | 'tags' | 'projects'): 'true' | 'false' =>
  props.activeRightPanel === panel ? 'true' : 'false'

const actionButtonClass = (panel: 'inspector' | 'tags' | 'projects'): string =>
  `${actionButtonBaseClass} ${props.activeRightPanel === panel ? actionButtonActiveClass : actionButtonInactiveClass}`
</script>

<template>
  <div class="fixed inset-x-0 bottom-0 top-[3.7rem] z-[120] lg:top-[4rem]">
    <button
      type="button"
      class="absolute inset-0 bg-black/25 lg:bg-transparent"
      aria-label="Close workspace actions"
      @click="emit('close')"
    />

    <section class="absolute right-3 top-2 w-[min(19rem,calc(100vw-1.5rem))] rounded-[var(--tf-radius-lg)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-2 shadow-xl lg:right-4 lg:top-2">
      <p class="m-0 px-2 pb-1 text-xs uppercase tracking-[0.08em] text-[var(--tf-color-text-muted)]">
        Workspace actions
      </p>

      <button
        type="button"
        :aria-selected="isPanelSelected('tags')"
        :class="actionButtonClass('tags')"
        @click="emit('showTagsLibrary')"
      >
        Tags library
      </button>

      <button
        type="button"
        :aria-selected="isPanelSelected('inspector')"
        :class="actionButtonClass('inspector')"
        @click="emit('showInspector')"
      >
        Tag inspector
      </button>

      <button
        type="button"
        :aria-selected="isPanelSelected('projects')"
        :class="actionButtonClass('projects')"
        @click="emit('showProjects')"
      >
        Project manager
      </button>
    </section>
  </div>
</template>