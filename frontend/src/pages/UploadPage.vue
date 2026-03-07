<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useProjectStore } from '../stores/projects'

const projectStore = useProjectStore()

const selectedProject = computed(() => projectStore.selectedProject)

onMounted(() => {
  projectStore.fetchProjects()
})

async function discoverProjects() {
  await projectStore.discoverAndRefresh()
}

async function syncProject() {
  await projectStore.syncSelectedProject()
}

function formatDate(value: string | null): string {
  if (!value) {
    return '—'
  }
  return new Date(value).toLocaleString()
}
</script>

<template>
  <div class="projects-page">
    <div class="header-row">
      <h1>Projects</h1>
      <button class="btn btn-primary" :disabled="projectStore.loading" @click="discoverProjects">
        {{ projectStore.loading ? 'Refreshing…' : 'Discover / Refresh' }}
      </button>
    </div>

    <p v-if="projectStore.error" class="error">{{ projectStore.error }}</p>
    <p v-if="projectStore.lastDiscover" class="status">
      Discovery: {{ projectStore.lastDiscover.discovered_projects }} found,
      {{ projectStore.lastDiscover.imported_projects }} imported,
      {{ projectStore.lastDiscover.marked_missing_projects }} marked missing.
    </p>

    <div class="content-grid">
      <section class="project-list">
        <h2>Available Projects</h2>
        <p v-if="!projectStore.projects.length" class="empty">No projects found yet.</p>
        <ul v-else>
          <li v-for="project in projectStore.projects" :key="project.id">
            <button
              class="project-item"
              :class="{ active: project.id === projectStore.selectedProjectId }"
              @click="projectStore.selectProject(project.id)"
            >
              <span class="project-name">{{ project.name }}</span>
              <span v-if="project.missing_at" class="missing-pill">Missing</span>
            </button>
          </li>
        </ul>
      </section>

      <section class="project-details">
        <h2>Project Details</h2>
        <p v-if="!selectedProject" class="empty">Select a project to inspect metadata.</p>
        <div v-else class="details-card">
          <dl>
            <div class="row">
              <dt>Folder</dt>
              <dd>{{ selectedProject.folder_name }}</dd>
            </div>
            <div class="row">
              <dt>Trigger Tag</dt>
              <dd>{{ selectedProject.trigger_tag }}</dd>
            </div>
            <div class="row">
              <dt>Class Tag</dt>
              <dd>{{ selectedProject.class_tag }}</dd>
            </div>
            <div class="row">
              <dt>Dataset Path</dt>
              <dd>{{ selectedProject.dataset_path }}</dd>
            </div>
            <div class="row">
              <dt>Last Synced</dt>
              <dd>{{ formatDate(selectedProject.last_synced_at) }}</dd>
            </div>
            <div class="row">
              <dt>Status</dt>
              <dd>{{ selectedProject.missing_at ? 'Missing' : 'Present' }}</dd>
            </div>
          </dl>

          <button class="btn btn-secondary" :disabled="projectStore.syncing" @click="syncProject">
            {{ projectStore.syncing ? 'Syncing…' : 'Sync Project' }}
          </button>

          <p v-if="projectStore.lastSync" class="status">
            Sync: +{{ projectStore.lastSync.added_images }} added,
            -{{ projectStore.lastSync.removed_images }} removed,
            {{ projectStore.lastSync.restored_images }} restored.
          </p>
        </div>
      </section>
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
.project-details {
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

.details-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

dl {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 0.5rem;
}

dt {
  color: #555;
  font-weight: 600;
}

dd {
  color: #222;
  word-break: break-word;
}

@media (min-width: 800px) {
  .content-grid {
    grid-template-columns: 1fr 1.2fr;
  }
}
</style>
