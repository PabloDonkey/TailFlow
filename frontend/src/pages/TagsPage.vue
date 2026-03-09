<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useTagStore } from '../stores/tags'

const tagStore = useTagStore()

const newTagName = ref('')
const newTagCategory = ref('')
const errorMsg = ref<string | null>(null)

onMounted(() => {
  tagStore.fetchTags()
})

async function createTag() {
  const name = newTagName.value.trim()
  if (!name) return
  errorMsg.value = null
  const tag = await tagStore.addTag(name, newTagCategory.value.trim() || undefined)
  if (tag) {
    newTagName.value = ''
    newTagCategory.value = ''
  } else {
    errorMsg.value = tagStore.error ?? 'Failed to create tag'
  }
}
</script>

<template>
  <div class="tags-page">
    <h1>Tags</h1>

    <div class="create-form">
      <h2>Create Tag</h2>
      <div class="form-row">
        <input
          v-model="newTagName"
          placeholder="Tag name"
          class="input"
          @keyup.enter="createTag"
        >
        <input
          v-model="newTagCategory"
          placeholder="Category (optional)"
          class="input"
        >
        <button
          :disabled="tagStore.loading"
          class="btn btn-primary"
          @click="createTag"
        >
          Add
        </button>
      </div>
      <p
        v-if="errorMsg"
        class="error"
      >
        {{ errorMsg }}
      </p>
    </div>

    <div class="tags-list-section">
      <p v-if="tagStore.loading">
        Loading…
      </p>
      <p
        v-else-if="!tagStore.tags.length"
        class="empty"
      >
        No tags yet.
      </p>
      <ul
        v-else
        class="tags-list"
      >
        <li
          v-for="tag in tagStore.tags"
          :key="tag.id"
          class="tag-item"
        >
          <span class="tag-name">{{ tag.name }}</span>
          <span
            v-if="tag.category"
            class="tag-category"
          >{{ tag.category }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.tags-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

h1 {
  font-size: 1.5rem;
}

h2 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.create-form {
  background: #fff;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.form-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.input {
  flex: 1;
  min-width: 120px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
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

.error {
  color: #c00;
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.empty {
  color: #888;
}

.tags-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fff;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.tag-name {
  font-weight: 500;
}

.tag-category {
  font-size: 0.8rem;
  color: #888;
  background: #f0f0f0;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}
</style>
