<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  configureOnboardingProjectsRootPath,
  getOnboardingStatus,
  type ProjectOnboardingStatus,
} from '../api'

const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const projectsRootPath = ref('')
const status = ref<ProjectOnboardingStatus | null>(null)
const projectsRootPathInput = ref<HTMLInputElement | null>(null)

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    const onboardingStatus = await getOnboardingStatus()
    status.value = onboardingStatus

    if (onboardingStatus.configured) {
      await router.replace('/workspace')
      return
    }

    setProjectsRootPath(
      onboardingStatus.projects_root_path ?? onboardingStatus.default_projects_root_path,
    )
  } catch (e) {
    error.value = String(e)
  } finally {
    loading.value = false
  }
})

function setProjectsRootPath(value: string) {
  projectsRootPath.value = value
  if (projectsRootPathInput.value) {
    projectsRootPathInput.value.value = value
  }
}

async function saveProjectsRootPath() {
  error.value = null
  const value = projectsRootPath.value.trim()

  if (!value) {
    error.value = 'Project path is required.'
    return
  }

  saving.value = true
  try {
    await configureOnboardingProjectsRootPath(value)
    await router.replace('/workspace')
  } catch (e) {
    error.value = String(e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="onboarding-page">
    <h1>TailFlow Onboarding</h1>

    <p class="description">
      Configure the server project root path used for discovery and dataset folders.
    </p>

    <p
      v-if="loading"
      class="status"
    >
      Loading configuration…
    </p>

    <div
      v-else
      class="card"
    >
      <label>
        Project Root Path
        <input
          ref="projectsRootPathInput"
          v-model="projectsRootPath"
          type="text"
          placeholder="/home/user/tailflow"
        >
      </label>

      <div class="actions">
        <button
          class="btn btn-primary"
          :disabled="saving"
          @click="saveProjectsRootPath"
        >
          {{ saving ? 'Saving…' : 'Save and Continue' }}
        </button>
      </div>

      <p
        v-if="status"
        class="hint"
      >
        Suggested default: {{ status.default_projects_root_path }}
      </p>

      <p
        v-if="error"
        class="error"
      >
        {{ error }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.onboarding-page {
  display: grid;
  gap: 1rem;
}

.description {
  color: #444;
}

.card {
  display: grid;
  gap: 0.75rem;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
}

label {
  display: grid;
  gap: 0.4rem;
  font-weight: 600;
}

input {
  border: 1px solid #bbb;
  border-radius: 6px;
  padding: 0.55rem 0.65rem;
  font: inherit;
}

.actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn {
  border: none;
  border-radius: 6px;
  padding: 0.6rem 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background: #4a4e8a;
  color: #fff;
}

.hint {
  color: #555;
  font-size: 0.9rem;
}

.status {
  color: #333;
}

.error {
  color: #b42318;
}
</style>
