import { test } from '@playwright/test'
import { installApiMocks } from '../fixtures/mockApi'
import { ImageCanvasCardPageObject } from '../pages/cards/ImageCanvasCardPageObject'
import { ImageBrowserCardPageObject } from '../pages/cards/ImageBrowserCardPageObject'

test.describe('Workspace Image Canvas card', () => {
  test('navigates images with next previous jump and browser selection @desktop', async ({ page }) => {
    await installApiMocks(page)

    const imageCanvasCard = new ImageCanvasCardPageObject(page)
    const imageBrowserCard = new ImageBrowserCardPageObject(page)

    await imageCanvasCard.goto()
    await imageCanvasCard.openCardWithProject('Sample Project')

    await imageCanvasCard.expectCardVisible()
    await imageBrowserCard.selectImage('sample-2.png')
    await imageCanvasCard.expectCanvasImageWithFilename('sample-2.png')

    await imageCanvasCard.goToNextImage()
    await imageCanvasCard.expectCanvasImageWithFilename('sample-3.png')

    await imageCanvasCard.goToPreviousImage()
    await imageCanvasCard.expectCanvasImageWithFilename('sample-2.png')

    await imageCanvasCard.jumpToImageNumber(3)
    await imageCanvasCard.expectCanvasImageWithFilename('sample.png')

    await imageBrowserCard.selectImage('sample-3.png')
    await imageCanvasCard.expectCanvasImageWithFilename('sample-3.png')
  })
})
