<script setup lang="ts">
import type { SideCardConfig } from './side-card-service'

defineProps<{
  config: SideCardConfig
}>()
</script>

<template>
  <component
    :is="config.component"
    v-bind="config.props"
    v-on="config.listeners"
  />
</template>
