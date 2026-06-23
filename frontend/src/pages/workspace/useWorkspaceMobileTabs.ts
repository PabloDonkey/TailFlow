import { computed, watch, type Ref } from 'vue'
import type { MobileWorkspaceTab } from '../../components/layout/WorkspaceMobileViewsTabs.vue'
import { useProjectStore } from '../../stores/projects'
import type { CardMeta, SideViewId, ToggleCardId } from './side-card-service'

type CardId = ToggleCardId | 'project-browser'

type UseWorkspaceMobileTabsParams = {
  activeMobileTab: Ref<MobileWorkspaceTab>
  cardOpenState: Ref<Record<ToggleCardId, boolean>>
  cardMeta: Record<CardId, CardMeta>
}

export function useWorkspaceMobileTabs(params: UseWorkspaceMobileTabsParams) {
  const projectStore = useProjectStore()
  const { activeMobileTab, cardOpenState, cardMeta } = params

  function cardTitle(cardId: CardId): string {
    return cardMeta[cardId].name
  }

  function isCardOpen(cardId: ToggleCardId): boolean {
    return cardOpenState.value[cardId]
  }

  function isCardVisible(cardId: CardId): boolean {
    return cardMeta[cardId].isVisible({
      isOpen: cardId === 'project-browser' ? true : isCardOpen(cardId),
      selectedProjectId: projectStore.selectedProjectId,
    })
  }

  const mobileTabs = computed<Array<{ id: MobileWorkspaceTab; label: string }>>(() => {
    const tabs: Array<{ id: MobileWorkspaceTab; label: string }> = []

    if (isCardVisible('image-browser')) {
      tabs.push({ id: 'image-browser', label: cardTitle('image-browser') })
    }
    if (isCardVisible('image-info')) {
      tabs.push({ id: 'image-info', label: cardTitle('image-info') })
    }
    if (isCardVisible('canvas')) {
      tabs.push({ id: 'canvas', label: cardTitle('canvas') })
    }
    if (isCardVisible('current-tags')) {
      tabs.push({ id: 'current-tags', label: cardTitle('current-tags') })
    }
    if (isCardVisible('ai-proposed-tags')) {
      tabs.push({ id: 'ai-proposed-tags', label: cardTitle('ai-proposed-tags') })
    }
    if (isCardVisible('tags-library')) {
      tabs.push({ id: 'tags-library', label: cardTitle('tags-library') })
    }
    if (isCardVisible('project-details')) {
      tabs.push({ id: 'project-details', label: cardTitle('project-details') })
    }

    tabs.push({ id: 'project-browser', label: cardTitle('project-browser') })
    return tabs
  })

  const activeMobileSideViewId = computed<SideViewId | null>(() => {
    if (
      activeMobileTab.value === 'image-browser'
      || activeMobileTab.value === 'image-info'
      || activeMobileTab.value === 'current-tags'
      || activeMobileTab.value === 'ai-proposed-tags'
      || activeMobileTab.value === 'tags-library'
      || activeMobileTab.value === 'project-details'
    ) {
      return activeMobileTab.value
    }

    return null
  })

  const activeMobileTabTitle = computed(() => cardTitle(activeMobileTab.value))

  watch(
    () => mobileTabs.value,
    (tabs) => {
      if (tabs.some((tab) => tab.id === activeMobileTab.value)) {
        return
      }
      activeMobileTab.value = tabs[0]?.id ?? 'project-browser'
    },
    { immediate: true },
  )

  return {
    mobileTabs,
    activeMobileSideViewId,
    activeMobileTabTitle,
    isCardVisible,
  }
}
