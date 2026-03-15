import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import WorkspaceLayout from '../components/layout/WorkspaceLayout.vue'

describe('WorkspaceLayout', () => {
  it('uses desktop panel containment classes for internal scrolling', () => {
    const wrapper = mount(WorkspaceLayout, {
      slots: {
        left: '<div>Left panel</div>',
        default: '<div>Center panel</div>',
        right: '<div>Right panel</div>',
      },
    })

    const rootSection = wrapper.get('section')
    expect(rootSection.classes()).toContain('min-h-0')
    expect(rootSection.classes()).toContain('lg:h-full')

    const asides = wrapper.findAll('aside')
    expect(asides).toHaveLength(2)
    for (const aside of asides) {
      expect(aside.classes()).toContain('lg:overflow-y-auto')
      expect(aside.classes()).toContain('lg:h-full')
      expect(aside.classes()).toContain('lg:min-h-0')
    }

    const sections = wrapper.findAll('section')
    const centerSection = sections[1]
    expect(centerSection?.classes()).toContain('lg:overflow-hidden')
    expect(centerSection?.classes()).toContain('lg:h-full')
    expect(centerSection?.classes()).toContain('lg:min-h-0')
  })
})
