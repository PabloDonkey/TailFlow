import io
from pathlib import Path

import pytest
from httpx import AsyncClient

from tests.conftest import make_png_bytes


@pytest.mark.asyncio
async def test_replace_project_image_preserves_tags_and_record_identity(
    client: AsyncClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr('app.core.config.settings.projects_root_path', tmp_path)

    created = await client.post(
        '/api/projects',
        json={'folder_name': 'replace-image-project', 'class_tag': 'subject'},
    )
    assert created.status_code == 201
    project_id = created.json()['project']['id']

    original_bytes = make_png_bytes(10, 10)
    uploaded = await client.post(
        f'/api/projects/{project_id}/images',
        files=[('files', ('sample.png', io.BytesIO(original_bytes), 'image/png'))],
    )
    assert uploaded.status_code == 200

    listed = await client.get(f'/api/projects/{project_id}/images')
    assert listed.status_code == 200
    image = listed.json()[0]
    image_id = image['id']

    tagged = await client.post(
        f'/api/projects/{project_id}/images/{image_id}/tags',
        json={'add': ['custom-style'], 'remove': [], 'create_missing': True},
    )
    assert tagged.status_code == 200
    before_tags = [tag['name'] for tag in tagged.json()['tags']]

    replaced_bytes = make_png_bytes(16, 12)
    replace_response = await client.post(
        f'/api/projects/{project_id}/images/{image_id}/replace',
        files=[('file', ('replacement.png', io.BytesIO(replaced_bytes), 'image/png'))],
    )
    assert replace_response.status_code == 200

    replaced_payload = replace_response.json()
    assert replaced_payload['id'] == image_id
    assert [tag['name'] for tag in replaced_payload['tags']] == before_tags

    image_file = tmp_path / 'replace-image-project' / 'dataset' / replaced_payload['relative_path']
    assert image_file.is_file()
    assert image_file.read_bytes() == replaced_bytes

    fetched_again = await client.get(f'/api/projects/{project_id}/images/{image_id}')
    assert fetched_again.status_code == 200
    assert [tag['name'] for tag in fetched_again.json()['tags']] == before_tags
