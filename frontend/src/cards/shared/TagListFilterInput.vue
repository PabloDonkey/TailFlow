<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  ariaLabel?: string
  disabled?: boolean
}>(), {
  placeholder: 'Filter tags',
  ariaLabel: 'Filter tags',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <input
    type="text"
    :value="modelValue"
    :placeholder="placeholder"
    :aria-label="ariaLabel"
    :disabled="disabled"
    class="w-full rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] px-3 py-2 text-sm text-[var(--tf-color-text-default)] placeholder:text-[var(--tf-color-text-muted)] disabled:cursor-not-allowed disabled:opacity-60"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  >
</template>
