import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
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

describe('WorkspacePage modes', () => {
  it('renders full-width tag-library mode when panel query is tags', async () => {
    const wrapper = mount(WorkspacePage, {
      global: {
        stubs: {
          AppShell: { template: '<div><slot name="header" /><slot /></div>' },
          HeaderSection: { template: '<div data-testid="workspace-header" />' },
          WorkspaceLayout: { template: '<div data-testid="workspace-layout"><slot name="left" /><slot /><slot name="right" /></div>' },
          WorkspacePanelCard: { template: '<div data-testid="panel-card"><slot /></div>' },
          WorkspaceMobileViewsTabs: { template: '<div data-testid="mobile-tabs" />' },
          ImageBrowserCard: { template: '<div data-testid="image-browser" />' },
          ImageCanvasCard: { template: '<div data-testid="image-viewer" />' },
          CurrentTagsCard: { template: '<div data-testid="tag-inspector-panel" />' },
          AiProposedTagsCard: { template: '<div data-testid="ai-proposed-tags-panel" />' },
          ProjectDetailsCard: { template: '<div data-testid="project-details-panel" />' },
          TagsLibraryCard: { template: '<div data-testid="tags-library-panel" />' },
          ProjectBrowserCard: { template: '<div data-testid="project-browser" />' },
          ProjectCreateModal: { template: '<div data-testid="project-create-modal" />' },
        },
      },
    })

    await nextTick()

    expect(wrapper.find('[data-testid="tags-library-panel"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="workspace-layout"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="mobile-tabs"]').exists()).toBe(false)
  })

  it('closes actions menu when toggling a view', async () => {
    const headerStub = defineComponent({
      props: {
        showActionsMenu: {
          type: Boolean,
          required: true,
        },
      },
      emits: [
        'openProjectPicker',
        'openOverflow',
        'closeProjectPicker',
        'refreshProjects',
        'selectProject',
        'closeActionsMenu',
        'toggleView',
      ],
      template: `
        <div data-testid="workspace-header">
          <button data-testid="open-overflow" @click="$emit('openOverflow')" />
          <button data-testid="toggle-tags-library" @click="$emit('toggleView', 'tags-library')" />
          <span data-testid="actions-open">{{ showActionsMenu ? 'open' : 'closed' }}</span>
        </div>
      `,
    })

    const wrapper = mount(WorkspacePage, {
      global: {
        stubs: {
          AppShell: { template: '<div><slot name="header" /><slot /></div>' },
          HeaderSection: headerStub,
          WorkspaceLayout: { template: '<div data-testid="workspace-layout"><slot name="left" /><slot /><slot name="right" /></div>' },
          WorkspacePanelCard: { template: '<div data-testid="panel-card"><slot /></div>' },
          WorkspaceMobileViewsTabs: { template: '<div data-testid="mobile-tabs" />' },
          ImageBrowserCard: { template: '<div data-testid="image-browser" />' },
          ImageCanvasCard: { template: '<div data-testid="image-viewer" />' },
          CurrentTagsCard: { template: '<div data-testid="tag-inspector-panel" />' },
          AiProposedTagsCard: { template: '<div data-testid="ai-proposed-tags-panel" />' },
          ProjectDetailsCard: { template: '<div data-testid="project-details-panel" />' },
          TagsLibraryCard: { template: '<div data-testid="tags-library-panel" />' },
          ProjectBrowserCard: { template: '<div data-testid="project-browser" />' },
          ProjectCreateModal: { template: '<div data-testid="project-create-modal" />' },
        },
      },
    })

    expect(wrapper.get('[data-testid="actions-open"]').text()).toBe('closed')

    await wrapper.get('[data-testid="open-overflow"]').trigger('click')
    await nextTick()
    expect(wrapper.get('[data-testid="actions-open"]').text()).toBe('open')

    await wrapper.get('[data-testid="toggle-tags-library"]').trigger('click')
    await nextTick()
    expect(wrapper.get('[data-testid="actions-open"]').text()).toBe('closed')
  })
})
