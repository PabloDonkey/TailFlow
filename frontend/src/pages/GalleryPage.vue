<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useImageStore } from '../stores/images'
import { getImageFileUrl } from '../api'

const imageStore = useImageStore()
const router = useRouter()

onMounted(() => {
  imageStore.fetchImages()
})

function goToImage(id: string) {
  router.push(`/image/${id}`)
}
</script>

<template>
  <div class="gallery-page">
    <h1>Gallery</h1>

    <p v-if="imageStore.loading">Loading…</p>
    <p v-else-if="imageStore.error" class="error">{{ imageStore.error }}</p>
    <p v-else-if="!imageStore.images.length" class="empty">
      No images yet. <RouterLink to="/upload">Upload one!</RouterLink>
    </p>

    <div v-else class="grid">
      <div
        v-for="img in imageStore.images"
        :key="img.id"
        class="card"
        @click="goToImage(img.id)"
      >
        <img :src="getImageFileUrl(img.id)" :alt="img.original_name" class="thumb" loading="lazy" />
        <div class="card-info">
          <span class="name" :title="img.original_name">{{ img.original_name }}</span>
          <span class="tag-count">{{ img.tag_count }} tag{{ img.tag_count !== 1 ? 's' : '' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gallery-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

h1 {
  font-size: 1.5rem;
}

.error {
  color: #c00;
}

.empty a {
  color: #4a4e8a;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
}

.card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.card:hover {
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
}

.thumb {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
}

.card-info {
  padding: 0.4rem 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  gap: 0.25rem;
}

.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.tag-count {
  color: #666;
  white-space: nowrap;
}
</style>
