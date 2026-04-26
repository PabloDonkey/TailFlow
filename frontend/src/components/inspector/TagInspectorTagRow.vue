<script setup lang="ts">
const props = withDefaults(defineProps<{
  label: string
  meta?: string | null
  actionLabel?: string
  actionKind?: 'add' | 'remove' | null
  variant?: 'default' | 'selected'
  actionDisabled?: boolean
}>(), {
  meta: null,
  actionLabel: 'Add',
  actionKind: 'add',
  variant: 'default',
  actionDisabled: false,
})

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <li
    class="flex w-full items-center justify-between rounded-[var(--tf-radius-md)] border px-3 py-2 text-left transition"
    :class="variant === 'selected'
      ? 'cursor-default border-[var(--tf-color-success)] bg-[var(--tf-color-success-soft)] text-[var(--tf-color-text-default)]'
      : 'border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] text-[var(--tf-color-text-default)]'"
  >
    <span class="flex min-w-0 flex-col">
      <span class="truncate text-sm font-medium">{{ label }}</span>
      <span
        v-if="meta"
        class="text-xs text-[var(--tf-color-text-muted)]"
      >
        {{ meta }}
      </span>
    </span>

    <button
      v-if="actionKind"
      type="button"
      class="text-xs font-medium uppercase tracking-[0.08em] text-[var(--tf-color-text-default)] transition hover:text-[var(--tf-color-action)] disabled:cursor-not-allowed disabled:opacity-60"
      :disabled="actionDisabled"
      @click="emit('action')"
    >
      {{ actionLabel }}
    </button>

    <span
      v-else
      class="text-xs font-medium uppercase tracking-[0.08em] text-[var(--tf-color-text-muted)]"
    >
      {{ actionLabel }}
    </span>
  </li>
</template>
