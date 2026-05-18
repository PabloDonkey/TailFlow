import { test } from '@playwright/test'
import { installApiMocks } from '../fixtures/mockApi'
import { AiProposedTagsCardPageObject } from '../pages/cards/AiProposedTagsCardPageObject'
import { CurrentTagsCardPageObject } from '../pages/cards/CurrentTagsCardPageObject'

test.describe('Workspace AI Proposed Tags card', () => {
  test('scans proposals toggles auto scan and adds removes tag from proposals @desktop', async ({ page }) => {
    await installApiMocks(page)

    const aiProposedTagsCard = new AiProposedTagsCardPageObject(page)
    const currentTagsCard = new CurrentTagsCardPageObject(page)

    await aiProposedTagsCard.goto()
    await aiProposedTagsCard.openCardWithImage('Sample Project', 'sample.png')
    await aiProposedTagsCard.expectCardVisible()

    await aiProposedTagsCard.runManualScan()
    await aiProposedTagsCard.expectProposedTagVisible('blue_eyes')

    await aiProposedTagsCard.toggleProposedTag('blue_eyes')
    await currentTagsCard.expectTagVisible('blue_eyes')

    await aiProposedTagsCard.toggleProposedTag('blue_eyes')
    await currentTagsCard.expectTagHidden('blue_eyes')

    await aiProposedTagsCard.expectAutoScanEnabled(true)
    await aiProposedTagsCard.toggleAutoScan()
    await aiProposedTagsCard.expectAutoScanEnabled(false)

    await aiProposedTagsCard.toggleAutoScan()
    await aiProposedTagsCard.expectAutoScanEnabled(true)
  })
})
