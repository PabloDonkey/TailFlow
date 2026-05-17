import TagsLibraryCard from './TagsLibraryCard.vue'
import type { CardMeta, SideCardFactory } from '../../pages/workspace/side-card-types'

export const tagsLibraryCardMeta: CardMeta = {
  name: 'Tags Library',
  draggable: true,
  requiresProjectSelected: false,
  defaultColumn: 'right',
  defaultOrder: 40,
  isVisible: ({ isOpen }) => isOpen,
}

export const tagsLibrarySideCardFactory: SideCardFactory = {
  build(viewId) {
    if (viewId !== 'tags-library') {
      throw new Error(`tagsLibrarySideCardFactory cannot build config for viewId: ${viewId}`)
    }

    return {
      component: TagsLibraryCard,
      props: {
        showClose: false,
      },
      listeners: {},
    }
  },
}
