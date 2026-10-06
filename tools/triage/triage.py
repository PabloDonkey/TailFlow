"""Triage tool: sort the images of a folder with swipes.

Start it with:  python3 tools/triage/triage.py <folder> [--port 8090]

Only the Python standard library is used. This tool is separate from the
TailFlow app.
"""

from __future__ import annotations

import argparse
import contextlib
import json
import mimetypes
import shutil
import subprocess
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, cast
from urllib.parse import unquote, urlsplit

DEFAULT_PORT = 8090
IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
CHOICES = ("fave", "keep", "reject")
PAGE_PATH = Path(__file__).with_name("index.html")

# One lock for all moves. Two devices can send a choice at the same time.
_move_lock = threading.Lock()


class TriageError(Exception):
    """Base class for the errors that the page can show."""


class InvalidName(TriageError):
    """The file name is not a plain image file name."""


class UnknownChoice(TriageError):
    """The choice is not keep, reject or fave."""


class AlreadyMoved(TriageError):
    """The image is no longer in the root of the folder."""


class TargetExists(TriageError):
    """A file with the same name is already in the target folder."""


def is_image_name(name: str) -> bool:
    return Path(name).suffix.lower() in IMAGE_SUFFIXES


def list_images(folder: Path) -> list[str]:
    """Return the image file names in the root of the folder, sorted by name."""
    return sorted(
        entry.name
        for entry in folder.iterdir()
        if entry.is_file() and is_image_name(entry.name)
    )


def count_folders(folder: Path) -> dict[str, int]:
    """Count the images in each choice folder."""
    counts: dict[str, int] = {}
    for choice in CHOICES:
        target = folder / choice
        counts[choice] = len(list_images(target)) if target.is_dir() else 0
    return counts


def artist_name(file_name: str) -> str:
    """Return the text before "__", or the full name if there is no "__"."""
    head, separator, _ = file_name.partition("__")
    return head if separator and head else file_name


def check_name(name: str) -> None:
    """Refuse every name that is not a plain image file name."""
    if (
        not name
        or "\x00" in name
        or "/" in name
        or "\\" in name
        or name in {".", ".."}
        or Path(name).name != name
        or not is_image_name(name)
    ):
        raise InvalidName(f"Not a valid image file name: {name!r}")


def image_path(folder: Path, name: str) -> Path:
    """Return the path of an image in the root of the folder."""
    check_name(name)
    path = folder / name
    if not path.is_file():
        raise FileNotFoundError(name)
    return path


def move_choice(folder: Path, name: str, choice: str) -> None:
    """Move an image and its .txt file to the folder of the choice.

    If a target file already exists, move nothing and raise TargetExists.
    """
    check_name(name)
    if choice not in CHOICES:
        raise UnknownChoice(f"Unknown choice: {choice!r}")
    image = folder / name
    sidecar = image.with_suffix(".txt")
    target_dir = folder / choice
    with _move_lock:
        if not image.is_file():
            raise AlreadyMoved(name)
        sources = [image]
        if sidecar.is_file():
            sources.append(sidecar)
        for source in sources:
            if (target_dir / source.name).exists():
                raise TargetExists(f"{source.name} already exists in {choice}/")
        target_dir.mkdir(exist_ok=True)
        moved: list[Path] = []
        try:
            for source in sources:
                shutil.move(str(source), str(target_dir / source.name))
                moved.append(source)
        except OSError:
            # Put back what we moved, so image and .txt stay together.
            for source in moved:
                shutil.move(str(target_dir / source.name), str(source))
            raise


class TriageServer(ThreadingHTTPServer):
    def __init__(self, address: tuple[str, int], folder: Path) -> None:
        super().__init__(address, TriageHandler)
        self.folder = folder


class TriageHandler(BaseHTTPRequestHandler):
    server: TriageServer

    def log_message(self, format: str, *args: Any) -> None:
        pass

    def _send(self, status: int, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _send_json(self, status: int, data: dict[str, Any]) -> None:
        self._send(status, json.dumps(data).encode(), "application/json")

    def do_GET(self) -> None:
        path = urlsplit(self.path).path
        folder = self.server.folder
        if path == "/":
            self._send(200, PAGE_PATH.read_bytes(), "text/html; charset=utf-8")
        elif path == "/api/state":
            images = list_images(folder)
            self._send_json(
                200,
                {
                    "images": images,
                    "counts": count_folders(folder),
                },
            )
        elif path.startswith("/image/"):
            self._serve_image(unquote(path[len("/image/") :]))
        else:
            self._send_json(404, {"error": "not_found"})

    def _serve_image(self, name: str) -> None:
        try:
            file_path = image_path(self.server.folder, name)
            data = file_path.read_bytes()
        except InvalidName:
            self._send_json(400, {"error": "invalid_name"})
        except OSError:
            self._send_json(404, {"error": "not_found"})
        else:
            content_type = mimetypes.guess_type(name)[0] or "application/octet-stream"
            self._send(200, data, content_type)

    def do_POST(self) -> None:
        if urlsplit(self.path).path != "/api/move":
            self._send_json(404, {"error": "not_found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length))
            name = str(payload["name"])
            choice = str(payload["choice"])
        except (ValueError, KeyError, TypeError):
            self._send_json(400, {"error": "bad_request"})
            return
        try:
            move_choice(self.server.folder, name, choice)
        except (InvalidName, UnknownChoice) as error:
            self._send_json(400, {"error": "bad_request", "message": str(error)})
        except AlreadyMoved:
            self._send_json(409, {"error": "already_moved"})
        except TargetExists as error:
            self._send_json(409, {"error": "target_exists", "message": str(error)})
        except OSError as error:
            self._send_json(500, {"error": "move_failed", "message": str(error)})
        else:
            self._send_json(200, {"ok": True})


def make_server(folder: Path, host: str, port: int) -> ThreadingHTTPServer:
    return TriageServer((host, port), folder)


def tailscale_address() -> str | None:
    """Return the Tailscale IPv4 address, or None if it cannot be found."""
    try:
        result = subprocess.run(
            ["tailscale", "ip", "-4"],
            capture_output=True,
            text=True,
            timeout=5,
            check=True,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    lines = result.stdout.split()
    return lines[0] if lines else None


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Sort the images of a folder.")
    parser.add_argument("folder", type=Path, help="folder with the images")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    args = parser.parse_args(argv)

    folder: Path = args.folder.resolve()
    if not folder.is_dir():
        print(f"Not a folder: {folder}", file=sys.stderr)
        return 1

    hosts = ["127.0.0.1"]
    tailscale = tailscale_address()
    if tailscale:
        hosts.append(tailscale)
    else:
        print(
            "Warning: no Tailscale address found. Listening on 127.0.0.1 only.",
            file=sys.stderr,
        )

    servers = [
        cast(TriageServer, make_server(folder, host, args.port)) for host in hosts
    ]
    for server in servers[1:]:
        threading.Thread(target=server.serve_forever, daemon=True).start()
    print(f"Folder: {folder}")
    print(f"This PC:   http://127.0.0.1:{args.port}/")
    if tailscale:
        print(f"Tailscale: http://{tailscale}:{args.port}/")
    print("Press Ctrl+C to stop.")
    with contextlib.suppress(KeyboardInterrupt):
        servers[0].serve_forever()
    for server in servers:
        server.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
