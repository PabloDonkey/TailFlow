<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useImageStore } from '../stores/images'

const router = useRouter()
const imageStore = useImageStore()

const selectedFile = ref<File | null>(null)
const preview = ref<string | null>(null)
const suggestedTags = ref<string[]>([])
const uploadedId = ref<string | null>(null)
const errorMsg = ref<string | null>(null)

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  selectedFile.value = file
  preview.value = URL.createObjectURL(file)
  suggestedTags.value = []
  uploadedId.value = null
  errorMsg.value = null
}

async function doUpload() {
  if (!selectedFile.value) return
  errorMsg.value = null
  const result = await imageStore.upload(selectedFile.value)
  if (result) {
    uploadedId.value = result.id
    suggestedTags.value = result.suggested_tags
  } else {
    errorMsg.value = imageStore.error ?? 'Upload failed'
  }
}

function goToImage() {
  if (uploadedId.value) {
    router.push(`/image/${uploadedId.value}`)
  }
}
</script>

<template>
  <div class="upload-page">
    <h1>Upload Image</h1>

    <label class="file-label">
      <input type="file" accept="image/*" @change="onFileChange" class="file-input" />
      <span>{{ selectedFile ? selectedFile.name : 'Choose an image…' }}</span>
    </label>

    <div v-if="preview" class="preview-wrap">
      <img :src="preview" alt="Preview" class="preview-img" />
    </div>

    <button
      v-if="selectedFile && !uploadedId"
      @click="doUpload"
      :disabled="imageStore.loading"
      class="btn btn-primary"
    >
      {{ imageStore.loading ? 'Uploading…' : 'Upload' }}
    </button>

    <div v-if="errorMsg" class="error">{{ errorMsg }}</div>

    <div v-if="uploadedId" class="success">
      <p>✅ Image uploaded successfully!</p>
      <div v-if="suggestedTags.length" class="tags-wrap">
        <strong>Suggested tags:</strong>
        <span v-for="tag in suggestedTags" :key="tag" class="tag">{{ tag }}</span>
      </div>
      <button @click="goToImage" class="btn btn-secondary">View &amp; Tag Image</button>
    </div>
  </div>
</template>

<style scoped>
.upload-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

h1 {
  font-size: 1.5rem;
}

.file-label {
  display: block;
  border: 2px dashed #aaa;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  background: #fff;
}

.file-input {
  display: none;
}

.preview-wrap {
  text-align: center;
}

.preview-img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  object-fit: contain;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
}

.btn-primary {
  background: #4a4e8a;
  color: #fff;
}

.btn-primary:disabled {
  opacity: 0.6;
}

.btn-secondary {
  background: #e0e0e0;
  color: #222;
}

.error {
  color: #c00;
  background: #fee;
  padding: 0.5rem;
  border-radius: 4px;
}

.success {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}

.tag {
  background: #e8eaf6;
  color: #3f51b5;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.85rem;
}
</style>
