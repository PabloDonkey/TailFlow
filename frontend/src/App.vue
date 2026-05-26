<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppToaster from './components/ui/AppToaster.vue'

const route = useRoute()
const isWorkspaceRoute = computed(() => route.path === '/workspace')
</script>

<template>
  <div
    class="flex min-h-dvh flex-col"
    :class="isWorkspaceRoute ? 'h-dvh overflow-hidden' : ''"
  >
    <main
      class="mx-auto w-full flex-1"
      :class="isWorkspaceRoute ? 'max-w-none overflow-hidden p-0' : 'max-w-[768px] p-4'"
    >
      <RouterView />
    </main>

    <AppToaster />
  </div>
</template>
