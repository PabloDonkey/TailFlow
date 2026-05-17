import ImageCanvasCard from './ImageCanvasCard.vue'
import type { WorkspaceCardFactory } from '../../pages/workspace/side-card-types'
import { imageCanvasCardMeta } from './image-canvas.card-meta'

export { imageCanvasCardMeta }

export const imageCanvasCardFactory: WorkspaceCardFactory = {
  build(cardId, state, actions) {
    if (cardId !== 'canvas') {
      throw new Error(`imageCanvasCardFactory cannot build config for cardId: ${cardId}`)
    }

    return {
      component: ImageCanvasCard,
      props: {
        projectId: state.selectedProjectId,
        currentImage: state.currentImage,
        orderedImages: state.orderedImages,
        currentImageIndex: state.currentImageIndex,
        loading: state.loading,
        error: state.error,
      },
      listeners: {
        previous: () => {
          actions.previousImage()
        },
        next: () => {
          actions.nextImage()
        },
        jump: (index: unknown) => {
          if (typeof index === 'number') {
            actions.jumpToImage(index)
          }
        },
      },
    }
  },
}
