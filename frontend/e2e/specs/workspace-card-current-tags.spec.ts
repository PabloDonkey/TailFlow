import { test } from '@playwright/test'
import { installApiMocks } from '../fixtures/mockApi'
import { CurrentTagsCardPageObject } from '../pages/cards/CurrentTagsCardPageObject'

test.describe('Workspace Current Tags card', () => {
  test('searches filters adds removes and creates tags @desktop', async ({ page }) => {
    await installApiMocks(page)

    const currentTagsCard = new CurrentTagsCardPageObject(page)

    await currentTagsCard.goto()
    await currentTagsCard.openCardWithImage('Sample Project', 'sample-1.png')

    await currentTagsCard.expectTagChipVisible('safe')
    await currentTagsCard.filterCurrentTags('safe')
    await currentTagsCard.expectTagChipVisible('safe')
    await currentTagsCard.expectTagChipHidden('sample_project')

    await currentTagsCard.filterCurrentTags('')
    await currentTagsCard.expectTagChipVisible('sample_project')

    await currentTagsCard.addTag('e2e_created_tag')
    await currentTagsCard.expectTagVisible('e2e_created_tag')

    await currentTagsCard.removeTag('e2e_created_tag')
    await currentTagsCard.expectTagNotVisible('e2e_created_tag')
  })
})
