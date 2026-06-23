<script setup lang="ts">
import { SplitterPanel } from 'reka-ui'
</script>

<template>
  <SplitterPanel v-bind="$attrs">
    <slot />
  </SplitterPanel>
</template>
