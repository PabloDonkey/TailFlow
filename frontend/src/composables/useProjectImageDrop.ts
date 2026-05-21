import { ref, toValue, type MaybeRefOrGetter } from 'vue'
import type { ProjectImageUploadResponse } from '../api'

type UseProjectImageDropOptions = {
  projectId: MaybeRefOrGetter<string | null>
  existingFilenames: MaybeRefOrGetter<string[]>
  existingContentHashes?: MaybeRefOrGetter<string[]>
  uploadImages: (projectId: string, files: File[]) => Promise<ProjectImageUploadResponse | null>
  afterUpload?: (projectId: string) => Promise<void>
}

type DropFeedbackTone = 'info' | 'success' | 'error'

const IMAGE_MIME_SUFFIX: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/bmp': '.bmp',
  'image/tiff': '.tiff',
  'image/svg+xml': '.svg',
}

function isLikelyUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function parseUrlList(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#') && isLikelyUrl(line))
}

function filenameFromUrl(urlValue: string, mimeType: string, fallbackIndex: number): string {
  const parsedUrl = new URL(urlValue)
  const pathnamePart = parsedUrl.pathname.split('/').pop() ?? ''
  const decodedName = decodeURIComponent(pathnamePart).trim()
  const hasExtension = /\.[A-Za-z0-9]+$/.test(decodedName)

  if (decodedName !== '' && hasExtension) {
    return decodedName
  }

  const suffix = IMAGE_MIME_SUFFIX[mimeType] ?? '.jpg'
  const safeBase = decodedName.replace(/\.[A-Za-z0-9]+$/, '') || `dropped-image-${fallbackIndex + 1}`
  return `${safeBase}${suffix}`
}

function normalizeFilename(filename: string): string {
  return filename.trim().toLowerCase()
}

function normalizeContentHash(value: string): string {
  return value.trim().toLowerCase()
}

async function sha256ForFile(file: File): Promise<string | null> {
  if (!globalThis.crypto?.subtle) {
    return null
  }

  const arrayBuffer = await file.arrayBuffer()
  const digest = await globalThis.crypto.subtle.digest('SHA-256', arrayBuffer)
  const bytes = new Uint8Array(digest)
  return Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
}

export function hasExternalImageDropPayload(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer) {
    return false
  }

  const types = new Set(Array.from(dataTransfer.types))
  if (types.has('Files') || types.has('text/uri-list')) {
    return true
  }

  const textPlain = dataTransfer.getData('text/plain').trim()
  return textPlain !== '' && isLikelyUrl(textPlain)
}

async function imageFileFromUrl(urlValue: string, fallbackIndex: number): Promise<File | null> {
  const response = await fetch(urlValue)
  if (!response.ok) {
    throw new Error(`Failed to fetch dropped URL image: ${urlValue}`)
  }

  const blob = await response.blob()
  if (!blob.type.startsWith('image/')) {
    return null
  }

  const filename = filenameFromUrl(urlValue, blob.type, fallbackIndex)
  return new File([blob], filename, { type: blob.type })
}

async function collectDroppedImageFiles(dataTransfer: DataTransfer): Promise<File[]> {
  const localFiles = Array.from(dataTransfer.files).filter((file) => file.type.startsWith('image/'))

  const urlCandidates = new Set<string>()
  for (const url of parseUrlList(dataTransfer.getData('text/uri-list'))) {
    urlCandidates.add(url)
  }

  const plainText = dataTransfer.getData('text/plain').trim()
  if (plainText && isLikelyUrl(plainText)) {
    urlCandidates.add(plainText)
  }

  if (urlCandidates.size === 0) {
    return localFiles
  }

  const urlFiles = await Promise.all(
    Array.from(urlCandidates).map((urlValue, index) => imageFileFromUrl(urlValue, index)),
  )

  return [...localFiles, ...urlFiles.filter((file): file is File => file !== null)]
}

export function useProjectImageDrop(options: UseProjectImageDropOptions) {
  const isDropActive = ref(false)
  const dropFeedback = ref<string | null>(null)
  const dropFeedbackTone = ref<DropFeedbackTone>('info')

  function setFeedback(tone: DropFeedbackTone, text: string): void {
    dropFeedbackTone.value = tone
    dropFeedback.value = text
  }

  function clearFeedback(): void {
    dropFeedback.value = null
    dropFeedbackTone.value = 'info'
  }

  function handleDropZoneDragOver(event: DragEvent): void {
    const dataTransfer = event.dataTransfer
    if (!hasExternalImageDropPayload(dataTransfer)) {
      return
    }
    if (!dataTransfer) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    dataTransfer.dropEffect = 'copy'
    isDropActive.value = true
  }

  function handleDropZoneDragEnter(event: DragEvent): void {
    handleDropZoneDragOver(event)
  }

  function handleDropZoneDragLeave(): void {
    isDropActive.value = false
  }

  async function handleDropZoneDrop(event: DragEvent): Promise<void> {
    const dataTransfer = event.dataTransfer
    if (!hasExternalImageDropPayload(dataTransfer)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    isDropActive.value = false

    const activeProjectId = toValue(options.projectId)
    if (!activeProjectId) {
      setFeedback('error', 'Select a project before dropping images.')
      return
    }

    if (!dataTransfer) {
      setFeedback('error', 'Drop failed. No transferable files found.')
      return
    }

    let droppedFiles: File[]
    try {
      droppedFiles = await collectDroppedImageFiles(dataTransfer)
    } catch {
      setFeedback('error', 'Could not import one or more dragged image URLs.')
      return
    }

    if (droppedFiles.length === 0) {
      setFeedback('info', 'Drop image files or image URLs to add them to this project.')
      return
    }

    const existingFilenameSet = new Set(
      toValue(options.existingFilenames).map((filename) => normalizeFilename(filename)),
    )
    const existingContentHashSet = new Set(
      (toValue(options.existingContentHashes ?? [])).map((value) => normalizeContentHash(value)),
    )
    const droppedFilenameSet = new Set<string>()
    const droppedContentHashSet = new Set<string>()
    const filesToUpload: File[] = []
    let skippedDuplicates = 0

    for (const file of droppedFiles) {
      const droppedContentHash = await sha256ForFile(file)
      if (droppedContentHash) {
        const normalizedHash = normalizeContentHash(droppedContentHash)
        if (existingContentHashSet.has(normalizedHash) || droppedContentHashSet.has(normalizedHash)) {
          skippedDuplicates += 1
          continue
        }
        droppedContentHashSet.add(normalizedHash)
      }

      const normalized = normalizeFilename(file.name)
      if (existingFilenameSet.has(normalized) || droppedFilenameSet.has(normalized)) {
        skippedDuplicates += 1
        continue
      }

      droppedFilenameSet.add(normalized)
      filesToUpload.push(file)
    }

    if (filesToUpload.length === 0) {
      setFeedback('info', 'Skipped drop: all images already exist in this project.')
      return
    }

    const uploadResult = await options.uploadImages(activeProjectId, filesToUpload)
    if (!uploadResult) {
      setFeedback('error', 'Drop upload failed. Please try again.')
      return
    }

    if (options.afterUpload) {
      await options.afterUpload(activeProjectId)
    }

    const uploadedCount = uploadResult.uploaded_files.length
    const duplicateSuffix = skippedDuplicates > 0 ? `, skipped ${skippedDuplicates} duplicate(s)` : ''
    setFeedback('success', `Added ${uploadedCount} image(s)${duplicateSuffix}.`)
  }

  return {
    isDropActive,
    dropFeedback,
    dropFeedbackTone,
    clearFeedback,
    handleDropZoneDragEnter,
    handleDropZoneDragOver,
    handleDropZoneDragLeave,
    handleDropZoneDrop,
  }
}