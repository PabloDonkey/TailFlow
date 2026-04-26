<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui'

const props = withDefaults(defineProps<{
  modelValue: boolean
  ariaLabel?: string
  disabled?: boolean
}>(), {
  ariaLabel: 'Toggle switch',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <SwitchRoot
    :model-value="modelValue"
    :disabled="disabled"
    :aria-label="ariaLabel"
    class="relative inline-flex h-6 w-11 items-center rounded-full border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] data-[state=checked]:bg-[var(--tf-color-action)]"
    @update:model-value="(value) => emit('update:modelValue', Boolean(value))"
  >
    <SwitchThumb
      class="block h-5 w-5 translate-x-0.5 rounded-full bg-[var(--tf-color-background)] transition-transform will-change-transform data-[state=checked]:translate-x-[1.35rem]"
    />
  </SwitchRoot>
</template>
