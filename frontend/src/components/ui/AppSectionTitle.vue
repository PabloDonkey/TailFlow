<script setup lang="ts">
withDefaults(defineProps<{
  as?: 'h1' | 'h2' | 'h3'
}>(), {
  as: 'h2',
})
</script>

<template>
  <component
    :is="as"
    class="m-0 text-base leading-[1.3] text-[var(--tf-color-text-title)]"
  >
    <slot />
  </component>
</template>