import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import CurrentTagsList from '../cards/current-tags/components/CurrentTagsList.vue'
import type { ProjectTag } from '../api'

function createTag(id: string, name: string): ProjectTag {
  return {
    id,
    name,
    catalog_ids: {},
    category: null,
    position: 2,
    is_protected: false,
  }
}

describe('CurrentTagsList filter', () => {
  it('filters displayed tags using shared search matching', async () => {
    const wrapper = mount(CurrentTagsList, {
      props: {
        tags: [
          createTag('11111111-1111-1111-1111-111111111111', 'close-up'),
          createTag('22222222-2222-2222-2222-222222222222', 'portrait'),
        ],
        getTagRoleLabel: () => null,
        getTagSourceLabel: () => null,
        showFilter: true,
        showTags: true,
        showCopyButton: true,
      },
    })

    const input = wrapper.get('input[aria-label="Filter current tags"]')
    await input.setValue('close up')

    const chips = wrapper.findAll('[data-testid="tag-chip"]')
    expect(chips).toHaveLength(1)
    expect(wrapper.text()).toContain('close-up')
    expect(wrapper.text()).not.toContain('portrait')
  })

  it('copies all current tags as a comma-separated string', async () => {
    const writeText = vi.fn(async () => undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    const wrapper = mount(CurrentTagsList, {
      props: {
        tags: [
          createTag('11111111-1111-1111-1111-111111111111', 'close-up'),
          createTag('22222222-2222-2222-2222-222222222222', 'full-lenght_portrait'),
        ],
        getTagRoleLabel: () => null,
        getTagSourceLabel: () => null,
        showFilter: true,
        showTags: true,
        showCopyButton: true,
      },
    })

    const copyButton = wrapper.get('button[aria-label="Copy current tags"]')
    await copyButton.trigger('click')

    expect(writeText).toHaveBeenCalledWith('close-up,full-lenght_portrait')
  })
})
