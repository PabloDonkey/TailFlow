// Utility to safely access a tag's catalog_ids by tagging mode, with type safety.
import type { ProjectTag, Project } from '../api'

/**
 * Returns the catalog id for a given tag and project tagging mode, or undefined if not present.
 */
export function getCatalogIdByTaggingMode(
  tag: ProjectTag,
  taggingMode: Project['tagging_mode'] | undefined | null
): string | undefined {
  if (!taggingMode) return undefined
  // catalog_ids is Record<string, string>
  return tag.catalog_ids[taggingMode as keyof typeof tag.catalog_ids]
}
