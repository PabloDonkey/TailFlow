import type { Component } from 'vue'
import type { Project, ProjectImageRead, ProjectImageSummary, ProjectTag } from '../../api'

export type SideViewId =
  | 'image-browser'
  | 'current-tags'
  | 'ai-proposed-tags'
  | 'tags-library'
  | 'project-details'

export type CenterCardId = 'canvas' | 'project-browser'

export type WorkspaceCardId = SideViewId | CenterCardId

export type ToggleCardId = SideViewId | 'canvas'

export type WorkspaceCardColumn = 'left' | 'center' | 'right'

export type SideCardConfig = {
  component: Component
  props: Record<string, unknown>
  listeners: Record<string, (...args: unknown[]) => void>
}

export type WorkspaceCardConfig = SideCardConfig

export type SideCardState = {
  selectedProjectId: string | null
  selectedProject: Project | null
  currentImageId: string | null
  currentImageTags: ProjectTag[]
  framed: boolean

  currentImage: ProjectImageRead | null
  orderedImages: ProjectImageSummary[]
  currentImageIndex: number
  loading: boolean
  error: string | null
  projects: Project[]
}

export type WorkspaceCardState = SideCardState

export type SideCardActions = {
  selectImage: (imageId: string) => void
  addAiTag: (tagName: string) => void
  removeAiTag: (tagName: string) => void

  selectProject: (projectId: string) => void
  openCreateProject: () => void
  discoverProjects: () => void
  showTaggingFromProjectBrowser: (projectId: string) => void
  previousImage: () => void
  nextImage: () => void
  jumpToImage: (index: number) => void
}

export type WorkspaceCardActions = SideCardActions

export interface SideCardFactory {
  build(cardId: WorkspaceCardId, state: WorkspaceCardState, actions: WorkspaceCardActions): WorkspaceCardConfig
}

export type WorkspaceCardFactory = SideCardFactory

export type CardMeta = {
  name: string
  draggable: boolean
  requiresProjectSelected: boolean
  defaultColumn: WorkspaceCardColumn
  defaultOrder: number
}
