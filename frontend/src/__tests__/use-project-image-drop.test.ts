import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useProjectImageDrop } from '../composables/useProjectImageDrop'

type MockDataTransfer = {
  files: File[]
  types: string[]
  getData: (type: string) => string
  dropEffect?: string
}

function createDropEvent(dataTransfer: MockDataTransfer): DragEvent {
  return {
    dataTransfer: dataTransfer as unknown as DataTransfer,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as DragEvent
}

describe('useProjectImageDrop', () => {
  const originalCrypto = globalThis.crypto

  beforeEach(() => {
    const digest = vi.fn(async (_algorithm: string, data: BufferSource) => {
      const bytes = new Uint8Array(data as ArrayBuffer)
      let checksum = 0
      for (const value of bytes) {
        checksum = (checksum + value) % 256
      }
      const out = new Uint8Array(32)
      out.fill(checksum)
      return out.buffer
    })

    Object.defineProperty(globalThis, 'crypto', {
      value: { subtle: { digest } },
      configurable: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(globalThis, 'crypto', {
      value: originalCrypto,
      configurable: true,
    })
  })

  it('uploads dropped image files for selected project', async () => {
    const uploadImages = vi.fn().mockResolvedValue({
      project_id: '11111111-1111-1111-1111-111111111111',
      uploaded_files: ['a.png'],
      created_records: 1,
      restored_records: 0,
    })

    const afterUpload = vi.fn().mockResolvedValue(undefined)
    const { handleDropZoneDrop } = useProjectImageDrop({
      projectId: ref('11111111-1111-1111-1111-111111111111'),
      existingFilenames: ref([]),
      existingContentHashes: ref([]),
      uploadImages,
      afterUpload,
    })

    const droppedFile = new File(['content-a'], 'a.png', { type: 'image/png' })
    const dropEvent = createDropEvent({
      files: [droppedFile],
      types: ['Files'],
      getData: () => '',
    })

    await handleDropZoneDrop(dropEvent)

    expect(uploadImages).toHaveBeenCalledTimes(1)
    expect(uploadImages.mock.calls[0]?.[0]).toBe('11111111-1111-1111-1111-111111111111')
    expect(uploadImages.mock.calls[0]?.[1]).toEqual([droppedFile])
    expect(afterUpload).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111')
  })

  it('skips duplicates using content hash even when filename differs', async () => {
    const uploadImages = vi.fn().mockResolvedValue({
      project_id: '11111111-1111-1111-1111-111111111111',
      uploaded_files: [],
      created_records: 0,
      restored_records: 0,
    })

    const existingBytes = new TextEncoder().encode('same-image-bytes')
    const digest = await globalThis.crypto.subtle.digest('SHA-256', existingBytes)
    const existingHash = Array.from(new Uint8Array(digest))
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('')

    const { handleDropZoneDrop, dropFeedback } = useProjectImageDrop({
      projectId: ref('11111111-1111-1111-1111-111111111111'),
      existingFilenames: ref([]),
      existingContentHashes: ref([existingHash]),
      uploadImages,
    })

    const droppedFile = new File(['same-image-bytes'], 'renamed-image.png', { type: 'image/png' })
    const dropEvent = createDropEvent({
      files: [droppedFile],
      types: ['Files'],
      getData: () => '',
    })

    await handleDropZoneDrop(dropEvent)

    expect(uploadImages).not.toHaveBeenCalled()
    expect(dropFeedback.value).toContain('Skipped drop: all images already exist')
  })
})