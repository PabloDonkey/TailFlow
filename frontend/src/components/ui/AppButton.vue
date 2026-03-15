<script setup lang="ts">
withDefaults(defineProps<{
  ariaLabel?: string
  variant?: 'header'
}>(), {
  ariaLabel: undefined,
  variant: 'header',
})

defineEmits<{
  click: [event: MouseEvent]
}>()

const baseClass = 'cursor-pointer border-0 font-inherit'
const headerClass =
  'h-8 w-8 rounded-[var(--tf-radius-md)] bg-[var(--tf-color-header-action-bg)] text-base text-[var(--tf-color-header-text)]'
</script>

<template>
  <button
    type="button"
    :class="[
      baseClass,
      variant === 'header' ? headerClass : null,
    ]"
    :aria-label="ariaLabel"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>