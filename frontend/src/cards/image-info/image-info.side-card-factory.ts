import ImageInfoCard from './ImageInfoCard.vue'
import type { CardMeta, SideCardFactory } from '../../pages/workspace/side-card-types'

export const imageInfoCardMeta: CardMeta = {
  name: 'Image Info',
  draggable: true,
  requiresProjectSelected: true,
  defaultColumn: 'right',
  defaultOrder: 60,
  isVisible: ({ isOpen, selectedProjectId }) => isOpen && Boolean(selectedProjectId),
}

export const imageInfoSideCardFactory: SideCardFactory = {
  build(viewId, state) {
    if (viewId !== 'image-info') {
      throw new Error(`imageInfoSideCardFactory cannot build config for viewId: ${viewId}`)
    }

    return {
      component: ImageInfoCard,
      props: {
        projectId: state.selectedProjectId,
        currentImage: state.currentImage,
      },
      listeners: {},
    }
  },
}
