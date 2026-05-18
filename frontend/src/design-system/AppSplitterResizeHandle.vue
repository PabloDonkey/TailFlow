<script setup lang="ts">
import { SplitterResizeHandle } from 'reka-ui'
</script>

<template>
  <SplitterResizeHandle v-bind="$attrs">
    <slot />
  </SplitterResizeHandle>
</template>
