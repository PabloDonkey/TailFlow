<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import NavLink from './components/ui/NavLink.vue'

const route = useRoute()
const showNavigation = computed(() => route.path !== '/onboarding')
const isWorkspaceRoute = computed(() => route.path === '/workspace')
</script>

<template>
  <div
    class="flex min-h-dvh flex-col"
    :class="isWorkspaceRoute ? 'h-dvh overflow-hidden' : ''"
  >
    <nav
      v-if="showNavigation"
      class="sticky top-0 z-[100] flex justify-around bg-[var(--tf-color-header-bg)] px-4 py-3"
    >
      <NavLink to="/workspace">
        Workspace
      </NavLink>
      <NavLink to="/projects">
        Projects
      </NavLink>
      <NavLink to="/gallery">
        Gallery
      </NavLink>
      <NavLink to="/tags">
        Tags
      </NavLink>
    </nav>
    <main
      class="mx-auto w-full flex-1"
      :class="isWorkspaceRoute ? 'max-w-none overflow-hidden p-3 md:p-4' : 'max-w-[768px] p-4'"
    >
      <RouterView />
    </main>
  </div>
</template>
