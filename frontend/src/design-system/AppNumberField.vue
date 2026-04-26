<script setup lang="ts">
import { NumberFieldInput, NumberFieldRoot } from 'reka-ui'

const props = withDefaults(defineProps<{
  modelValue: number
  ariaLabel?: string
  min?: number
  max?: number
  step?: number
  disabled?: boolean
}>(), {
  ariaLabel: 'Number field',
  min: 0,
  max: 100,
  step: 1,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()
</script>

<template>
  <NumberFieldRoot
    :model-value="modelValue"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled"
    @update:model-value="(value) => typeof value === 'number' && emit('update:modelValue', value)"
  >
    <NumberFieldInput
      :aria-label="ariaLabel"
      class="h-10 w-full rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] px-3 text-sm text-[var(--tf-color-text-default)]"
    />
  </NumberFieldRoot>
</template>
