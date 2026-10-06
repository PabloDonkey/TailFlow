import http.client
import json
import threading
import urllib.error
import urllib.request
from collections.abc import Iterator
from http.server import ThreadingHTTPServer
from pathlib import Path

import pytest

import triage


def touch(folder: Path, *names: str) -> None:
    for name in names:
        (folder / name).write_bytes(b"data-" + name.encode())


# --- file list ---------------------------------------------------------------


def test_list_images_keeps_only_image_types_any_case(tmp_path: Path) -> None:
    touch(
        tmp_path,
        "a.png",
        "b.JPG",
        "c.jpeg",
        "d.WebP",
        "e.gif",
        "f.txt",
        "g.mp4",
        "noext",
    )
    assert triage.list_images(tmp_path) == [
        "a.png",
        "b.JPG",
        "c.jpeg",
        "d.WebP",
        "e.gif",
    ]


def test_list_images_is_root_only(tmp_path: Path) -> None:
    touch(tmp_path, "root.png")
    for sub in ("keep", "reject", "fave", "other"):
        (tmp_path / sub).mkdir()
        touch(tmp_path / sub, "inside.png")
    assert triage.list_images(tmp_path) == ["root.png"]


def test_list_images_is_sorted_by_name(tmp_path: Path) -> None:
    touch(tmp_path, "b__2.png", "a__10.png", "a__2.png")
    assert triage.list_images(tmp_path) == ["a__10.png", "a__2.png", "b__2.png"]


# --- moving ------------------------------------------------------------------


@pytest.mark.parametrize("choice", ["keep", "reject", "fave"])
def test_move_puts_image_in_target_folder(tmp_path: Path, choice: str) -> None:
    touch(tmp_path, "Aru__1.png")
    triage.move_choice(tmp_path, "Aru__1.png", choice)
    assert not (tmp_path / "Aru__1.png").exists()
    assert (tmp_path / choice / "Aru__1.png").read_bytes() == b"data-Aru__1.png"


def test_move_moves_txt_with_image(tmp_path: Path) -> None:
    touch(tmp_path, "Aru__1.png", "Aru__1.txt", "Aru__2.txt")
    triage.move_choice(tmp_path, "Aru__1.png", "keep")
    assert (tmp_path / "keep" / "Aru__1.txt").exists()
    assert not (tmp_path / "Aru__1.txt").exists()
    # A txt file of another image stays.
    assert (tmp_path / "Aru__2.txt").exists()


def test_move_works_without_txt(tmp_path: Path) -> None:
    touch(tmp_path, "Aru__1.png")
    triage.move_choice(tmp_path, "Aru__1.png", "fave")
    assert [p.name for p in (tmp_path / "fave").iterdir()] == ["Aru__1.png"]


def test_move_refused_when_target_image_exists(tmp_path: Path) -> None:
    touch(tmp_path, "a.png", "a.txt")
    (tmp_path / "keep").mkdir()
    (tmp_path / "keep" / "a.png").write_bytes(b"old")
    with pytest.raises(triage.TargetExists):
        triage.move_choice(tmp_path, "a.png", "keep")
    assert (tmp_path / "a.png").exists()
    assert (tmp_path / "a.txt").exists()
    assert (tmp_path / "keep" / "a.png").read_bytes() == b"old"
    assert not (tmp_path / "keep" / "a.txt").exists()


def test_move_refused_when_target_txt_exists(tmp_path: Path) -> None:
    touch(tmp_path, "a.png", "a.txt")
    (tmp_path / "reject").mkdir()
    (tmp_path / "reject" / "a.txt").write_bytes(b"old")
    with pytest.raises(triage.TargetExists):
        triage.move_choice(tmp_path, "a.png", "reject")
    assert (tmp_path / "a.png").exists()
    assert (tmp_path / "a.txt").exists()
    assert not (tmp_path / "reject" / "a.png").exists()
    assert (tmp_path / "reject" / "a.txt").read_bytes() == b"old"


def test_move_already_moved_raises(tmp_path: Path) -> None:
    touch(tmp_path, "a.png")
    triage.move_choice(tmp_path, "a.png", "keep")
    with pytest.raises(triage.AlreadyMoved):
        triage.move_choice(tmp_path, "a.png", "reject")
    assert (tmp_path / "keep" / "a.png").exists()
    assert not (tmp_path / "reject").exists()


def test_move_unknown_choice_raises(tmp_path: Path) -> None:
    touch(tmp_path, "a.png")
    with pytest.raises(triage.UnknownChoice):
        triage.move_choice(tmp_path, "a.png", "down")
    assert (tmp_path / "a.png").exists()


def test_count_folders(tmp_path: Path) -> None:
    touch(tmp_path, "a.png", "b.png", "c.png", "d.png", "e.txt")
    triage.move_choice(tmp_path, "a.png", "fave")
    triage.move_choice(tmp_path, "b.png", "keep")
    triage.move_choice(tmp_path, "c.png", "keep")
    assert triage.count_folders(tmp_path) == {"fave": 1, "keep": 2, "reject": 0}


# --- path traversal ----------------------------------------------------------

BAD_NAMES = [
    "../secret.png",
    "..",
    "sub/a.png",
    "sub\\a.png",
    "/etc/passwd",
    "/abs/a.png",
    "",
    ".",
    "a\x00.png",
]


@pytest.mark.parametrize("name", BAD_NAMES)
def test_move_refuses_bad_names(tmp_path: Path, name: str) -> None:
    folder = tmp_path / "work"
    folder.mkdir()
    touch(tmp_path, "secret.png")
    with pytest.raises(triage.InvalidName):
        triage.move_choice(folder, name, "keep")
    assert (tmp_path / "secret.png").exists()


@pytest.mark.parametrize("name", BAD_NAMES)
def test_image_path_refuses_bad_names(tmp_path: Path, name: str) -> None:
    folder = tmp_path / "work"
    folder.mkdir()
    touch(tmp_path, "secret.png")
    with pytest.raises(triage.InvalidName):
        triage.image_path(folder, name)


def test_image_path_refuses_non_image_and_subfolder_files(tmp_path: Path) -> None:
    touch(tmp_path, "notes.txt")
    (tmp_path / "keep").mkdir()
    touch(tmp_path / "keep", "moved.png")
    with pytest.raises(triage.InvalidName):
        triage.image_path(tmp_path, "notes.txt")
    with pytest.raises(FileNotFoundError):
        triage.image_path(tmp_path, "moved.png")


def test_image_path_returns_root_image(tmp_path: Path) -> None:
    touch(tmp_path, "a.PNG")
    assert triage.image_path(tmp_path, "a.PNG") == tmp_path / "a.PNG"


# --- artist name -------------------------------------------------------------


def test_artist_name() -> None:
    assert triage.artist_name("Aru__370.png") == "Aru"
    assert triage.artist_name("plain.png") == "plain.png"


# --- HTTP --------------------------------------------------------------------


@pytest.fixture
def server(tmp_path: Path) -> Iterator[tuple[str, Path]]:
    folder = tmp_path / "work"
    folder.mkdir()
    touch(folder, "a.png", "a.txt", "b.png")
    httpd: ThreadingHTTPServer = triage.make_server(folder, "127.0.0.1", 0)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{httpd.server_address[1]}", folder
    httpd.shutdown()
    httpd.server_close()


def post_move(base: str, name: str, choice: str) -> tuple[int, dict[str, str]]:
    request = urllib.request.Request(
        base + "/api/move",
        data=json.dumps({"name": name, "choice": choice}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        return error.code, json.load(error)


def test_http_state_lists_images_and_counts(server: tuple[str, Path]) -> None:
    base, _ = server
    with urllib.request.urlopen(base + "/api/state") as response:
        state = json.load(response)
    assert state["images"] == ["a.png", "b.png"]
    assert state["counts"] == {"fave": 0, "keep": 0, "reject": 0}


def test_http_move_ok(server: tuple[str, Path]) -> None:
    base, folder = server
    status, _ = post_move(base, "a.png", "fave")
    assert status == 200
    assert (folder / "fave" / "a.png").exists()
    assert (folder / "fave" / "a.txt").exists()


def test_http_already_moved_is_409(server: tuple[str, Path]) -> None:
    base, _ = server
    assert post_move(base, "a.png", "keep")[0] == 200
    status, body = post_move(base, "a.png", "reject")
    assert status == 409
    assert body["error"] == "already_moved"


def test_http_target_exists_is_409_and_moves_nothing(
    server: tuple[str, Path],
) -> None:
    base, folder = server
    (folder / "keep").mkdir()
    (folder / "keep" / "b.png").write_bytes(b"old")
    status, body = post_move(base, "b.png", "keep")
    assert status == 409
    assert body["error"] == "target_exists"
    assert (folder / "b.png").exists()


def test_http_bad_name_is_400(server: tuple[str, Path]) -> None:
    base, _ = server
    status, _ = post_move(base, "../x.png", "keep")
    assert status == 400


def test_http_serves_image_and_refuses_traversal(server: tuple[str, Path]) -> None:
    base, _ = server
    with urllib.request.urlopen(base + "/image/a.png") as response:
        assert response.read() == b"data-a.png"
    for bad in ("/image/..%2Fx.png", "/image/%2Fetc%2Fpasswd", "/image/a.txt"):
        with pytest.raises(urllib.error.HTTPError) as caught:
            urllib.request.urlopen(base + bad)
        assert caught.value.code in (400, 404)


def post_raw(
    base: str, name: str, choice: str, content_type: str | None
) -> tuple[int, dict[str, str]]:
    # http.client sends exactly the headers that we give it. urllib would add
    # its own form content type when the header is missing.
    headers = {} if content_type is None else {"Content-Type": content_type}
    body = json.dumps({"name": name, "choice": choice})
    connection = http.client.HTTPConnection(base.removeprefix("http://"))
    try:
        connection.request("POST", "/api/move", body=body, headers=headers)
        response = connection.getresponse()
        return response.status, json.load(response)
    finally:
        connection.close()


def test_http_move_refuses_text_plain_with_415(server: tuple[str, Path]) -> None:
    base, folder = server
    status, body = post_raw(base, "a.png", "keep", "text/plain")
    assert status == 415
    assert body["error"] == "unsupported_media_type"
    assert (folder / "a.png").exists()
    assert not (folder / "keep").exists()


def test_http_move_refuses_missing_content_type_with_415(
    server: tuple[str, Path],
) -> None:
    base, folder = server
    status, body = post_raw(base, "a.png", "keep", None)
    assert status == 415
    assert body["error"] == "unsupported_media_type"
    assert (folder / "a.png").exists()
    assert not (folder / "keep").exists()


def test_http_state_artists_match_images(tmp_path: Path) -> None:
    folder = tmp_path / "work"
    folder.mkdir()
    touch(folder, "Aru__1.png", "plain.png", "Bo__x__2.jpg")
    httpd = triage.make_server(folder, "127.0.0.1", 0)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    try:
        url = f"http://127.0.0.1:{httpd.server_address[1]}/api/state"
        with urllib.request.urlopen(url) as response:
            state = json.load(response)
    finally:
        httpd.shutdown()
        httpd.server_close()
    assert state["images"] == ["Aru__1.png", "Bo__x__2.jpg", "plain.png"]
    assert state["artists"] == ["Aru", "Bo", "plain.png"]
