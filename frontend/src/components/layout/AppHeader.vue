<script setup lang="ts">
import type { Project } from '../../api'
import AppMenubar, { type AppMenubarMenu } from '../../design-system/AppMenubar.vue'
import AppButton from '../ui/AppButton.vue'
import AppSectionTitle from '../ui/AppSectionTitle.vue'
import AppText from '../ui/AppText.vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{
  projectName?: string
  projects: Project[]
  selectedProjectId: string | null
  openViews: {
    imageBrowser: boolean
    canvas: boolean
    currentTags: boolean
    aiProposedTags: boolean
    tagsLibrary: boolean
    projectDetails: boolean
  }
  loading?: boolean
  projectPickerOpen?: boolean
  overflowOpen?: boolean
}>()

const emit = defineEmits<{
  openProjectPicker: []
  openOverflow: []
  refreshProjects: []
  selectProject: [projectId: string]
  toggleView: [
    view: 'image-browser' | 'canvas' | 'current-tags' | 'ai-proposed-tags' | 'tags-library' | 'project-details',
  ]
}>()

const projectMenu = computed<AppMenubarMenu>(() => ({
  label: 'Project',
  value: 'project',
  items: [
    {
      label: props.loading ? 'Refreshing...' : 'Refresh projects',
      value: 'refresh-projects',
      disabled: Boolean(props.loading),
    },
    ...props.projects.map((project, index) => ({
      label: project.name,
      value: `select-project:${project.id}`,
      separatorBefore: index === 0,
      selected: project.id === props.selectedProjectId,
    })),
  ],
}))

const viewsMenu = computed<AppMenubarMenu>(() => ({
  label: 'Views',
  value: 'views',
  items: [
    {
      label: 'Image browser',
      value: 'toggle-image-browser',
      selected: props.openViews.imageBrowser,
    },
    {
      label: 'Image canvas',
      value: 'toggle-canvas',
      selected: props.openViews.canvas,
    },
    {
      label: 'Current tags',
      value: 'toggle-current-tags',
      selected: props.openViews.currentTags,
    },
    {
      label: 'AI proposed tags',
      value: 'toggle-ai-proposed-tags',
      selected: props.openViews.aiProposedTags,
    },
    {
      label: 'Tags library',
      value: 'toggle-tags',
      selected: props.openViews.tagsLibrary,
    },
    {
      label: 'Project details',
      value: 'toggle-project-details',
      selected: props.openViews.projectDetails,
    },
  ],
}))

const desktopMenus = computed<readonly AppMenubarMenu[]>(() => [projectMenu.value, viewsMenu.value])
const isDesktopViewport = ref(false)

function updateViewportState() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    isDesktopViewport.value = false
    return
  }
  isDesktopViewport.value = window.matchMedia('(min-width: 1024px)').matches
}

onMounted(() => {
  updateViewportState()
  window.addEventListener('resize', updateViewportState)
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateViewportState)
  }
})

function handleDesktopMenuSelect(payload: { menuValue: string; itemValue: string }): void {
  if (payload.menuValue === 'project') {
    if (payload.itemValue === 'refresh-projects') {
      emit('refreshProjects')
      return
    }

    const prefix = 'select-project:'
    if (payload.itemValue.startsWith(prefix)) {
      emit('selectProject', payload.itemValue.slice(prefix.length))
    }
    return
  }

  if (payload.menuValue !== 'views') {
    return
  }

  if (payload.itemValue === 'toggle-image-browser') {
    emit('toggleView', 'image-browser')
    return
  }

  if (payload.itemValue === 'toggle-canvas') {
    emit('toggleView', 'canvas')
    return
  }

  if (payload.itemValue === 'toggle-current-tags') {
    emit('toggleView', 'current-tags')
    return
  }

  if (payload.itemValue === 'toggle-ai-proposed-tags') {
    emit('toggleView', 'ai-proposed-tags')
    return
  }

  if (payload.itemValue === 'toggle-tags') {
    emit('toggleView', 'tags-library')
    return
  }

  if (payload.itemValue === 'toggle-project-details') {
    emit('toggleView', 'project-details')
  }
}
</script>

<template>
  <header class="sticky top-0 z-[110] bg-[var(--tf-color-header-bg)] px-[0.8rem] py-[0.65rem] text-[var(--tf-color-header-text)] lg:px-4 lg:py-[0.8rem]">
    <div
      v-if="!isDesktopViewport"
      class="grid grid-cols-[auto_1fr_auto] items-center gap-3"
    >
      <AppButton
        aria-label="Open project picker"
        aria-haspopup="menu"
        :aria-expanded="projectPickerOpen ? 'true' : 'false'"
        @click="$emit('openProjectPicker')"
      >
        ☰
      </AppButton>

      <div class="min-w-0 lg:justify-self-end lg:text-right">
        <AppText class="text-[0.7rem] text-white/75">
          Current project
        </AppText>
        <AppSectionTitle
          as="h1"
          class="truncate text-[0.95rem] text-white lg:text-base"
        >
          {{ projectName || 'No project selected' }}
        </AppSectionTitle>
      </div>

      <AppButton
        aria-label="Open workspace actions"
        aria-haspopup="menu"
        :aria-expanded="overflowOpen ? 'true' : 'false'"
        @click="$emit('openOverflow')"
      >
        ⋮
      </AppButton>
    </div>

    <div
      v-else
      class="items-stretch justify-between gap-3 lg:flex"
    >
      <AppMenubar
        class="inline-flex self-stretch"
        :menus="desktopMenus"
        aria-label="Workspace desktop menu bar"
        @select="handleDesktopMenuSelect"
      />

      <div class="min-w-0 text-right">
        <AppText class="text-[0.7rem] text-white/75">
          Current project
        </AppText>
        <AppSectionTitle
          as="h1"
          class="truncate text-[0.95rem] text-white lg:text-base"
        >
          {{ projectName || 'No project selected' }}
        </AppSectionTitle>
      </div>
    </div>
  </header>
</template>
