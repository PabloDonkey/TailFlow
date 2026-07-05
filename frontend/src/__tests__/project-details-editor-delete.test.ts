import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProjectDetailsEditor from '../cards/project-details/components/ProjectDetailsEditor.vue'

const mocks = vi.hoisted(() => ({
  projectStore: {
    syncing: false,
    updating: false,
    uploading: false,
    deleting: false,
    error: null as string | null,
    lastSync: null,
    lastUpload: null,
    syncSelectedProject: vi.fn(),
    uploadImagesToSelectedProject: vi.fn(),
    updateSelectedProjectMetadata: vi.fn(),
    fetchProjects: vi.fn(),
    deleteProject: vi.fn(),
  },
  applyProjectDatasetRename: vi.fn(),
  previewProjectDatasetRename: vi.fn(),
}))

vi.mock('../stores/projects', () => ({
  useProjectStore: () => mocks.projectStore,
}))

vi.mock('../stores/images', () => ({
  useImageStore: () => ({
    fetchImages: vi.fn(),
    fetchImage: vi.fn(),
  }),
}))

vi.mock('../api', () => ({
  applyProjectDatasetRename: mocks.applyProjectDatasetRename,
  previewProjectDatasetRename: mocks.previewProjectDatasetRename,
}))

vi.mock('pinia', async () => {
  const actual = await vi.importActual<typeof import('pinia')>('pinia')
  return {
    ...actual,
    getActivePinia: () => null,
  }
})

const AlertDialogStub = defineComponent({
  name: 'AppAlertDialog',
  props: {
    open: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['confirm', 'update:open'],
  template: `
    <div data-testid="delete-project-confirm" :data-open="open ? 'true' : 'false'">
      <button data-testid="confirm-delete-project" @click="$emit('confirm')">confirm-delete</button>
    </div>
  `,
})

const selectedProject = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Delete Target',
  folder_name: 'delete-target',
  root_path: '/tmp/projects',
  dataset_path: '/tmp/projects/delete-target/dataset',
  trigger_tag: 'delete-target',
  class_tag: 'subject',
  tagging_mode: 'e621' as const,
  featured_image_id: null,
  preview_image: null,
  last_synced_at: null,
  missing_at: null,
}

describe('ProjectDetailsEditor delete project flow', () => {
  beforeEach(() => {
    mocks.projectStore.syncSelectedProject.mockReset()
    mocks.projectStore.uploadImagesToSelectedProject.mockReset()
    mocks.projectStore.updateSelectedProjectMetadata.mockReset()
    mocks.projectStore.fetchProjects.mockReset()
    mocks.projectStore.deleteProject.mockReset()
    mocks.projectStore.error = null

    mocks.applyProjectDatasetRename.mockReset()
    mocks.previewProjectDatasetRename.mockReset()
  })

  it('opens a confirmation dialog before deleting and deletes on confirm', async () => {
    mocks.projectStore.deleteProject.mockResolvedValue(true)

    const wrapper = mount(ProjectDetailsEditor, {
      props: {
        selectedProject,
      },
      global: {
        stubs: {
          AppAlertDialog: AlertDialogStub,
        },
      },
    })

    const deleteButton = wrapper.findAll('button').find((button) => button.text().includes('Delete Project'))
    expect(deleteButton).toBeDefined()

    await deleteButton!.trigger('click')
    expect(wrapper.get('[data-testid="delete-project-confirm"]').attributes('data-open')).toBe('true')

    await wrapper.get('[data-testid="confirm-delete-project"]').trigger('click')
    await nextTick()

    expect(mocks.projectStore.deleteProject).toHaveBeenCalledWith(selectedProject.id)
  })

  it('shows an error if delete fails', async () => {
    mocks.projectStore.error = 'API 500: deletion failed'
    mocks.projectStore.deleteProject.mockResolvedValue(false)

    const wrapper = mount(ProjectDetailsEditor, {
      props: {
        selectedProject,
      },
      global: {
        stubs: {
          AppAlertDialog: AlertDialogStub,
        },
      },
    })

    const deleteButton = wrapper.findAll('button').find((button) => button.text().includes('Delete Project'))
    expect(deleteButton).toBeDefined()

    await deleteButton!.trigger('click')
    await wrapper.get('[data-testid="confirm-delete-project"]').trigger('click')
    await nextTick()

    expect(wrapper.text()).toContain('API 500: deletion failed')
  })
})
