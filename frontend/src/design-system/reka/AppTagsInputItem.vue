<script setup lang="ts">
import { TagsInputItem } from 'reka-ui'

defineProps<{
  value: string
  disabled?: boolean
  asChild?: boolean
  as?: string
}>()
</script>

<template>
  <TagsInputItem v-bind="{ ...$props, ...$attrs }">
    <slot />
  </TagsInputItem>
</template>
