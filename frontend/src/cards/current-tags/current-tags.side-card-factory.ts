import CurrentTagsCard from './CurrentTagsCard.vue'
import type { CardMeta, SideCardFactory } from '../../pages/workspace/side-card-types'

export const currentTagsCardMeta: CardMeta = {
  name: 'Current Tags',
  draggable: true,
  requiresProjectSelected: true,
  defaultColumn: 'right',
  defaultOrder: 20,
}

export const currentTagsSideCardFactory: SideCardFactory = {
  build(viewId, state) {
    if (viewId !== 'current-tags') {
      throw new Error(`currentTagsSideCardFactory cannot build config for viewId: ${viewId}`)
    }

    return {
      component: CurrentTagsCard,
      props: {
        projectId: state.selectedProjectId,
        selectedProject: state.selectedProject,
        framed: state.framed,
      },
      listeners: {},
    }
  },
}
