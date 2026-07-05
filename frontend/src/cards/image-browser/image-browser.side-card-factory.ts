import ImageBrowserCard from './ImageBrowserCard.vue'
import type { CardMeta, SideCardFactory } from '../../pages/workspace/side-card-types'

export const imageBrowserCardMeta: CardMeta = {
  name: 'Image Browser',
  draggable: true,
  requiresProjectSelected: true,
  defaultColumn: 'left',
  defaultOrder: 10,
  isVisible: ({ isOpen, selectedProjectId }) => isOpen && Boolean(selectedProjectId),
}

export const imageBrowserSideCardFactory: SideCardFactory = {
  build(viewId, state, actions) {
    if (viewId !== 'image-browser') {
      throw new Error(`imageBrowserSideCardFactory cannot build config for viewId: ${viewId}`)
    }

    return {
      component: ImageBrowserCard,
      props: {
        selectedProjectId: state.selectedProjectId,
      },
      listeners: {
        selectImage: (imageId: unknown) => {
          if (typeof imageId === 'string') {
            actions.selectImage(imageId)
          }
        },
        uploadImages: (files: unknown) => {
          if (Array.isArray(files) && files.every((file) => file instanceof File)) {
            actions.uploadImagesToCurrentProject(files)
          }
        },
      },
    }
  },
}
