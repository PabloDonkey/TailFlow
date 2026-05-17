import {
  aiProposedTagsCardMeta,
  aiProposedTagsSideCardFactory,
} from '../../cards/ai-proposed-tags/ai-proposed-tags.side-card-factory'
import {
  currentTagsCardMeta,
  currentTagsSideCardFactory,
} from '../../cards/current-tags/current-tags.side-card-factory'
import {
  imageCanvasCardFactory,
  imageCanvasCardMeta,
} from '../../cards/image-canvas/image-canvas.card-factory'
import {
  imageBrowserCardMeta,
  imageBrowserSideCardFactory,
} from '../../cards/image-browser/image-browser.side-card-factory'
import {
  projectBrowserCardFactory,
  projectBrowserCardMeta,
} from '../../cards/project-browser/project-browser.card-factory'
import {
  projectDetailsCardMeta,
  projectDetailsSideCardFactory,
} from '../../cards/project-details/project-details.side-card-factory'
import {
  tagsLibraryCardMeta,
  tagsLibrarySideCardFactory,
} from '../../cards/tags-library/tags-library.side-card-factory'
import type {
  CardMeta,
  SideCardActions,
  SideCardConfig,
  SideCardState,
  SideViewId,
  ToggleCardId,
  WorkspaceCardActions,
  WorkspaceCardConfig,
  WorkspaceCardFactory,
  WorkspaceCardId,
  WorkspaceCardState,
} from './side-card-types'

export type {
  CenterCardId,
  CardMeta,
  SideCardActions,
  SideCardConfig,
  SideCardFactory,
  SideCardState,
  SideViewId,
  ToggleCardId,
  WorkspaceCardActions,
  WorkspaceCardConfig,
  WorkspaceCardFactory,
  WorkspaceCardId,
  WorkspaceCardState,
} from './side-card-types'

const workspaceCardFactories: Record<WorkspaceCardId, WorkspaceCardFactory> = {
  canvas: imageCanvasCardFactory,
  'image-browser': imageBrowserSideCardFactory,
  'current-tags': currentTagsSideCardFactory,
  'ai-proposed-tags': aiProposedTagsSideCardFactory,
  'tags-library': tagsLibrarySideCardFactory,
  'project-details': projectDetailsSideCardFactory,
  'project-browser': projectBrowserCardFactory,
}

export const workspaceCardMeta: Record<WorkspaceCardId, CardMeta> = {
  canvas: imageCanvasCardMeta,
  'image-browser': imageBrowserCardMeta,
  'current-tags': currentTagsCardMeta,
  'ai-proposed-tags': aiProposedTagsCardMeta,
  'tags-library': tagsLibraryCardMeta,
  'project-details': projectDetailsCardMeta,
  'project-browser': projectBrowserCardMeta,
}

export const sideCardMeta: Record<SideViewId, CardMeta> = {
  'image-browser': workspaceCardMeta['image-browser'],
  'current-tags': workspaceCardMeta['current-tags'],
  'ai-proposed-tags': workspaceCardMeta['ai-proposed-tags'],
  'tags-library': workspaceCardMeta['tags-library'],
  'project-details': workspaceCardMeta['project-details'],
}

export function defaultSideViewOrder(column: 'left' | 'right'): SideViewId[] {
  return (Object.entries(sideCardMeta) as Array<[SideViewId, CardMeta]>)
    .filter(([, meta]) => meta.defaultColumn === column)
    .sort((a, b) => a[1].defaultOrder - b[1].defaultOrder)
    .map(([viewId]) => viewId)
}

export const defaultToggleCardOpenState: Record<ToggleCardId, boolean> = {
  'image-browser': true,
  canvas: true,
  'current-tags': true,
  'ai-proposed-tags': true,
  'tags-library': false,
  'project-details': false,
}

export function buildWorkspaceCardConfig(
  cardId: WorkspaceCardId,
  state: WorkspaceCardState,
  actions: WorkspaceCardActions,
): WorkspaceCardConfig {
  const factory = workspaceCardFactories[cardId]

  if (!factory) {
    throw new Error(`Missing workspace-card factory for cardId: ${cardId}`)
  }

  return factory.build(cardId, state, actions)
}

export function buildSideCardConfig(
  viewId: SideViewId,
  state: SideCardState,
  actions: SideCardActions,
): SideCardConfig {
  return buildWorkspaceCardConfig(viewId, state, actions)
}
