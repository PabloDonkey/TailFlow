<script setup lang="ts">
const props = defineProps<{
  openViews: {
    imageBrowser: boolean
    canvas: boolean
    currentTags: boolean
    aiProposedTags: boolean
    tagsLibrary: boolean
    projectDetails: boolean
  }
}>()

const emit = defineEmits<{
  close: []
  toggleView: [
    view: 'image-browser' | 'canvas' | 'current-tags' | 'ai-proposed-tags' | 'tags-library' | 'project-details',
  ]
}>()

const actionButtonBaseClass =
  'w-full rounded-[var(--tf-radius-md)] border-0 px-2 py-2 text-left text-sm transition-colors'

const actionButtonActiveClass =
  'bg-[var(--tf-color-surface-border)] text-[var(--tf-color-text-default)] font-semibold'

const actionButtonInactiveClass =
  'bg-transparent text-[var(--tf-color-text-default)] hover:bg-[var(--tf-color-surface-border)]'

const isPanelSelected = (view: 'image-browser' | 'canvas' | 'current-tags' | 'ai-proposed-tags' | 'tags-library' | 'project-details'): 'true' | 'false' => {
  if (view === 'image-browser') {
    return props.openViews.imageBrowser ? 'true' : 'false'
  }
  if (view === 'canvas') {
    return props.openViews.canvas ? 'true' : 'false'
  }
  if (view === 'current-tags') {
    return props.openViews.currentTags ? 'true' : 'false'
  }
  if (view === 'ai-proposed-tags') {
    return props.openViews.aiProposedTags ? 'true' : 'false'
  }
  if (view === 'tags-library') {
    return props.openViews.tagsLibrary ? 'true' : 'false'
  }
  return props.openViews.projectDetails ? 'true' : 'false'
}

const actionButtonClass = (view: 'image-browser' | 'canvas' | 'current-tags' | 'ai-proposed-tags' | 'tags-library' | 'project-details'): string => {
  const selected = isPanelSelected(view) === 'true'
  return `${actionButtonBaseClass} ${selected ? actionButtonActiveClass : actionButtonInactiveClass}`
}
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
        Views
      </p>

      <button
        type="button"
        :aria-selected="isPanelSelected('image-browser')"
        :class="actionButtonClass('image-browser')"
        @click="emit('toggleView', 'image-browser')"
      >
        Image browser
      </button>

      <button
        type="button"
        :aria-selected="isPanelSelected('canvas')"
        :class="actionButtonClass('canvas')"
        @click="emit('toggleView', 'canvas')"
      >
        Image canvas
      </button>

      <button
        type="button"
        :aria-selected="isPanelSelected('current-tags')"
        :class="actionButtonClass('current-tags')"
        @click="emit('toggleView', 'current-tags')"
      >
        Current tags
      </button>

      <button
        type="button"
        :aria-selected="isPanelSelected('ai-proposed-tags')"
        :class="actionButtonClass('ai-proposed-tags')"
        @click="emit('toggleView', 'ai-proposed-tags')"
      >
        AI proposed tags
      </button>

      <button
        type="button"
        :aria-selected="isPanelSelected('tags-library')"
        :class="actionButtonClass('tags-library')"
        @click="emit('toggleView', 'tags-library')"
      >
        Tags library
      </button>

      <button
        type="button"
        :aria-selected="isPanelSelected('project-details')"
        :class="actionButtonClass('project-details')"
        @click="emit('toggleView', 'project-details')"
      >
        Project details
      </button>

      <p class="m-0 px-2 pt-1 text-[10px] text-[var(--tf-color-text-muted)]">
        Project browser appears automatically when image canvas is closed.
      </p>
    </section>
  </div>
</template>