<script setup lang="ts">
withDefaults(defineProps<{
  tone?: 'default' | 'muted'
}>(), {
  tone: 'default',
})
</script>

<template>
  <p
    class="m-0 leading-[1.35]"
    :class="{
      'text-[var(--tf-color-text-default)]': tone === 'default',
      'text-[var(--tf-color-text-muted)]': tone === 'muted',
    }"
  >
    <slot />
  </p>
</template>