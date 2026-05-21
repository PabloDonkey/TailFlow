import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'
import ImageCanvasCard from '../cards/image-canvas/ImageCanvasCard.vue'

const UploadDropStub = defineComponent({
  name: 'UploadImageDropZone',
  template: '<div><slot :is-drop-active="false" :drop-feedback="null" :drop-feedback-tone="\'info\'" /></div>',
})

const AlertDialogStub = defineComponent({
  name: 'AppAlertDialog',
  props: {
    open: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['confirm', 'update:open'],
  template: `
    <div data-testid="delete-confirm" :data-open="open ? 'true' : 'false'">
      <button data-testid="confirm-delete" @click="$emit('confirm')">confirm</button>
    </div>
  `,
})

describe('ImageCanvasCard delete flow', () => {
  it('opens confirmation first and emits deleteCurrent only on confirm', async () => {
    const wrapper = mount(ImageCanvasCard, {
      props: {
        projectId: '11111111-1111-1111-1111-111111111111',
        currentImage: {
          id: '22222222-2222-2222-2222-222222222222',
          project_id: '11111111-1111-1111-1111-111111111111',
          relative_path: 'sample.png',
          filename: 'sample.png',
          content_hash: null,
          discovered_at: new Date().toISOString(),
          tag_count: 0,
          removed_at: null,
          tags: [],
        },
        orderedImages: [],
        currentImageIndex: 0,
        loading: false,
        error: null,
      },
      global: {
        stubs: {
          UploadImageDropZone: UploadDropStub,
          AppAlertDialog: AlertDialogStub,
        },
      },
    })

    expect(wrapper.get('[data-testid="delete-confirm"]').attributes('data-open')).toBe('false')

    await wrapper.get('[data-testid="delete-image-button"]').trigger('click')
    expect(wrapper.get('[data-testid="delete-confirm"]').attributes('data-open')).toBe('true')
    expect(wrapper.emitted('deleteCurrent')).toBeFalsy()

    await wrapper.get('[data-testid="confirm-delete"]').trigger('click')
    expect(wrapper.emitted('deleteCurrent')).toBeTruthy()
  })
})