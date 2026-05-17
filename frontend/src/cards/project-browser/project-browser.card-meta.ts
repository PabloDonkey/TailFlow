import type { CardMeta } from '../../pages/workspace/side-card-types'

export const projectBrowserCardMeta: CardMeta = {
  name: 'Project Browser',
  draggable: false,
  requiresProjectSelected: false,
  defaultColumn: 'center',
  defaultOrder: 20,
  isVisible: () => true,
}
