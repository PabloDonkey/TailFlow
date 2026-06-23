<script setup lang="ts">
import { ToolbarRoot } from 'reka-ui'

withDefaults(defineProps<{
  ariaLabel?: string
}>(), {
  ariaLabel: 'Toolbar',
})
</script>

<template>
  <ToolbarRoot :aria-label="ariaLabel">
    <slot />
  </ToolbarRoot>
</template>
