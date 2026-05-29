<script setup lang="ts">
import { ToastViewport } from 'reka-ui'
</script>

<template>
  <ToastViewport v-bind="$attrs">
    <slot />
  </ToastViewport>
</template>
