from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
ASSETS_DIR = REPO_ROOT / "assets"
MANIFEST_PATH = ASSETS_DIR / "checksums.json"
PROTECTED_FILES = (
    "booru-tags-list.csv",
    "e621-tags-list.csv",
)


def sha256_for_file(file_path: Path) -> str:
    digest = hashlib.sha256()
    with file_path.open("rb") as handle:
        while True:
            chunk = handle.read(1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def collect_assets_checksums() -> dict[str, str]:
    checksums: dict[str, str] = {}
    for filename in PROTECTED_FILES:
        file_path = ASSETS_DIR / filename
        if not file_path.exists() or not file_path.is_file():
            raise FileNotFoundError(f"Missing protected asset file: {file_path}")
        checksums[filename] = sha256_for_file(file_path)
    return checksums


def load_manifest() -> dict[str, str]:
    if not MANIFEST_PATH.exists():
        raise FileNotFoundError(
            f"Missing checksum manifest at {MANIFEST_PATH}. "
            "Run with --write to generate it."
        )

    data = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError("Checksum manifest must be a JSON object.")

    normalized: dict[str, str] = {}
    for key, value in data.items():
        if not isinstance(key, str) or not isinstance(value, str):
            raise ValueError("Checksum manifest keys and values must be strings.")
        normalized[key] = value
    return normalized


def write_manifest() -> int:
    checksums = collect_assets_checksums()
    MANIFEST_PATH.write_text(
        json.dumps(checksums, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {MANIFEST_PATH} with {len(checksums)} entries.")
    return 0


def check_manifest() -> int:
    expected = load_manifest()
    actual = collect_assets_checksums()

    expected_keys = sorted(expected)
    protected_keys = sorted(PROTECTED_FILES)
    if expected_keys != protected_keys:
        print("Asset checksum validation failed.")
        print("Manifest keys must match protected files exactly.")
        print(f"  expected keys: {protected_keys}")
        print(f"  manifest keys: {expected_keys}")
        print("Run `python scripts/validate_assets_checksums.py --write` to update the manifest.")
        return 1

    missing_in_manifest = sorted(set(actual) - set(expected))
    missing_files = sorted(set(expected) - set(actual))
    mismatched = sorted(
        name
        for name in sorted(set(actual) & set(expected))
        if actual[name] != expected[name]
    )

    if not missing_in_manifest and not missing_files and not mismatched:
        print("Asset checksums are valid.")
        return 0

    print("Asset checksum validation failed.")

    if missing_in_manifest:
        print("Files present on disk but missing from manifest:")
        for name in missing_in_manifest:
            print(f"  - {name}")

    if missing_files:
        print("Files present in manifest but missing on disk:")
        for name in missing_files:
            print(f"  - {name}")

    if mismatched:
        print("Files with checksum mismatch:")
        for name in mismatched:
            print(f"  - {name}")
            print(f"    expected: {expected[name]}")
            print(f"    actual:   {actual[name]}")

    print("Run `python scripts/validate_assets_checksums.py --write` to update the manifest.")
    return 1


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate or update checksum manifest for files under assets/."
    )
    parser.add_argument(
        "--write",
        action="store_true",
        help="Regenerate assets/checksums.json from current files.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.write:
        return write_manifest()
    return check_manifest()


if __name__ == "__main__":
    raise SystemExit(main())