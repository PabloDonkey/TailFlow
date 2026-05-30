import io
from pathlib import Path

import pytest
from httpx import AsyncClient

from tests.conftest import make_png_bytes


@pytest.mark.asyncio
async def test_project_dataset_rename_preview_and_apply_updates_sidecars(
    client: AsyncClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)

    created = await client.post(
        "/api/projects",
        json={
            "folder_name": "rename-sidecar-project",
            "trigger_tag": "my_trigger",
            "class_tag": "my_class",
        },
    )
    assert created.status_code == 201
    project_id = created.json()["project"]["id"]

    first_image = make_png_bytes(12, 12)
    uploaded_first = await client.post(
        f"/api/projects/{project_id}/images",
        files=[("files", ("zebra.png", io.BytesIO(first_image), "image/png"))],
    )
    assert uploaded_first.status_code == 200

    second_image = make_png_bytes(14, 14)
    uploaded_second = await client.post(
        f"/api/projects/{project_id}/images",
        files=[("files", ("lion.png", io.BytesIO(second_image), "image/png"))],
    )
    assert uploaded_second.status_code == 200

    listed = await client.get(f"/api/projects/{project_id}/images")
    assert listed.status_code == 200
    images = listed.json()
    assert len(images) == 2

    zebra = next(image for image in images if image["filename"] == "zebra.png")
    lion = next(image for image in images if image["filename"] == "lion.png")

    tagged = await client.post(
        f"/api/projects/{project_id}/images/{zebra['id']}/tags",
        json={"add": ["custom_style"], "remove": [], "create_missing": True},
    )
    assert tagged.status_code == 200

    preview = await client.post(f"/api/projects/{project_id}/dataset/rename-preview")
    assert preview.status_code == 200
    preview_payload = preview.json()
    assert preview_payload["total_images"] == 2
    assert preview_payload["rename_count"] == 2
    assert preview_payload["sidecar_update_count"] == 2

    preview_items = {
        item["current_relative_path"]: item for item in preview_payload["items"]
    }
    assert preview_items["zebra.png"]["proposed_relative_path"] == "1.png"
    assert preview_items["lion.png"]["proposed_relative_path"] == "2.png"
    assert (
        preview_items["zebra.png"]["sidecar_content"]
        == "my_trigger, my_class, custom_style"
    )
    assert preview_items["lion.png"]["sidecar_content"] == "my_trigger, my_class"

    apply_response = await client.post(
        f"/api/projects/{project_id}/dataset/rename-apply"
    )
    assert apply_response.status_code == 200
    apply_payload = apply_response.json()
    assert apply_payload["total_images"] == 2
    assert apply_payload["renamed_images"] == 2
    assert apply_payload["sidecars_updated"] == 2

    dataset_dir = tmp_path / "rename-sidecar-project" / "dataset"
    assert not (dataset_dir / "zebra.png").exists()
    assert not (dataset_dir / "lion.png").exists()
    assert (dataset_dir / "1.png").exists()
    assert (dataset_dir / "2.png").exists()

    sidecar_first = (dataset_dir / "1.txt").read_text(encoding="utf-8")
    sidecar_second = (dataset_dir / "2.txt").read_text(encoding="utf-8")
    assert sidecar_first == "my_trigger, my_class, custom_style"
    assert sidecar_second == "my_trigger, my_class"

    refreshed = await client.get(f"/api/projects/{project_id}/images")
    assert refreshed.status_code == 200
    refreshed_items = refreshed.json()
    refreshed_by_id = {item["id"]: item for item in refreshed_items}
    assert refreshed_by_id[zebra["id"]]["relative_path"] == "1.png"
    assert refreshed_by_id[lion["id"]]["relative_path"] == "2.png"
