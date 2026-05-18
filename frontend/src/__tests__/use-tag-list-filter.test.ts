import { computed, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { useTagListFilter } from '../composables/useTagListFilter'

describe('useTagListFilter', () => {
  it('filters with interchangeable spaces, hyphens, and underscores', () => {
    const items = ref(['close-up', 'digital_drawing_(artwork)', 'portrait'])
    const { filterQuery, filteredItems } = useTagListFilter(computed(() => items.value), (item) => item)

    filterQuery.value = 'close up'
    expect(filteredItems.value).toEqual(['close-up'])

    filterQuery.value = 'digital drawing art'
    expect(filteredItems.value).toEqual(['digital_drawing_(artwork)'])
  })

  it('returns all items when query is empty', () => {
    const items = ref(['a', 'b'])
    const { filterQuery, filteredItems } = useTagListFilter(computed(() => items.value), (item) => item)

    filterQuery.value = ''
    expect(filteredItems.value).toEqual(['a', 'b'])
  })
})
