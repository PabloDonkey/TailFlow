import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { matchesSearchQuery } from '../utils/searchMatch'

type ReadableList<T> = Ref<readonly T[]> | ComputedRef<readonly T[]>

export function useTagListFilter<T>(
  items: ReadableList<T>,
  getSearchText: (item: T) => string,
) {
  const filterQuery = ref('')

  const filteredItems = computed(() => {
    const query = filterQuery.value.trim()
    if (!query) {
      return [...items.value]
    }

    return items.value.filter((item) => matchesSearchQuery(getSearchText(item), query))
  })

  return {
    filterQuery,
    filteredItems,
  }
}
