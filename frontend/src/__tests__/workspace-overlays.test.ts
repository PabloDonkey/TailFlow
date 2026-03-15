import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import WorkspaceActionsMenu from '../components/layout/WorkspaceActionsMenu.vue'
import WorkspaceProjectPickerPanel from '../components/sidebar/WorkspaceProjectPickerPanel.vue'

describe('Workspace overlays', () => {
  it('keeps project picker positioned below header and closes on backdrop click', async () => {
    const wrapper = mount(WorkspaceProjectPickerPanel, {
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
    const wrapper = mount(WorkspaceActionsMenu, {
      props: {
        activeRightPanel: 'inspector',
      },
    })

    expect(wrapper.classes()).toContain('top-[3.7rem]')

    const closeBackdrop = wrapper.get('button[aria-label="Close workspace actions"]')
    expect(closeBackdrop.classes()).toContain('lg:bg-transparent')
    expect(closeBackdrop.classes()).not.toContain('lg:hidden')

    await closeBackdrop.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
