import { test } from '@playwright/test'
import { installApiMocks } from '../fixtures/mockApi'
import { ProjectDetailsCardPageObject } from '../pages/cards/ProjectDetailsCardPageObject'

test.describe('Workspace Project Details card', () => {
  test('updates metadata reflected in current tags and uploads image @desktop', async ({ page }) => {
    await installApiMocks(page)

    const projectDetailsCard = new ProjectDetailsCardPageObject(page)

    await projectDetailsCard.goto()
    await projectDetailsCard.openCardWithProject('Sample Project')
    await projectDetailsCard.expectCardVisible()

    await projectDetailsCard.saveProjectMetadata({
      triggerTag: 'updated_trigger',
      classTag: 'updated_class',
      taggingMode: 'booru',
    })

    await projectDetailsCard.selectImage('sample-2.png')
    await projectDetailsCard.selectImage('sample.png')
    await projectDetailsCard.showCurrentTagsMode()
    await projectDetailsCard.expectTagVisible('updated_trigger')
    await projectDetailsCard.expectTagVisible('updated_class')

    await projectDetailsCard.openCardWithProject('Sample Project')
    await projectDetailsCard.uploadImage('project-details-upload.png')
    await projectDetailsCard.expectUploadSuccessMessage()
  })
})
