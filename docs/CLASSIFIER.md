# Classifier

## Purpose

How AI tag proposals work and how to turn them on. The classifier is **off by default and degrades silently when unavailable** — this document exists mostly so that "the AI card returns nothing" is a two-minute diagnosis rather than an afternoon.

Implementation: `backend/app/services/classifier.py`.

---

# Turning it on

Four things must all be true. Missing any one produces empty suggestions, not an error.

1. **`CLASSIFIER_ENABLED=true`** in `backend/.env`. Default is `false`.
2. **`MODEL_STORAGE_PATH`** points at an existing directory. Set during onboarding; defaults to `~/tailflow/models`.
3. **The model weights are on disk** under that path, at the exact relative paths listed below.
4. **PyTorch is installed** in `backend/.venv`.

On the last point: `pip install -e ".[classifier]"` installs `timm`, `safetensors`, and `einops` — but **`torch` and `torchvision` are deliberately not declared** as dependencies, because the correct build depends on your CUDA version. Install them yourself, matching your hardware, from pytorch.org. CI installs the `classifier` extra without torch and the suite still passes; that is by design, not an accident.

---

# Models

`SUPPORTED_MODEL_IDS` is `{"jtp-3-hydra", "jtp_pilot", "jtp_pilot2"}`. The API default is `jtp-3-hydra`.

Required files, relative to `MODEL_STORAGE_PATH` (`MODEL_REQUIREMENTS`):

| Model ID | Files |
|---|---|
| `jtp-3-hydra` | `JTP-3/jtp-3-hydra.safetensors` |
| `jtp_pilot` | `JTP_PILOT/JTP_PILOT-e4-vit_so400m_patch14_siglip_384.safetensors`, `JTP_PILOT/tags.json` |
| `jtp_pilot2` | `JTP_PILOT2/JTP_PILOT2-e3-vit_so400m_patch14_siglip_384.safetensors`, `JTP_PILOT2/tags.json` |

Sources are the RedRocket Joint Tagger Project releases on HuggingFace (`MODEL_DOWNLOAD_PROPOSALS`):

* `jtp-3-hydra` — `https://huggingface.co/RedRocket/JTP-3/tree/main/models`
* `jtp_pilot` / `jtp_pilot2` — `https://huggingface.co/RedRocket/JointTaggerProject/tree/main/JTP_PILOT{,2}`

The application **never downloads anything**. When files are missing it returns the proposal URL in `download_proposal_url` and the UI surfaces it as a link. Downloading is the user's job — consistent with the offline-workstation scope in `ARCHITECTURE.md`.

Note the naming inconsistency in the IDs themselves: `jtp-3-hydra` is hyphenated while `jtp_pilot`/`jtp_pilot2` are underscored, and the directory names are uppercase. These strings are matched exactly (after `.strip().lower()`); they are not derived from each other.

---

# Response semantics

`classify_project_image()` checks conditions in this order, and each returns **empty suggestions with an explanatory `download_message`** rather than raising:

1. **Unsupported `model_id`** → `"Unsupported classifier model."`
2. **Required files missing** → `model_available: false` plus the download proposal URL.
3. **`CLASSIFIER_ENABLED=false`** → `"Classifier is disabled. Set CLASSIFIER_ENABLED=true to enable suggestions."`

Only if all three pass does inference run. The route returns **503** when inference itself raises — that is the one genuinely exceptional case.

So: an empty AI card is normal and self-describing. Read `download_message` in the response before debugging anything.

The disabled branch reports `model_available: false` even when the files are present, since a disabled classifier is not usable either way.

---

# Thresholds are not comparable across models

The API takes `threshold` in `[0, 1]` (`ProjectImageClassifyRequest`, default `0.35`). That is a UI-facing scale, not the model's scale.

* **JTP-2 pilots** score in `[0, 1]`. The threshold is used raw.
* **JTP-3 Hydra** scores in `[-1, 1]`. The threshold is remapped `hydra_threshold = threshold * 2.0 - 1.0`, and returned confidences are mapped back with `(v + 1) / 2` so the API always reports `[0, 1]`.

The consequence: **a threshold of 0.35 does not mean the same thing on Hydra as on Pilot2.** On Hydra it corresponds to a raw score of −0.3. Do not "simplify" the remap away.

`max_tags` is clamped to `[1, 128]`, `threshold` to `[0, 1]`, in the service as well as the schema.

---

# Suggestions are filtered by tagging mode

`_collect_suggestions` normalizes each predicted name to `"_".join(name.lower().split())`, then **drops any suggestion not present in the project's catalog CSV** for its `tagging_mode` (`_is_tag_name_allowed_for_mode`, backed by `_CATALOG_NAME_CACHE`).

This check reads `assets/*-tags-list.csv` directly, so it works whether or not `scripts/import_tags.py` has been run. But actually *adding* a suggested tag goes through the API, which needs a `Tag` row — so with an unseeded database the AI card will propose tags that then 422 on click. See `TAG_IMPORT.md`.

A model trained on e621 will therefore return far fewer suggestions for a `booru`-mode project. That is intended filtering, not a bug.

---

# Graceful degradation

All ML imports — `torch`, `timm`, `safetensors`, `einops`, `PIL.ImageCms`, `torchvision` — sit inside a single `try/except` at the top of the module. On failure every symbol is replaced by a `_MissingDependency` sentinel that raises `RuntimeError("Classifier ML dependencies are not installed")` on attribute access, and the exception is stored in `_ML_IMPORT_ERROR`.

**The module always imports cleanly.** This is what lets the API boot, tests run, and CI pass on a machine with no PyTorch. Two blocks near the end of the file are guarded by `if _ML_IMPORT_ERROR is None:` — the `torch.nn.Module` subclasses can only be defined when `torch` is real.

If you add an ML-dependent symbol, add it to that import block and the sentinel fallback. Importing torch anywhere else in the codebase breaks a torch-free install.

---

# Runtime details

* **Device:** `_runtime_device()` returns CUDA when available, else CPU. `_jtp3_runtime_dtype` uses `bfloat16` on CUDA and `float32` on CPU.
* **Caching:** `_JTP2_RUNTIME_CACHE` and `_JTP3_RUNTIME_CACHE` are module-level dicts holding loaded models for the life of the process. The first classify call after startup pays the model-load cost; later ones do not. Changing weights on disk requires a backend restart.
* **JTP-3 architecture is reimplemented inline** as `_Fit`, `_CompositeAlpha`, `_GatedHead`, `_SwiGLU`, `_BatchLinear`, `_Mean`, `_HydraPool`. There is no upstream package to import; these mirror the reference implementation and should not be refactored casually.
* The file opens with `# pyright: reportAttributeAccessIssue=false` and related suppressions, because the sentinel fallback makes static attribute analysis meaningless.

---

# Ad-hoc classification

`POST /api/classify` classifies an uploaded file without a project. It hardcodes `TaggingMode.E621`, `jtp-3-hydra`, `threshold=0.35`, `max_tags=32` via the `classify_image()` wrapper, and returns tag names only — no confidences. It is not used by the workspace UI.
