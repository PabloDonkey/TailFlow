<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui'

withDefaults(defineProps<{
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
    class="tf-switch-root relative inline-flex h-6 w-11 items-center rounded-full transition-colors outline-none focus:outline-none focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
    @update:model-value="(value) => emit('update:modelValue', Boolean(value))"
  >
    <SwitchThumb
      class="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform will-change-transform data-[state=checked]:translate-x-[1.35rem]"
    />
  </SwitchRoot>
</template>

<style scoped>
.tf-switch-root {
  background-color: hsl(220 8% 76%);
}

.tf-switch-root[data-state='checked'] {
  background-color: hsl(151 62% 59%);
}
</style>
