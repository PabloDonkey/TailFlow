import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import AiProposedTagsCard from '../cards/ai-proposed-tags/AiProposedTagsCard.vue'

const mocks = vi.hoisted(() => ({
  classifyProjectImage: vi.fn(),
}))

vi.mock('../api', () => ({
  classifyProjectImage: mocks.classifyProjectImage,
}))

async function flushUi(): Promise<void> {
  await Promise.resolve()
  await nextTick()
}

describe('AiProposedTagsCard filter', () => {
  it('filters visible proposed tags using shared search matching', async () => {
    vi.useFakeTimers()
    mocks.classifyProjectImage.mockResolvedValue({
      suggestions: [
        { name: 'close-up', confidence: 0.91 },
        { name: 'portrait', confidence: 0.88 },
      ],
      model_id: 'jtp-3-hydra',
      model_available: true,
      download_progress_percent: 100,
      download_proposal_url: null,
      download_message: null,
    })

    const wrapper = mount(AiProposedTagsCard, {
      props: {
        projectId: '11111111-1111-1111-1111-111111111111',
        imageId: '22222222-2222-2222-2222-222222222222',
        mode: 'booru',
        currentTags: [],
        getTagRoleLabel: () => null,
      },
      attachTo: document.body,
    })

    await vi.advanceTimersByTimeAsync(250)
    await flushUi()

    const input = wrapper.get('input[aria-label="Filter proposed tags"]')
    await input.setValue('close up')
    await flushUi()

    const chips = wrapper.findAll('[data-testid="tag-chip"]')
    expect(chips).toHaveLength(1)
    expect(wrapper.text()).toContain('close-up')
    expect(chips[0]?.text()).toContain('| 91%')
    expect(wrapper.text()).not.toContain('portrait')

    await chips[0]!.trigger('click')
    expect(wrapper.emitted('add')?.[0]).toEqual(['close-up'])

    wrapper.unmount()
    vi.useRealTimers()
  })

  it('toggles selected/all views with one selected control and emits remove for selected chip clicks', async () => {
    vi.useFakeTimers()
    mocks.classifyProjectImage.mockResolvedValue({
      suggestions: [
        { name: 'close-up', confidence: 0.91 },
        { name: 'portrait', confidence: 0.88 },
      ],
      model_id: 'jtp-3-hydra',
      model_available: true,
      download_progress_percent: 100,
      download_proposal_url: null,
      download_message: null,
    })

    const wrapper = mount(AiProposedTagsCard, {
      props: {
        projectId: '11111111-1111-1111-1111-111111111111',
        imageId: '22222222-2222-2222-2222-222222222222',
        mode: 'booru',
        currentTags: [
          {
            id: '33333333-3333-3333-3333-333333333333',
            name: 'close-up',
            catalog_ids: {},
            category: null,
            position: 2,
            is_protected: false,
          },
        ],
        getTagRoleLabel: () => null,
      },
      attachTo: document.body,
    })

    await vi.advanceTimersByTimeAsync(250)
    await flushUi()

    expect(wrapper.text()).toContain('Selected: 1/2')

    const selectedToggle = wrapper.get('button[aria-label="Toggle selected proposed tags filter"]')
    await selectedToggle.trigger('click')
    await flushUi()

    let chips = wrapper.findAll('[data-testid="tag-chip"]')
    expect(chips).toHaveLength(1)
    expect(chips[0]?.text()).toContain('close-up')

    await chips[0]!.trigger('click')
    expect(wrapper.emitted('remove')?.[0]).toEqual(['close-up'])

    await selectedToggle.trigger('click')
    await flushUi()

    chips = wrapper.findAll('[data-testid="tag-chip"]')
    expect(chips).toHaveLength(2)

    wrapper.unmount()
    vi.useRealTimers()
  })
})
