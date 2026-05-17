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

    const rows = wrapper.findAll('li')
    expect(rows).toHaveLength(1)
    expect(wrapper.text()).toContain('close-up')
    expect(wrapper.text()).not.toContain('portrait')

    wrapper.unmount()
    vi.useRealTimers()
  })
})
