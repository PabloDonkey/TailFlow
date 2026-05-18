<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ProjectDetailsEditor from '../cards/project-details/components/ProjectDetailsEditor.vue'
import { useProjectStore } from '../stores/projects'
import type { TaggingMode } from '../api'

const projectStore = useProjectStore()

const selectedProject = computed(() => projectStore.selectedProject)
const createFolderName = ref('')
const createClassTag = ref('')
const createName = ref('')
const createTriggerTag = ref('')
const createTaggingMode = ref<TaggingMode>('e621')
const createFormError = ref<string | null>(null)

onMounted(() => {
  projectStore.fetchProjects()
})

async function discoverProjects() {
  await projectStore.discoverAndRefresh()
}

async function createProject() {
  createFormError.value = null

  const folderName = createFolderName.value.trim()
  const classTag = createClassTag.value.trim()

  if (!folderName) {
    createFormError.value = 'Folder name is required.'
    return
  }
  if (!classTag) {
    createFormError.value = 'Class tag is required.'
    return
  }

  const result = await projectStore.createProject({
    folder_name: folderName,
    class_tag: classTag,
    name: createName.value.trim() || undefined,
    trigger_tag: createTriggerTag.value.trim() || undefined,
    tagging_mode: createTaggingMode.value,
  })

  if (result) {
    createFolderName.value = ''
    createClassTag.value = ''
    createName.value = ''
    createTriggerTag.value = ''
    createTaggingMode.value = 'e621'
  }
}
</script>

<template>
  <div class="projects-page">
    <div class="header-row">
      <h1>Projects</h1>
      <button
        class="btn btn-primary"
        :disabled="projectStore.loading"
        @click="discoverProjects"
      >
        {{ projectStore.loading ? 'Refreshing…' : 'Discover / Refresh' }}
      </button>
    </div>

    <p
      v-if="projectStore.error"
      class="error"
    >
      {{ projectStore.error }}
    </p>
    <p
      v-if="projectStore.lastDiscover"
      class="status"
    >
      Discovery: {{ projectStore.lastDiscover.discovered_projects }} found,
      {{ projectStore.lastDiscover.imported_projects }} imported,
      {{ projectStore.lastDiscover.marked_missing_projects }} marked missing.
    </p>

    <section class="create-project">
      <h2>Create Project</h2>
      <div class="form-grid">
        <label>
          Folder Name
          <input
            v-model="createFolderName"
            type="text"
            placeholder="e.g. project-c"
          >
        </label>
        <label>
          Class Tag
          <input
            v-model="createClassTag"
            type="text"
            placeholder="e.g. character"
          >
        </label>
        <label>
          Display Name (optional)
          <input
            v-model="createName"
            type="text"
            placeholder="e.g. Project C"
          >
        </label>
        <label>
          Trigger Tag (optional)
          <input
            v-model="createTriggerTag"
            type="text"
            placeholder="defaults to folder"
          >
        </label>
        <label>
          Tagging Mode
          <select
            v-model="createTaggingMode"
            data-testid="create-tagging-mode"
          >
            <option value="e621">
              e621
            </option>
            <option value="booru">
              booru
            </option>
          </select>
        </label>
      </div>
      <button
        class="btn btn-primary"
        :disabled="projectStore.creating"
        @click="createProject"
      >
        {{ projectStore.creating ? 'Creating…' : 'Create Project' }}
      </button>
      <p
        v-if="createFormError"
        class="error"
      >
        {{ createFormError }}
      </p>
      <p
        v-if="projectStore.lastCreate"
        class="status success"
      >
        Project created successfully.
      </p>
    </section>

    <div class="content-grid">
      <section class="project-list">
        <h2>Available Projects</h2>
        <p
          v-if="!projectStore.projects.length"
          class="empty"
        >
          No projects found yet.
        </p>
        <ul v-else>
          <li
            v-for="project in projectStore.projects"
            :key="project.id"
          >
            <button
              class="project-item"
              :class="{ active: project.id === projectStore.selectedProjectId }"
              @click="projectStore.selectProject(project.id)"
            >
              <span class="project-name">{{ project.name }}</span>
              <span
                v-if="project.missing_at"
                class="missing-pill"
              >Missing</span>
            </button>
          </li>
        </ul>
      </section>

      <ProjectDetailsEditor :selected-project="selectedProject" />
    </div>
  </div>
</template>

<style scoped>
.projects-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

h1 {
  font-size: 1.5rem;
}

.content-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

.project-list,
.create-project {
  background: #fff;
  border-radius: 8px;
  padding: 1rem;
}

h2 {
  margin-bottom: 0.75rem;
  font-size: 1.1rem;
}

.btn {
  padding: 0.65rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
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

.status {
  color: #444;
  font-size: 0.9rem;
}

.status.success {
  color: #0b6b0b;
}

.empty {
  color: #666;
}

.project-list ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.project-item {
  width: 100%;
  text-align: left;
  background: #f6f7fb;
  border: 1px solid #d8ddef;
  border-radius: 6px;
  padding: 0.65rem 0.75rem;
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  cursor: pointer;
}

.project-item.active {
  border-color: #4a4e8a;
  background: #e9ecf8;
}

.project-name {
  font-weight: 600;
}

.missing-pill {
  background: #fee;
  color: #a11;
  border-radius: 999px;
  padding: 0.1rem 0.45rem;
  font-size: 0.75rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.6rem;
  margin-bottom: 0.75rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  color: #333;
  font-size: 0.92rem;
}

input[type='text'],
select,
input[type='file'] {
  border: 1px solid #cfd4e2;
  border-radius: 6px;
  padding: 0.5rem 0.6rem;
  font-size: 0.92rem;
}

@media (min-width: 800px) {
  .content-grid {
    grid-template-columns: 1fr 1.2fr;
  }

  .form-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
