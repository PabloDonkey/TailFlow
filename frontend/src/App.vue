<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const showNavigation = computed(() => route.path !== '/onboarding')
</script>

<template>
  <div id="app-root">
    <nav
      v-if="showNavigation"
      class="nav-bar"
    >
      <RouterLink to="/projects">
        Projects
      </RouterLink>
      <RouterLink to="/gallery">
        Gallery
      </RouterLink>
      <RouterLink to="/tags">
        Tags
      </RouterLink>
    </nav>
    <main class="page-content">
      <RouterView />
    </main>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #f5f5f5;
  color: #222;
}

#app-root {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.nav-bar {
  display: flex;
  justify-content: space-around;
  background: #1a1a2e;
  padding: 0.75rem 1rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-bar a {
  color: #e0e0e0;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.nav-bar a.router-link-active {
  color: #fff;
  background: #4a4e8a;
}

.page-content {
  flex: 1;
  padding: 1rem;
  max-width: 768px;
  width: 100%;
  margin: 0 auto;
}
</style>
