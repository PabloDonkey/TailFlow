<script setup lang="ts">
import { ToolbarToggleGroup, ToolbarToggleItem } from 'reka-ui'

interface ToggleOption {
  readonly label: string
  readonly value: string
}

const props = withDefaults(defineProps<{
  modelValue: string
  options: readonly ToggleOption[]
  ariaLabel?: string
  disabled?: boolean
}>(), {
  ariaLabel: 'Segmented toggle',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <ToolbarToggleGroup
    :model-value="props.modelValue"
    type="single"
    :disabled="disabled"
    :aria-label="ariaLabel"
    class="inline-flex items-center gap-1 rounded-[var(--tf-radius-sm)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-1"
    @update:model-value="(value) => value && emit('update:modelValue', value as string)"
  >
    <ToolbarToggleItem
      v-for="option in options"
      :key="option.value"
      :value="option.value"
      class="rounded-[var(--tf-radius-sm)] px-2 py-1 text-xs font-medium uppercase tracking-[0.08em] text-[var(--tf-color-text-muted)] transition hover:text-[var(--tf-color-text-default)] data-[state=on]:bg-[var(--tf-color-surface-alt)] data-[state=on]:text-[var(--tf-color-text-default)]"
    >
      {{ option.label }}
    </ToolbarToggleItem>
  </ToolbarToggleGroup>
</template>
