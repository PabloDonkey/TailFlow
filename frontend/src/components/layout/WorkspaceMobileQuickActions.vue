<script setup lang="ts">
defineProps<{
  previousAvailable: boolean
  nextAvailable: boolean
}>()

const emit = defineEmits<{
  previous: []
  next: []
  openPanel: [panel: 'browser' | 'inspector' | 'tags']
}>()
</script>

<template>
  <section class="mt-3 grid grid-cols-5 gap-2 rounded-[var(--tf-radius-lg)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-2 lg:hidden">
    <button
      type="button"
      class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] px-2 py-2 text-xs text-[var(--tf-color-text-default)]"
      :disabled="!previousAvailable"
      @click="emit('previous')"
    >
      Prev
    </button>
    <button
      type="button"
      class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] px-2 py-2 text-xs text-[var(--tf-color-text-default)]"
      :disabled="!nextAvailable"
      @click="emit('next')"
    >
      Next
    </button>
    <button
      type="button"
      class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] px-2 py-2 text-xs text-[var(--tf-color-text-default)]"
      @click="emit('openPanel', 'browser')"
    >
      Browse
    </button>
    <button
      type="button"
      class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] px-2 py-2 text-xs text-[var(--tf-color-text-default)]"
      @click="emit('openPanel', 'inspector')"
    >
      Inspect
    </button>
    <button
      type="button"
      class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] px-2 py-2 text-xs text-[var(--tf-color-text-default)]"
      @click="emit('openPanel', 'tags')"
    >
      Tags
    </button>
  </section>
</template>