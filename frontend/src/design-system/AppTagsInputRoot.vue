<script setup lang="ts">
import { TagsInputRoot } from 'reka-ui'
</script>

<template>
  <TagsInputRoot v-bind="$attrs">
    <slot />
  </TagsInputRoot>
</template>
