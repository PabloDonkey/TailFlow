import type { CardMeta } from '../../pages/workspace/side-card-types'

export const imageCanvasCardMeta: CardMeta = {
  name: 'Image Canvas',
  draggable: false,
  requiresProjectSelected: true,
  defaultColumn: 'center',
  defaultOrder: 10,
  isVisible: ({ isOpen, selectedProjectId }) => isOpen && Boolean(selectedProjectId),
}
