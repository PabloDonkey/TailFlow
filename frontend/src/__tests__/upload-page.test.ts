import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import UploadPage from '../pages/UploadPage.vue'

const mocks = vi.hoisted(() => ({
  projectStore: {
    selectedProject: {
      id: 'project-1',
      name: 'Project One',
      folder_name: 'project-one',
      root_path: '/tmp/projects',
      dataset_path: '/tmp/projects/project-one/dataset',
      trigger_tag: 'trigger-old',
      class_tag: 'class-old',
      tagging_mode: 'e621',
      last_synced_at: null,
      missing_at: null,
    },
    projects: [],
    selectedProjectId: 'project-1',
    loading: false,
    syncing: false,
    creating: false,
    updating: false,
    uploading: false,
    error: null as string | null,
    lastDiscover: null,
    lastSync: null,
    lastCreate: null,
    lastUpload: null,
    fetchProjects: vi.fn().mockResolvedValue(undefined),
    discoverAndRefresh: vi.fn().mockResolvedValue(undefined),
    syncSelectedProject: vi.fn().mockResolvedValue(undefined),
    createProject: vi.fn().mockResolvedValue({ project: { id: 'created-project' } }),
    uploadImagesToSelectedProject: vi.fn().mockResolvedValue(undefined),
    updateSelectedProjectMetadata: vi.fn().mockResolvedValue({ id: 'project-1' }),
    selectProject: vi.fn(),
  },
}))

vi.mock('../stores/projects', () => ({
  useProjectStore: () => mocks.projectStore,
}))

describe('UploadPage', () => {
  beforeEach(() => {
    mocks.projectStore.fetchProjects.mockClear()
    mocks.projectStore.createProject.mockClear()
    mocks.projectStore.updateSelectedProjectMetadata.mockClear()
  })

  it('sends the selected tagging mode when creating a project', async () => {
    const wrapper = mount(UploadPage)
    await flushPromises()

    const textInputs = wrapper.findAll('input[type="text"]')
    await textInputs[0]!.setValue('booru-project')
    await textInputs[1]!.setValue('character')
    await wrapper.get('[data-testid="create-tagging-mode"]').setValue('booru')
    await wrapper.findAll('button.btn.btn-primary')[1]!.trigger('click')

    expect(mocks.projectStore.createProject).toHaveBeenCalledWith({
      folder_name: 'booru-project',
      class_tag: 'character',
      name: undefined,
      trigger_tag: undefined,
      tagging_mode: 'booru',
    })
  })

  it('saves tagging mode updates in project metadata', async () => {
    const wrapper = mount(UploadPage)
    await flushPromises()

    await wrapper.get('[data-testid="edit-tagging-mode"]').setValue('booru')
    const buttons = wrapper.findAll('button.btn.btn-secondary')
    await buttons[1]!.trigger('click')

    expect(mocks.projectStore.updateSelectedProjectMetadata).toHaveBeenCalledWith({
      trigger_tag: 'trigger-old',
      class_tag: 'class-old',
      tagging_mode: 'booru',
    })
  })
})