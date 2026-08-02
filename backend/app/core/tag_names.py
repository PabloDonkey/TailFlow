"""Canonical form for tag names.

Tag identity is the canonical name. Every path that turns a user-supplied or
model-supplied string into a `Tag` must canonicalize first, so the same concept
resolves to one row regardless of how it entered (ADR-011).
"""


def canonical_tag_name(raw: str) -> str:
    """Return the canonical form of a tag name.

    Lowercases and collapses any run of whitespace into a single underscore,
    matching the e621/booru catalog convention:

        "  Simple  Background " -> "simple_background"
        "pussy-cat (meme)"       -> "pussy-cat_(meme)"

    Already-canonical names are returned unchanged, so this is safe to apply
    repeatedly and safe to apply to catalog CSV rows.
    """
    return "_".join(raw.strip().lower().split())
