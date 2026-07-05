import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, reactive, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useWorkspacePersistence } from '../pages/workspace/useWorkspacePersistence'
import {
  defaultSideViewOrder,
  defaultToggleCardOpenState,
} from '../pages/workspace/side-card-service'

function mountPersistenceHarness(options: {
  storageKey: string
  projectStore: {
    projects: Array<{ id: string }>
    selectedProjectId: string | null
    error: string | null
    fetchProjects: ReturnType<typeof vi.fn>
    selectProject: ReturnType<typeof vi.fn>
  }
  imageStore: {
    images: Array<{ id: string }>
    currentImage: { id: string } | null
    fetchImages: ReturnType<typeof vi.fn>
  }
}) {
  let composableApi: ReturnType<typeof useWorkspacePersistence> | null = null

  const Harness = defineComponent({
    setup() {
      composableApi = useWorkspacePersistence({
        storageKey: options.storageKey,
        cardOpenState: ref({ ...defaultToggleCardOpenState }),
        leftViewOrder: ref(defaultSideViewOrder('left')),
        rightViewOrder: ref(defaultSideViewOrder('right')),
        mobileStage: ref('project-browser'),
        activeMobileBottomPanel: ref('current-tags'),
        mobileCurrentTagsViewMode: ref('tags-only'),
        mobileAiProposedTagsViewMode: ref('essentials'),
        mobileWorkspaceSplitPercent: ref(60),
        defaultLeftViewOrder: defaultSideViewOrder('left'),
        defaultRightViewOrder: defaultSideViewOrder('right'),
        projectStore: options.projectStore as never,
        imageStore: options.imageStore as never,
        selectImage: vi.fn().mockResolvedValue(undefined),
        queryValue: () => null,
      })
      return () => null
    },
  })

  mount(Harness)

  return {
    get composableApi() {
      if (!composableApi) {
        throw new Error('Composable did not initialize in harness.')
      }
      return composableApi
    },
  }
}

describe('useWorkspacePersistence startup project fetch retry', () => {
  afterEach(() => {
    vi.useRealTimers()
    window.localStorage.clear()
  })

  it('retries startup project fetch on transient connectivity failures', async () => {
    vi.useFakeTimers()

    const projectStore = reactive({
      projects: [] as Array<{ id: string }>,
      selectedProjectId: null as string | null,
      error: null as string | null,
      fetchProjects: vi.fn(),
      selectProject: vi.fn(),
    })

    const imageStore = reactive({
      images: [] as Array<{ id: string }>,
      currentImage: null as { id: string } | null,
      fetchImages: vi.fn().mockResolvedValue(undefined),
    })

    let attempt = 0
    projectStore.fetchProjects.mockImplementation(async () => {
      attempt += 1
      if (attempt < 3) {
        projectStore.error = 'TypeError: Failed to fetch'
        projectStore.projects = []
        return
      }

      projectStore.error = null
      projectStore.projects = [{ id: 'project-1' }]
    })

    const { composableApi } = mountPersistenceHarness({
      storageKey: 'workspace-persistence-startup-retry',
      projectStore,
      imageStore,
    })

    await flushPromises()
    expect(projectStore.fetchProjects).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(250)
    await flushPromises()
    expect(projectStore.fetchProjects).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(500)
    await flushPromises()
    expect(projectStore.fetchProjects).toHaveBeenCalledTimes(3)
    expect(projectStore.error).toBeNull()
    expect(composableApi.isWorkspaceRestorePending.value).toBe(false)
  })

  it('does not retry startup project fetch on non-transient API errors', async () => {
    vi.useFakeTimers()

    const projectStore = reactive({
      projects: [] as Array<{ id: string }>,
      selectedProjectId: null as string | null,
      error: null as string | null,
      fetchProjects: vi.fn(),
      selectProject: vi.fn(),
    })

    const imageStore = reactive({
      images: [] as Array<{ id: string }>,
      currentImage: null as { id: string } | null,
      fetchImages: vi.fn().mockResolvedValue(undefined),
    })

    projectStore.fetchProjects.mockImplementation(async () => {
      projectStore.error = 'Error: API 400: invalid request'
      projectStore.projects = []
    })

    const { composableApi } = mountPersistenceHarness({
      storageKey: 'workspace-persistence-non-transient-error',
      projectStore,
      imageStore,
    })

    await flushPromises()
    await vi.advanceTimersByTimeAsync(10_000)
    await flushPromises()

    expect(projectStore.fetchProjects).toHaveBeenCalledTimes(1)
    expect(composableApi.isWorkspaceRestorePending.value).toBe(false)
  })
})
