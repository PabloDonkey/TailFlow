<script setup lang="ts">
import type { Project } from '../../api'
import AppMenubar, { type AppMenubarMenu } from '../../design-system/AppMenubar.vue'
import AppButton from '../ui/AppButton.vue'
import AppSectionTitle from '../ui/AppSectionTitle.vue'
import AppText from '../ui/AppText.vue'
import { computed } from 'vue'

const props = defineProps<{
  projectName?: string
  projects: Project[]
  selectedProjectId: string | null
  activeRightPanel: 'inspector' | 'tags' | 'projects'
  loading?: boolean
  projectPickerOpen?: boolean
  overflowOpen?: boolean
}>()

const emit = defineEmits<{
  openProjectPicker: []
  openOverflow: []
  refreshProjects: []
  selectProject: [projectId: string]
  showTagsLibraryPanel: []
  showTagInspectorPanel: []
  showProjectsPanel: []
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
      label: 'Tag inspector',
      value: 'show-inspector',
      selected: props.activeRightPanel === 'inspector',
    },
    {
      label: 'Tags library',
      value: 'show-tags',
      selected: props.activeRightPanel === 'tags',
    },
    {
      label: 'Project manager',
      value: 'show-projects',
      selected: props.activeRightPanel === 'projects',
    },
  ],
}))

const desktopMenus = computed<readonly AppMenubarMenu[]>(() => [projectMenu.value, viewsMenu.value])

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

  if (payload.itemValue === 'show-tags') {
    emit('showTagsLibraryPanel')
    return
  }

  if (payload.itemValue === 'show-inspector') {
    emit('showTagInspectorPanel')
    return
  }

  if (payload.itemValue === 'show-projects') {
    emit('showProjectsPanel')
  }
}
</script>

<template>
  <header class="sticky top-0 z-[110] bg-[var(--tf-color-header-bg)] px-[0.8rem] py-[0.65rem] text-[var(--tf-color-header-text)] lg:px-4 lg:py-[0.8rem]">
    <div class="grid grid-cols-[auto_1fr_auto] items-center gap-3 lg:hidden">
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

    <div class="hidden items-stretch justify-between gap-3 lg:flex">
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
