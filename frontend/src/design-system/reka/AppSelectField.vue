<script setup lang="ts">
import {
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'

interface SelectOption {
  readonly label: string
  readonly value: string
}

const props = withDefaults(defineProps<{
  modelValue: string
  options: readonly SelectOption[]
  ariaLabel?: string
  placeholder?: string
  disabled?: boolean
}>(), {
  ariaLabel: 'Select',
  placeholder: 'Choose option',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <SelectRoot
    :model-value="props.modelValue"
    :disabled="disabled"
    @update:model-value="(value) => value && emit('update:modelValue', value as string)"
  >
    <SelectTrigger
      :aria-label="ariaLabel"
      class="inline-flex h-10 w-full items-center justify-between gap-2 rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] px-3 text-sm text-[var(--tf-color-text-default)]"
    >
      <SelectValue :placeholder="placeholder" />
    </SelectTrigger>

    <SelectPortal>
      <SelectContent
        position="popper"
        side="bottom"
        :side-offset="4"
        class="z-[130] min-w-[12rem] overflow-hidden rounded-[var(--tf-radius-md)] border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-1 shadow-lg"
      >
        <SelectViewport>
          <SelectItem
            v-for="option in options"
            :key="option.value"
            :value="option.value"
            class="relative flex cursor-pointer items-center justify-between rounded-[var(--tf-radius-sm)] px-2 py-1.5 text-sm text-[var(--tf-color-text-default)] data-[highlighted]:bg-[var(--tf-color-surface-alt)]"
          >
            <SelectItemText>{{ option.label }}</SelectItemText>
            <SelectItemIndicator>✓</SelectItemIndicator>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
