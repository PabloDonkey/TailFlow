<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  const project = typeof route.query.project === 'string' ? route.query.project : undefined
  void router.replace({
    path: '/workspace',
    query: {
      ...(project ? { project } : {}),
      panel: 'tags',
    },
  })
})
</script>

<template>
  <p data-testid="legacy-tags-redirect">
    Redirecting to workspace...
  </p>
</template>
