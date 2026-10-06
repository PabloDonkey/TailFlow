# Triage tool

A small local web app. It sorts the images of one folder with swipes.
It is separate from the TailFlow app. It uses only the Python standard
library and one HTML page. There is nothing to install or build.

## Start

```bash
python3 tools/triage/triage.py <folder> [--port 8090]
```

The default port is 8090. The tool prints the address for this PC. It also
prints the Tailscale address, if Tailscale is available. Open an address in
a browser.

The tool listens only on `127.0.0.1` and on the Tailscale IPv4 address
(from `tailscale ip -4`). If Tailscale is not available, it prints a
warning and listens on `127.0.0.1` only. It never listens on `0.0.0.0`.

## Controls

| Move | Key | Result |
| --- | --- | --- |
| Swipe right | `Right` arrow | Keep. The image goes to `<folder>/keep/`. |
| Swipe left | `Left` arrow | Reject. The image goes to `<folder>/reject/`. |
| Swipe up | `Up` arrow | Fave. The image goes to `<folder>/fave/`. |

Mouse and touch both work. The card follows your pointer. The background
turns red (left), green (right) or yellow (up). The color gets stronger
as you drag. Drag past one third of the screen width (left, right) or
height (up) to make a choice. After a shorter drag, the card goes back to the center.

There is no undo, no skip and no buttons. Down does nothing.

## What it does to your files

- A choice moves the image and the `.txt` file with the same name.
- Nothing is deleted.
- If the target folder already has a file with the same name, nothing
  moves, and the page shows an error.
- The tool lists only image files in the root of the folder, sorted by
  name. These types work: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`.
  Other files are ignored. After a restart, you continue where you stopped.
- If two devices work at the same time and one has already moved an
  image, the other page loads the next image.

## Page

The page shows one image, the artist name (the text before `__` in the
file name, or the full name if there is no `__`), the file name, and a
counter such as `37 / 289`. The counter shows the images sorted so far,
and the total when the page loaded. When no image is left, the page shows
`Done. Fave: N, Keep: N, Reject: N`.

## Tests

```bash
python -m pytest tools/triage
```
