<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  closable?: boolean
  draggable?: boolean
  dropTarget?: boolean
}>(), {
  closable: true,
  draggable: true,
  dropTarget: false,
})

const emit = defineEmits<{
  close: []
  dragstart: [event: DragEvent]
  dragend: [event: DragEvent]
  dragover: [event: DragEvent]
  drop: [event: DragEvent]
}>()
</script>

<template>
  <section
    class="h-full min-h-0 rounded-[var(--tf-radius-lg)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)]"
    :class="dropTarget ? 'ring-2 ring-[var(--tf-color-accent)]' : ''"
    @dragover="(event) => emit('dragover', event)"
    @drop="(event) => emit('drop', event)"
  >
    <header class="flex items-center justify-between gap-2 border-b border-[var(--tf-color-surface-border)] px-3 py-2">
      <h2 class="m-0 truncate text-sm font-semibold text-[var(--tf-color-text-default)]">
        {{ title }}
      </h2>

      <div class="flex items-center gap-2">
        <slot name="actions" />

        <button
          v-if="draggable"
          type="button"
          class="rounded-[8px] border border-[var(--tf-color-surface-border)] px-2 py-1 text-xs text-[var(--tf-color-text-default)]"
          :draggable="draggable"
          :aria-label="`Drag ${title} panel`"
          @dragstart="(event) => emit('dragstart', event)"
          @dragend="(event) => emit('dragend', event)"
        >
          Drag
        </button>

        <button
          v-if="closable"
          type="button"
          class="rounded-[8px] border border-[var(--tf-color-surface-border)] px-2 py-1 text-xs text-[var(--tf-color-text-default)]"
          :aria-label="`Close ${title} panel`"
          @click="emit('close')"
        >
          Close
        </button>
      </div>
    </header>

    <div class="h-[calc(100%-2.5rem)] min-h-0 overflow-y-auto p-3">
      <slot />
    </div>
  </section>
</template>
