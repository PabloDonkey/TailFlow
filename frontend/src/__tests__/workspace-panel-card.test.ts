import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import WorkspacePanelCard from '../components/layout/WorkspacePanelCard.vue'

describe('WorkspacePanelCard', () => {
  it('hides drag button when draggable is false', () => {
    const wrapper = mount(WorkspacePanelCard, {
      props: {
        title: 'Image Canvas',
        draggable: false,
      },
    })

    const dragButton = wrapper.find('button[aria-label="Drag Image Canvas panel"]')
    expect(dragButton.exists()).toBe(false)
  })

  it('shows drag button when draggable is true', () => {
    const wrapper = mount(WorkspacePanelCard, {
      props: {
        title: 'Current Tags',
        draggable: true,
      },
    })

    const dragButton = wrapper.find('button[aria-label="Drag Current Tags panel"]')
    expect(dragButton.exists()).toBe(true)
  })
})
