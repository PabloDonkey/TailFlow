<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  const project = typeof route.query.project === 'string' ? route.query.project : undefined
  const image = typeof route.params.id === 'string' ? route.params.id : undefined
  void router.replace({
    path: '/workspace',
    query: {
      ...(project ? { project } : {}),
      ...(image ? { image } : {}),
    },
  })
})
</script>

<template>
  <p data-testid="legacy-image-detail-redirect">
    Redirecting to workspace...
  </p>
</template>
