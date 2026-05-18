import ProjectBrowserCard from './ProjectBrowserCard.vue'
import ProjectBrowserHeaderActions from './ProjectBrowserHeaderActions.vue'
import type { WorkspaceCardFactory } from '../../pages/workspace/side-card-types'
import { projectBrowserCardMeta } from './project-browser.card-meta'

export { projectBrowserCardMeta }

export const projectBrowserCardFactory: WorkspaceCardFactory = {
  build(cardId, state, actions) {
    if (cardId !== 'project-browser') {
      throw new Error(`projectBrowserCardFactory cannot build config for cardId: ${cardId}`)
    }

    return {
      component: ProjectBrowserCard,
      props: {
        projects: state.projects,
        selectedProjectId: state.selectedProjectId,
        loading: state.loading,
        discovering: state.loading,
        showActions: false,
      },
      listeners: {
        selectProject: (projectId: unknown) => {
          if (typeof projectId === 'string') {
            actions.selectProject(projectId)
          }
        },
        openCreateProject: () => {
          actions.openCreateProject()
        },
        discoverProjects: () => {
          actions.discoverProjects()
        },
        showTagging: (projectId: unknown) => {
          if (typeof projectId === 'string') {
            actions.showTaggingFromProjectBrowser(projectId)
          }
        },
      },
      headerActions: {
        component: ProjectBrowserHeaderActions,
        props: {
          loading: state.loading,
          discovering: state.loading,
        },
        listeners: {
          openCreateProject: () => {
            actions.openCreateProject()
          },
          discoverProjects: () => {
            actions.discoverProjects()
          },
        },
      },
    }
  },
}
