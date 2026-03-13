<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import NavLink from '@/components/ui/NavLink.vue'

const route = useRoute()
const showNavigation = computed(() => route.path !== '/onboarding')
</script>

<template>
  <div class="flex min-h-dvh flex-col">
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
    <main class="mx-auto w-full max-w-[768px] flex-1 p-4">
      <RouterView />
    </main>
  </div>
</template>
