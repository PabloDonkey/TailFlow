# Assets Reference

This folder contains tag list datasets used by TailFlow.

## Data source

- e621 tag export: <https://e621.net/db_export/>

## Included files

- `e621-tags-list.csv`
- `booru-tags-list.csv`

## Integrity policy

Only these two catalog files are protected by checksum drift validation:

- `e621-tags-list.csv`
- `booru-tags-list.csv`

The checksum manifest is stored in `assets/checksums.json`.
CI fails if either protected file changes without updating the manifest.

## Checksum commands

From repository root:

```bash
python3 scripts/validate_assets_checksums.py
```

Update manifest intentionally after approved catalog changes:

```bash
python3 scripts/validate_assets_checksums.py --write
```

You can also run the make target:

```bash
make test-assets
```

## e621 tag categories and colors

The e621 category IDs map to the following color codes:

| Category ID | Name | Color |
| --- | --- | --- |
| `0` | General | `#b4c7d9` |
| `1` | Artist | `#f2ac08` |
| `2` | Contributor (silver) | `#c0c0c0` |
| `3` | Copyright | `#d000d0` |
| `4` | Character | `#00aa00` |
| `5` | Species | `#ed5d1f` |
| `6` | Invalid | `#ff3d3d` |
| `7` | Meta | `#ffffff` |
| `8` | Lore | `#282` |
| `9` | New/Unknown category | `#555555` |