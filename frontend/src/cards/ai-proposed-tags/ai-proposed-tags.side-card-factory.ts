import AiProposedTagsCard from './AiProposedTagsCard.vue'
import type { CardMeta, SideCardFactory } from '../../pages/workspace/side-card-types'

export const aiProposedTagsCardMeta: CardMeta = {
  name: 'AI Proposed Tags',
  draggable: true,
  requiresProjectSelected: true,
  defaultColumn: 'right',
  defaultOrder: 30,
}

export const aiProposedTagsSideCardFactory: SideCardFactory = {
  build(viewId, state, actions) {
    if (viewId !== 'ai-proposed-tags') {
      throw new Error(`aiProposedTagsSideCardFactory cannot build config for viewId: ${viewId}`)
    }

    return {
      component: AiProposedTagsCard,
      props: {
        projectId: state.selectedProjectId,
        imageId: state.currentImageId,
        mode: state.selectedProject?.tagging_mode ?? 'booru',
        currentTags: state.currentImageTags,
        framed: state.framed,
      },
      listeners: {
        add: (tagName: unknown) => {
          if (typeof tagName === 'string') {
            actions.addAiTag(tagName)
          }
        },
        remove: (tagName: unknown) => {
          if (typeof tagName === 'string') {
            actions.removeAiTag(tagName)
          }
        },
      },
    }
  },
}
