<script setup lang="ts">
defineProps<{
  title: string
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="fixed inset-0 z-[125] lg:hidden">
    <button
      type="button"
      class="absolute inset-0 bg-black/30"
      aria-label="Close mobile workspace panel"
      @click="emit('close')"
    />

    <section class="absolute bottom-0 left-0 right-0 max-h-[80dvh] overflow-auto rounded-t-[var(--tf-radius-lg)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-3">
      <div class="mb-2 flex items-center justify-between gap-2">
        <p class="m-0 text-sm font-semibold text-[var(--tf-color-text-title)]">
          {{ title }}
        </p>
        <button
          type="button"
          class="rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] px-2 py-1 text-xs text-[var(--tf-color-text-default)]"
          @click="emit('close')"
        >
          Close
        </button>
      </div>

      <slot />
    </section>
  </div>
</template>