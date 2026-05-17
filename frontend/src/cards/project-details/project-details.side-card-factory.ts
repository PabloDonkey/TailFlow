import ProjectDetailsCard from './ProjectDetailsCard.vue'
import type { CardMeta, SideCardFactory } from '../../pages/workspace/side-card-types'

export const projectDetailsCardMeta: CardMeta = {
  name: 'Project Details',
  draggable: true,
  requiresProjectSelected: true,
  defaultColumn: 'right',
  defaultOrder: 50,
}

export const projectDetailsSideCardFactory: SideCardFactory = {
  build(viewId, state) {
    if (viewId !== 'project-details') {
      throw new Error(`projectDetailsSideCardFactory cannot build config for viewId: ${viewId}`)
    }

    return {
      component: ProjectDetailsCard,
      props: {
        selectedProject: state.selectedProject,
      },
      listeners: {},
    }
  },
}
