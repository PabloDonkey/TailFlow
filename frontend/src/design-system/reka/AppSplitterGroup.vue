<script setup lang="ts">
import { SplitterGroup } from 'reka-ui'

defineProps<{
  direction: 'horizontal' | 'vertical'
  id?: string
  autoSaveId?: string
  keyboardResizeBy?: number
  asChild?: boolean
  as?: string
}>()
</script>

<template>
  <SplitterGroup v-bind="{ ...$props, ...$attrs }">
    <slot />
  </SplitterGroup>
</template>
