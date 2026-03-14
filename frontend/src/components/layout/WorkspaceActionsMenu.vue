<script setup lang="ts">
defineProps<{
  showTagsLibrary: boolean
}>()

const emit = defineEmits<{
  close: []
  showTagsLibrary: []
  showInspector: []
}>()
</script>

<template>
  <div class="fixed inset-0 z-[120] lg:pointer-events-none lg:inset-auto lg:right-4 lg:top-[3.9rem]">
    <button
      type="button"
      class="absolute inset-0 bg-black/25 lg:hidden"
      aria-label="Close workspace actions"
      @click="emit('close')"
    />

    <section class="absolute right-3 top-[3.7rem] w-[min(19rem,calc(100vw-1.5rem))] rounded-[var(--tf-radius-lg)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-2 shadow-xl lg:pointer-events-auto lg:right-0 lg:top-0">
      <p class="m-0 px-2 pb-1 text-xs uppercase tracking-[0.08em] text-[var(--tf-color-text-muted)]">
        Workspace actions
      </p>

      <button
        type="button"
        class="w-full rounded-[var(--tf-radius-md)] border-0 bg-transparent px-2 py-2 text-left text-sm text-[var(--tf-color-text-default)] hover:bg-[var(--tf-color-surface-border)]"
        @click="emit('showTagsLibrary')"
      >
        {{ showTagsLibrary ? 'Tags library visible' : 'Open tags library' }}
      </button>

      <button
        type="button"
        class="w-full rounded-[var(--tf-radius-md)] border-0 bg-transparent px-2 py-2 text-left text-sm text-[var(--tf-color-text-default)] hover:bg-[var(--tf-color-surface-border)]"
        @click="emit('showInspector')"
      >
        Show tag inspector
      </button>
    </section>
  </div>
</template>