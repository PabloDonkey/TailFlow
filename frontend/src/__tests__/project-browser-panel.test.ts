import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import ProjectBrowserPanel from '../components/projects/ProjectBrowserPanel.vue'

const mocks = vi.hoisted(() => ({
  listProjectImages: vi.fn().mockResolvedValue([]),
  getProjectImageFileUrl: vi.fn().mockReturnValue('/api/projects/preview.png'),
}))

vi.mock('../api', () => ({
  listProjectImages: mocks.listProjectImages,
  getProjectImageFileUrl: mocks.getProjectImageFileUrl,
}))

describe('ProjectBrowserPanel', () => {
  it('renders project cards sorted by name and emits selection', async () => {
    mocks.listProjectImages.mockResolvedValue([{ id: 'img-1' }])

    const wrapper = mount(ProjectBrowserPanel, {
      props: {
        projects: [
          {
            id: '2',
            name: 'Zeta Project',
            folder_name: 'zeta-project',
            root_path: '/tmp/projects',
            dataset_path: '/tmp/projects/zeta-project/dataset',
            trigger_tag: 'zeta',
            class_tag: 'zeta-class',
            tagging_mode: 'e621',
            last_synced_at: null,
            missing_at: null,
          },
          {
            id: '1',
            name: 'Alpha Project',
            folder_name: 'alpha-project',
            root_path: '/tmp/projects',
            dataset_path: '/tmp/projects/alpha-project/dataset',
            trigger_tag: 'alpha',
            class_tag: 'alpha-class',
            tagging_mode: 'booru',
            last_synced_at: null,
            missing_at: '2026-03-15T16:00:00+00:00',
          },
        ],
        selectedProjectId: '2',
        loading: false,
        discovering: false,
      },
    })

    await nextTick()

    const cardButtons = wrapper.findAll('button.w-full')
    expect(cardButtons).toHaveLength(2)
    expect(cardButtons[0]?.text()).toContain('Alpha Project')
    expect(cardButtons[0]?.text()).toContain('Missing')
    expect(cardButtons[1]?.text()).toContain('Zeta Project')
    expect(cardButtons[1]?.text()).toContain('Active')

    await cardButtons[0]!.trigger('click')
    expect(wrapper.emitted('selectProject')?.[0]).toEqual(['1'])
  })

  it('emits openCreateProject from the top action button', async () => {
    const wrapper = mount(ProjectBrowserPanel, {
      props: {
        projects: [],
        selectedProjectId: null,
        loading: false,
        discovering: false,
      },
    })

    const createButton = wrapper.findAll('button').find((button) => button.text().includes('Create Project'))
    expect(createButton).toBeDefined()
    await createButton!.trigger('click')

    expect(wrapper.emitted('openCreateProject')).toHaveLength(1)
  })

  it('emits discoverProjects from the discover button', async () => {
    const wrapper = mount(ProjectBrowserPanel, {
      props: {
        projects: [],
        selectedProjectId: null,
        loading: false,
        discovering: false,
      },
    })

    const discoverButton = wrapper.findAll('button').find((button) => button.text().includes('Discover'))
    expect(discoverButton).toBeDefined()
    await discoverButton!.trigger('click')

    expect(wrapper.emitted('discoverProjects')).toHaveLength(1)
  })

  it('emits showTagging with project id from a card tagging button', async () => {
    const wrapper = mount(ProjectBrowserPanel, {
      props: {
        projects: [
          {
            id: 'project-a',
            name: 'Alpha Project',
            folder_name: 'alpha-project',
            root_path: '/tmp/projects',
            dataset_path: '/tmp/projects/alpha-project/dataset',
            trigger_tag: 'alpha',
            class_tag: 'alpha-class',
            tagging_mode: 'booru',
            last_synced_at: null,
            missing_at: null,
          },
        ],
        selectedProjectId: null,
        loading: false,
        discovering: false,
      },
    })

    await nextTick()

    const taggingButton = wrapper.findAll('button').find((button) => button.text().trim() === 'Tagging')
    expect(taggingButton).toBeDefined()
    await taggingButton!.trigger('click')

    expect(wrapper.emitted('showTagging')?.[0]).toEqual(['project-a'])
  })
})
