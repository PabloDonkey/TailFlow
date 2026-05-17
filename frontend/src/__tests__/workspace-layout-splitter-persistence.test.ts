import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('reka-ui', () => ({
  SplitterGroup: defineComponent({
    name: 'SplitterGroup',
    props: {
      autoSaveId: {
        type: String,
        required: false,
        default: '',
      },
      direction: {
        type: String,
        required: false,
        default: 'horizontal',
      },
    },
    template: '<div data-testid="splitter-group" :data-auto-save-id="autoSaveId" :data-direction="direction"><slot /></div>',
  }),
  SplitterPanel: defineComponent({
    name: 'SplitterPanel',
    props: {
      id: {
        type: String,
        required: false,
        default: '',
      },
      order: {
        type: Number,
        required: false,
        default: undefined,
      },
    },
    template: '<div data-testid="splitter-panel" :data-panel-id="id" :data-panel-order="order"><slot /></div>',
  }),
  SplitterResizeHandle: defineComponent({
    name: 'SplitterResizeHandle',
    template: '<div data-testid="splitter-resize-handle" />',
  }),
}))

import WorkspaceLayout from '../components/layout/WorkspaceLayout.vue'

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(min-width: 1024px)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

describe('WorkspaceLayout splitter persistence', () => {
  it('uses left-center-right autosave key when both side panels are visible', async () => {
    const wrapper = mount(WorkspaceLayout, {
      props: {
        showLeft: true,
        showRight: true,
      },
      slots: {
        left: '<div>Left panel</div>',
        default: '<div>Center panel</div>',
        right: '<div>Right panel</div>',
      },
    })

    await nextTick()

    const splitterGroup = wrapper.get('[data-testid="splitter-group"]')
    expect(splitterGroup.attributes('data-auto-save-id')).toBe('workspace-tagging-layout-left-center-right')
  })

  it('uses left-center autosave key when only left panel is visible', async () => {
    const wrapper = mount(WorkspaceLayout, {
      props: {
        showLeft: true,
        showRight: false,
      },
      slots: {
        left: '<div>Left panel</div>',
        default: '<div>Center panel</div>',
      },
    })

    await nextTick()

    const splitterGroup = wrapper.get('[data-testid="splitter-group"]')
    expect(splitterGroup.attributes('data-auto-save-id')).toBe('workspace-tagging-layout-left-center')
  })

  it('uses center-right autosave key when only right panel is visible', async () => {
    const wrapper = mount(WorkspaceLayout, {
      props: {
        showLeft: false,
        showRight: true,
      },
      slots: {
        default: '<div>Center panel</div>',
        right: '<div>Right panel</div>',
      },
    })

    await nextTick()

    const splitterGroup = wrapper.get('[data-testid="splitter-group"]')
    expect(splitterGroup.attributes('data-auto-save-id')).toBe('workspace-tagging-layout-center-right')
  })

  it('keeps horizontal order as left-handle-center-handle-right', async () => {
    const wrapper = mount(WorkspaceLayout, {
      props: {
        showLeft: true,
        showRight: true,
      },
      slots: {
        left: '<div data-testid="slot-left">Left panel</div>',
        default: '<div data-testid="slot-center">Center panel</div>',
        right: '<div data-testid="slot-right">Right panel</div>',
      },
    })

    await nextTick()

    const splitterGroup = wrapper.get('[data-testid="splitter-group"]')
    const layoutSequence = Array.from(splitterGroup.element.children).map((element) => {
      const dataTestId = element.getAttribute('data-testid')
      if (dataTestId === 'splitter-resize-handle') {
        return 'handle'
      }

      const panelElement = element.querySelector('[data-testid^="slot-"]')
      if (panelElement?.getAttribute('data-testid') === 'slot-left') {
        return 'left'
      }
      if (panelElement?.getAttribute('data-testid') === 'slot-center') {
        return 'center'
      }
      if (panelElement?.getAttribute('data-testid') === 'slot-right') {
        return 'right'
      }

      return 'unknown'
    })

    expect(layoutSequence).toEqual(['left', 'handle', 'center', 'handle', 'right'])
  })

  it('assigns stable id and order for horizontal panels', async () => {
    const wrapper = mount(WorkspaceLayout, {
      props: {
        showLeft: true,
        showRight: true,
      },
      slots: {
        left: '<div data-testid="slot-left">Left panel</div>',
        default: '<div data-testid="slot-center">Center panel</div>',
        right: '<div data-testid="slot-right">Right panel</div>',
      },
    })

    await nextTick()

    const panels = wrapper.findAll('[data-testid="splitter-panel"]')
    const panelIdentity = panels.map((panel) => ({
      id: panel.attributes('data-panel-id'),
      order: panel.attributes('data-panel-order'),
    }))

    expect(panelIdentity).toEqual([
      { id: 'workspace-left-panel', order: '1' },
      { id: 'workspace-center-panel', order: '2' },
      { id: 'workspace-right-panel', order: '3' },
    ])
  })
})
