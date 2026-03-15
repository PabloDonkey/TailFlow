import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ProjectCreateModal from '../components/projects/ProjectCreateModal.vue'

const mocks = vi.hoisted(() => ({
  projectStore: {
    creating: false,
    error: null as string | null,
    createProject: vi.fn().mockResolvedValue({
      project: {
        id: 'created-project-id',
      },
    }),
  },
}))

vi.mock('../stores/projects', () => ({
  useProjectStore: () => mocks.projectStore,
}))

describe('ProjectCreateModal', () => {
  beforeEach(() => {
    mocks.projectStore.createProject.mockClear()
    mocks.projectStore.error = null
  })

  it('shows validation error when required fields are missing', async () => {
    const wrapper = mount(ProjectCreateModal)

    const createButton = wrapper.findAll('button').find((button) => button.text().includes('Create Project'))
    expect(createButton).toBeDefined()
    await createButton!.trigger('click')

    expect(wrapper.text()).toContain('Folder name is required.')
    expect(mocks.projectStore.createProject).not.toHaveBeenCalled()
  })

  it('submits payload and emits created on success', async () => {
    const wrapper = mount(ProjectCreateModal)

    const textInputs = wrapper.findAll('input[type="text"]')
    await textInputs[0]!.setValue('new-project')
    await textInputs[1]!.setValue('character')
    await wrapper.get('[data-testid="modal-create-tagging-mode"]').setValue('booru')

    const createButton = wrapper.findAll('button').find((button) => button.text().includes('Create Project'))
    expect(createButton).toBeDefined()
    await createButton!.trigger('click')
    await flushPromises()

    expect(mocks.projectStore.createProject).toHaveBeenCalledWith({
      folder_name: 'new-project',
      class_tag: 'character',
      name: undefined,
      trigger_tag: undefined,
      tagging_mode: 'booru',
    })

    expect(wrapper.emitted('created')?.[0]).toEqual(['created-project-id'])
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
