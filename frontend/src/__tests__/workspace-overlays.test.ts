import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ViewsMenu from '../components/header/ViewsMenu.vue'
import ProjectPickerPanel from '../components/header/ProjectPickerPanel.vue'

describe('Workspace overlays', () => {
  it('keeps project picker positioned below header and closes on backdrop click', async () => {
    const wrapper = mount(ProjectPickerPanel, {
      props: {
        projects: [],
        selectedProjectId: null,
        loading: false,
        error: null,
      },
    })

    expect(wrapper.classes()).toContain('top-[3.7rem]')

    const closeBackdrop = wrapper.get('button[aria-label="Close project picker"]')
    expect(closeBackdrop.classes()).toContain('lg:bg-transparent')
    expect(closeBackdrop.classes()).not.toContain('lg:hidden')

    await closeBackdrop.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('keeps workspace actions menu below header and closes on backdrop click', async () => {
    const wrapper = mount(ViewsMenu, {
      props: {
        openViews: {
          imageBrowser: true,
          canvas: true,
          currentTags: true,
          aiProposedTags: true,
          tagsLibrary: false,
          projectDetails: false,
        },
      },
    })

    expect(wrapper.classes()).toContain('top-[3.7rem]')

    const closeBackdrop = wrapper.get('[data-testid="workspace-actions-backdrop"]')
    expect(closeBackdrop.classes()).toContain('lg:bg-transparent')
    expect(closeBackdrop.classes()).not.toContain('lg:hidden')

    await closeBackdrop.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
