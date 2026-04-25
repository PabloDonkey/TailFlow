import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import TagAutocompleteInput from '../design-system/TagAutocompleteInput.vue'

async function flushUi(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 25))
}

describe('TagAutocompleteInput (browser mode)', () => {
  it('calls async fetchSuggestions with the typed query', async () => {
    const fetchSuggestions = vi.fn(async () => ['safe', 'solo'])

    const wrapper = mount(TagAutocompleteInput, {
      props: {
        selectedTags: [],
        fetchSuggestions,
        debounceMs: 0,
      },
      attachTo: document.body,
    })

    const input = wrapper.get('[data-testid="add-tag-input"]')
    await input.setValue('sa')
    await flushUi()

    expect(fetchSuggestions).toHaveBeenCalledWith('sa')
  })

  it('emits select on Enter when query has value', async () => {
    const wrapper = mount(TagAutocompleteInput, {
      props: {
        selectedTags: [],
        fetchSuggestions: async () => [],
        debounceMs: 0,
      },
      attachTo: document.body,
    })

    const input = wrapper.get('[data-testid="add-tag-input"]')
    await input.setValue('new_tag')
    await input.trigger('keydown.enter')

    const emitted = wrapper.emitted('select')
    expect(emitted).toBeTruthy()
    expect(emitted?.[0]).toEqual(['new_tag'])
  })

  it('supports parent-triggered selection through exposed method', async () => {
    const wrapper = mount(TagAutocompleteInput, {
      props: {
        selectedTags: [],
        fetchSuggestions: async () => ['safe'],
        debounceMs: 0,
      },
      attachTo: document.body,
    })

    const input = wrapper.get('[data-testid="add-tag-input"]')
    await input.setValue('manual_tag')

    wrapper.vm.selectActiveOrCurrent()

    const emitted = wrapper.emitted('select')
    expect(emitted).toBeTruthy()
    expect(emitted?.[0]).toEqual(['manual_tag'])
  })
})
