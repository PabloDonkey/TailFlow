<script setup lang="ts">
import { ToastRoot } from 'reka-ui'
</script>

<template>
  <ToastRoot v-bind="$attrs">
    <slot />
  </ToastRoot>
</template>
