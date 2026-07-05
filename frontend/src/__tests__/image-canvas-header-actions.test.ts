import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ImageCanvasHeaderActions from '../cards/image-canvas/ImageCanvasHeaderActions.vue'

describe('ImageCanvasHeaderActions', () => {
  it('emits setFeaturedImage when selecting set-as-featured action', async () => {
    const wrapper = mount(ImageCanvasHeaderActions, {
      props: {
        currentImageExists: true,
        currentImageIsFeatured: false,
        loading: false,
      },
    })

    await wrapper.get('button[aria-label="Open canvas image actions menu"]').trigger('click')
    const featuredButton = wrapper.findAll('button').find((button) => button.text().includes('Set as featured image'))
    expect(featuredButton).toBeDefined()
    await featuredButton!.trigger('click')

    expect(wrapper.emitted('setFeaturedImage')).toHaveLength(1)
  })

  it('shows checked state and disables set-as-featured action when already featured', async () => {
    const wrapper = mount(ImageCanvasHeaderActions, {
      props: {
        currentImageExists: true,
        currentImageIsFeatured: true,
        loading: false,
      },
    })

    await wrapper.get('button[aria-label="Open canvas image actions menu"]').trigger('click')

    const featuredButton = wrapper.findAll('button').find((button) => button.text().includes('Set as featured image'))
    expect(featuredButton).toBeDefined()
    expect(featuredButton!.attributes('disabled')).toBeDefined()
    expect(wrapper.get('[aria-label="Current image is featured"]').text()).toBe('[x]')
  })
})
