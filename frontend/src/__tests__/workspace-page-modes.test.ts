import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import WorkspacePage from '../pages/WorkspacePage.vue'

const mocks = vi.hoisted(() => ({
  projectStore: {
    selectedProject: null,
    projects: [],
    selectedProjectId: null as string | null,
    loading: false,
    error: null as string | null,
    fetchProjects: vi.fn().mockResolvedValue(undefined),
    selectProject: vi.fn(),
  },
  imageStore: {
    images: [],
    sortOption: 'name-asc',
    currentImage: null,
    imageLoading: false,
    error: null as string | null,
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: {
      panel: 'tags',
    },
  }),
}))

vi.mock('../stores/projects', () => ({
  useProjectStore: () => mocks.projectStore,
}))

vi.mock('../stores/images', () => ({
  useImageStore: () => mocks.imageStore,
}))

vi.mock('../composables/useWorkspaceImages', () => ({
  useWorkspaceImages: () => ({
    orderedImages: ref([]),
    currentImageIndex: ref(-1),
    previousAvailable: ref(false),
    nextAvailable: ref(false),
    selectImage: vi.fn().mockResolvedValue(undefined),
    goToImageByIndex: vi.fn().mockResolvedValue(undefined),
    goToPreviousImage: vi.fn().mockResolvedValue(undefined),
    goToNextImage: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('../composables/useWorkspaceHeaderActions', () => ({
  useWorkspaceHeaderActions: () => ({
    refreshProjects: vi.fn().mockResolvedValue(undefined),
    selectProjectFromPicker: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('../composables/useWorkspaceOverlayState', () => ({
  useWorkspaceOverlayState: (options: { activeRightPanel: { value: 'inspector' | 'tags' | 'projects' } }) => ({
    showMobilePanel: ref(false),
    mobilePanel: ref<'browser' | 'inspector' | 'tags' | 'projects'>('browser'),
    showProjectPicker: ref(false),
    showActionsMenu: ref(false),
    openMobilePanel: vi.fn(),
    closeMobilePanel: vi.fn(),
    openProjectPicker: vi.fn(),
    openOverflow: vi.fn(),
    closeActionsMenu: vi.fn(),
    closeProjectPicker: vi.fn(),
    showTagsLibraryPanel: () => {
      options.activeRightPanel.value = 'tags'
    },
    showTagInspectorPanel: () => {
      options.activeRightPanel.value = 'inspector'
    },
    showProjectsPanel: () => {
      options.activeRightPanel.value = 'projects'
    },
  }),
}))

describe('WorkspacePage modes', () => {
  it('renders full-width tag-library mode when panel query is tags', async () => {
    const wrapper = mount(WorkspacePage, {
      global: {
        stubs: {
          AppShell: { template: '<div><slot name="header" /><slot /></div>' },
          WorkspaceHeaderSection: { template: '<div data-testid="workspace-header" />' },
          WorkspaceLayout: { template: '<div data-testid="workspace-layout"><slot name="left" /><slot /><slot name="right" /></div>' },
          WorkspaceImageBrowserPanel: { template: '<div data-testid="image-browser" />' },
          WorkspaceImageViewerPanel: { template: '<div data-testid="image-viewer" />' },
          WorkspaceRightPanel: { template: '<div data-testid="right-panel" />' },
          WorkspaceMobileQuickActions: { template: '<div data-testid="mobile-quick-actions" />' },
          WorkspaceMobilePanelSheet: { template: '<div data-testid="mobile-panel-sheet"><slot /></div>' },
          WorkspaceMobilePanelContent: { template: '<div data-testid="mobile-panel-content" />' },
          WorkspaceTagsLibraryPanel: { template: '<div data-testid="tags-library-panel" />' },
          ProjectBrowserPanel: { template: '<div data-testid="project-browser" />' },
          ProjectCreateModal: { template: '<div data-testid="project-create-modal" />' },
        },
      },
    })

    await nextTick()

    expect(wrapper.find('[data-testid="tags-library-panel"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="workspace-layout"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="mobile-quick-actions"]').exists()).toBe(false)
  })
})
