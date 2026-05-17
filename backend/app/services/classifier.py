"""Classifier service with JTP model runtime loading and scoring."""

# pyright: reportAttributeAccessIssue=false, reportCallIssue=false, reportArgumentType=false, reportInvalidTypeForm=false, reportGeneralTypeIssues=false

import csv
import json
import logging
from collections.abc import Callable
from contextlib import suppress
from dataclasses import dataclass
from io import BytesIO
from math import ceil
from pathlib import Path
from typing import Any, cast

from app.core.config import default_model_storage_path, settings
from app.core.enums import TaggingMode
from app.services.tag_import import get_catalog_asset_path

try:
    import numpy as np
    import safetensors.torch
    import timm
    import torch
    import torchvision.transforms.functional as tf
    from einops import rearrange
    from PIL import Image
    from PIL.ImageCms import (
        Direction,
        ImageCmsProfile,
        Intent,
        createProfile,
        getDefaultIntent,
        isIntentSupported,
        profileToProfile,
    )
    from PIL.ImageCms import (
        Flags as ImageCmsFlags,
    )
    from PIL.ImageOps import exif_transpose
    from safetensors import safe_open
    from torch.nn import (
        Dropout,
        Flatten,
        Identity,
        LayerNorm,
        Linear,
        Module,
        ModuleList,
        Parameter,
        RMSNorm,
        init,
    )
    from torch.nn.functional import scaled_dot_product_attention, silu
    from torchvision import transforms
    from torchvision.transforms import InterpolationMode

    _ML_IMPORT_ERROR: Exception | None = None
except Exception as exc:  # pragma: no cover - optional runtime dependency

    class _MissingDependency:
        def __getattr__(self, _name: str) -> Any:
            raise RuntimeError("Classifier ML dependencies are not installed")

        def __call__(self, *args: Any, **kwargs: Any) -> Any:
            del args
            del kwargs
            raise RuntimeError("Classifier ML dependencies are not installed")

    _missing = cast(Any, _MissingDependency())
    np = _missing
    safetensors = _missing
    timm = _missing
    torch = _missing
    tf = _missing
    rearrange = _missing
    Image = _missing
    Direction = _missing  # type: ignore[misc]
    ImageCmsFlags = _missing  # type: ignore[misc]
    Intent = _missing  # type: ignore[misc]
    ImageCmsProfile = _missing  # type: ignore[misc]
    createProfile = _missing
    getDefaultIntent = _missing
    isIntentSupported = _missing
    profileToProfile = _missing
    exif_transpose = _missing
    safe_open = _missing  # type: ignore[misc]
    for _symbol in (
        "Buffer",
        "Dropout",
        "Flatten",
        "Identity",
        "LayerNorm",
        "Linear",
        "Module",
        "ModuleList",
        "Parameter",
        "RMSNorm",
    ):
        globals()[_symbol] = cast(Any, object)
    init = _missing
    scaled_dot_product_attention = _missing
    silu = _missing
    transforms = _missing
    InterpolationMode = _missing
    _ML_IMPORT_ERROR = exc

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ClassifierSuggestion:
    name: str
    confidence: float


@dataclass(frozen=True)
class ClassifierModelStatus:
    model_id: str
    model_available: bool
    download_progress_percent: int
    download_proposal_url: str | None
    download_message: str | None


@dataclass(frozen=True)
class ClassifierResult:
    suggestions: list[ClassifierSuggestion]
    model_status: ClassifierModelStatus


SUPPORTED_MODEL_IDS = {
    "jtp-3-hydra",
    "jtp_pilot",
    "jtp_pilot2",
}

CLASSIFIERS_ROOT: Path | None = None

MODEL_REQUIREMENTS: dict[str, tuple[str, ...]] = {
    "jtp-3-hydra": ("JTP-3/jtp-3-hydra.safetensors",),
    "jtp_pilot": (
        "JTP_PILOT/JTP_PILOT-e4-vit_so400m_patch14_siglip_384.safetensors",
        "JTP_PILOT/tags.json",
    ),
    "jtp_pilot2": (
        "JTP_PILOT2/JTP_PILOT2-e3-vit_so400m_patch14_siglip_384.safetensors",
        "JTP_PILOT2/tags.json",
    ),
}

MODEL_DOWNLOAD_PROPOSALS: dict[str, str] = {
    "jtp-3-hydra": "https://huggingface.co/RedRocket/JTP-3/tree/main/models",
    "jtp_pilot": "https://huggingface.co/RedRocket/JointTaggerProject/tree/main/JTP_PILOT",
    "jtp_pilot2": "https://huggingface.co/RedRocket/JointTaggerProject/tree/main/JTP_PILOT2",
}

_JTP2_RUNTIME_CACHE: dict[str, tuple[Any, list[str]]] = {}
_JTP3_RUNTIME_CACHE: dict[str, tuple[Any, list[str]]] = {}
_CATALOG_NAME_CACHE: dict[TaggingMode, set[str]] = {}


def _runtime_device() -> Any:
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def _model_device(model: Any) -> Any:
    return next(model.parameters()).device


def _jtp3_runtime_dtype(device: Any) -> Any:
    # TailTagger uses bfloat16; keep that on CUDA and prefer float32 on CPU.
    if device.type == "cuda":
        return torch.bfloat16
    return torch.float32


async def classify_image(image_path: Path) -> list[str]:
    """Run the classifier on one image and return only tag names."""
    result = await classify_project_image(
        image_path=image_path,
        tagging_mode=TaggingMode.E621,
        model_id="jtp-3-hydra",
        threshold=0.35,
        max_tags=32,
    )
    return [suggestion.name for suggestion in result.suggestions]


async def classify_project_image(
    image_path: Path,
    tagging_mode: TaggingMode,
    model_id: str,
    threshold: float,
    max_tags: int,
) -> ClassifierResult:
    """Run the classifier and return scored suggestions for one project image."""
    normalized_model_id = model_id.strip().lower()
    if normalized_model_id not in SUPPORTED_MODEL_IDS:
        logger.warning("Unsupported classifier model requested: %s", model_id)
        return ClassifierResult(
            suggestions=[],
            model_status=ClassifierModelStatus(
                model_id=normalized_model_id,
                model_available=False,
                download_progress_percent=0,
                download_proposal_url=None,
                download_message="Unsupported classifier model.",
            ),
        )

    model_status = _read_model_status(normalized_model_id)
    if not model_status.model_available:
        return ClassifierResult(suggestions=[], model_status=model_status)

    if not settings.classifier_enabled:
        logger.debug("Classifier disabled; returning empty suggestions.")
        disabled_status = ClassifierModelStatus(
            model_id=model_status.model_id,
            model_available=False,
            download_progress_percent=0,
            download_proposal_url=(
                model_status.download_proposal_url
                or MODEL_DOWNLOAD_PROPOSALS.get(normalized_model_id)
            ),
            download_message=(
                "Classifier is disabled. "
                "Set CLASSIFIER_ENABLED=true to enable suggestions."
            ),
        )
        return ClassifierResult(suggestions=[], model_status=disabled_status)

    normalized_threshold = max(0.0, min(1.0, threshold))
    normalized_max_tags = max(1, min(128, max_tags))

    suggestions = await _run_classifier_with_scores(
        image_path=image_path,
        tagging_mode=tagging_mode,
        model_id=normalized_model_id,
        threshold=normalized_threshold,
        max_tags=normalized_max_tags,
    )
    return ClassifierResult(suggestions=suggestions, model_status=model_status)


def _read_model_status(model_id: str) -> ClassifierModelStatus:
    classifiers_root = _classifier_root()
    required_files = MODEL_REQUIREMENTS[model_id]
    missing_files = [
        relative_path
        for relative_path in required_files
        if not (classifiers_root / relative_path).is_file()
    ]
    if not missing_files:
        return ClassifierModelStatus(
            model_id=model_id,
            model_available=True,
            download_progress_percent=100,
            download_proposal_url=None,
            download_message=None,
        )

    preview = ", ".join(missing_files[:2])
    if len(missing_files) > 2:
        preview = f"{preview}, ..."

    return ClassifierModelStatus(
        model_id=model_id,
        model_available=False,
        download_progress_percent=0,
        download_proposal_url=MODEL_DOWNLOAD_PROPOSALS.get(model_id),
        download_message=(
            f"Model files are missing: {preview}. "
            "Download the model files and place them under MODEL_STORAGE_PATH."
        ),
    )


def _classifier_root() -> Path:
    if CLASSIFIERS_ROOT is not None:
        return CLASSIFIERS_ROOT

    if settings.model_storage_path is not None:
        return settings.model_storage_path.expanduser().resolve()

    return default_model_storage_path()


async def _run_classifier_with_scores(
    image_path: Path,
    tagging_mode: TaggingMode,
    model_id: str,
    threshold: float,
    max_tags: int,
) -> list[ClassifierSuggestion]:
    if _ML_IMPORT_ERROR is not None:
        raise RuntimeError(
            "Classifier dependencies unavailable. "
            "Install ML packages and restart the backend."
        ) from _ML_IMPORT_ERROR

    if model_id == "jtp-3-hydra":
        model, tags = _load_jtp3_runtime()
        patch_data, patch_coords, patch_valid = _preprocess_jtp3(image_path)
        probabilities = _run_jtp3_inference(
            model, patch_data, patch_coords, patch_valid
        )
        # UI threshold is configured in [0, 1], but Hydra runtime scores are in
        # [-1, 1]. Map threshold so user-facing slider semantics remain intuitive.
        hydra_threshold = (threshold * 2.0) - 1.0
        return _collect_suggestions(
            tags,
            probabilities.tolist(),
            hydra_threshold,
            max_tags,
            tagging_mode,
            confidence_transform=lambda value: (value + 1.0) / 2.0,
        )

    if model_id in {"jtp_pilot", "jtp_pilot2"}:
        model, tags = _load_jtp2_runtime(model_id)
        tensor = _preprocess_jtp2(image_path)
        probabilities = _run_jtp2_inference(model, tensor, model_id)
        return _collect_suggestions(
            tags,
            probabilities.tolist(),
            threshold,
            max_tags,
            tagging_mode,
        )

    raise RuntimeError(f"Unsupported classifier model runtime: {model_id}")


def _collect_suggestions(
    tags: list[str],
    scores: list[float],
    threshold: float,
    max_tags: int,
    tagging_mode: TaggingMode,
    confidence_transform: Callable[[float], float] | None = None,
) -> list[ClassifierSuggestion]:
    transform = confidence_transform or (lambda value: value)
    suggestions: list[ClassifierSuggestion] = []
    for index, confidence in enumerate(scores):
        if index >= len(tags):
            break
        normalized_name = _normalize_tag_name_for_mode(tags[index], tagging_mode)
        if not _is_tag_name_allowed_for_mode(normalized_name, tagging_mode):
            continue
        score = float(confidence)
        if score >= threshold:
            output_confidence = max(0.0, min(1.0, transform(score)))
            suggestions.append(
                ClassifierSuggestion(
                    name=normalized_name,
                    confidence=round(output_confidence, 4),
                )
            )
    suggestions.sort(key=lambda item: item.confidence, reverse=True)
    return suggestions[:max_tags]


def _normalize_tag_name_for_mode(name: str, tagging_mode: TaggingMode) -> str:
    del tagging_mode
    normalized = "_".join(name.strip().lower().split())
    return normalized


def _catalog_tag_names_for_mode(tagging_mode: TaggingMode) -> set[str]:
    cached = _CATALOG_NAME_CACHE.get(tagging_mode)
    if cached is not None:
        return cached

    catalog_path = get_catalog_asset_path(tagging_mode)
    names: set[str] = set()
    with catalog_path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            raw_name = row.get("name")
            if raw_name is None:
                continue
            normalized = _normalize_tag_name_for_mode(raw_name, tagging_mode)
            if normalized:
                names.add(normalized)

    _CATALOG_NAME_CACHE[tagging_mode] = names
    return names


def _is_tag_name_allowed_for_mode(name: str, tagging_mode: TaggingMode) -> bool:
    if not name:
        return False
    return name in _catalog_tag_names_for_mode(tagging_mode)


def _resolve_model_file_set(model_id: str) -> tuple[Path, ...] | None:
    root = _classifier_root()
    required = MODEL_REQUIREMENTS.get(model_id)
    if required is None:
        return None
    resolved = tuple(root / relative_path for relative_path in required)
    if all(path.is_file() for path in resolved):
        return resolved
    return None


class _Fit(torch.nn.Module):
    def __init__(
        self,
        bounds: tuple[int, int] | int,
        interpolation: Any = None,
        grow: bool = True,
        pad: float | None = None,
    ) -> None:
        super().__init__()
        self.bounds = (bounds, bounds) if isinstance(bounds, int) else bounds
        self.interpolation = (
            interpolation if interpolation is not None else InterpolationMode.LANCZOS
        )
        self.grow = grow
        self.pad = pad

    def forward(self, img: Any) -> Any:
        wimg, himg = img.size
        hbound, wbound = self.bounds

        hscale = hbound / himg
        wscale = wbound / wimg

        if not self.grow:
            hscale = min(hscale, 1.0)
            wscale = min(wscale, 1.0)

        scale = min(hscale, wscale)
        if scale == 1.0:
            return img

        hnew = min(round(himg * scale), hbound)
        wnew = min(round(wimg * scale), wbound)
        resized = tf.resize(img, [hnew, wnew], self.interpolation)

        if self.pad is None:
            return resized

        hpad = hbound - hnew
        wpad = wbound - wnew
        tpad = hpad // 2
        bpad = hpad - tpad
        lpad = wpad // 2
        rpad = wpad - lpad
        return tf.pad(resized, [lpad, tpad, rpad, bpad], self.pad)


class _CompositeAlpha(torch.nn.Module):
    def __init__(self, background: tuple[float, float, float] | float) -> None:
        super().__init__()
        bg = (
            (background, background, background)
            if isinstance(background, float)
            else background
        )
        self.background = torch.tensor(bg).unsqueeze(1).unsqueeze(2)

    def forward(self, img: Any) -> Any:
        if img.shape[-3] == 3:
            return img

        alpha = img[..., 3, None, :, :]
        img[..., :3, :, :] *= alpha
        background = self.background.expand(-1, img.shape[-2], img.shape[-1])
        img[..., :3, :, :] += (1.0 - alpha) * background
        return img[..., :3, :, :]


class _GatedHead(torch.nn.Module):
    def __init__(self, num_features: int, num_classes: int) -> None:
        super().__init__()
        self.num_classes = num_classes
        self.linear = torch.nn.Linear(num_features, num_classes * 2)
        self.act = torch.nn.Sigmoid()
        self.gate = torch.nn.Sigmoid()

    def forward(self, x: Any) -> Any:
        output = self.linear(x)
        activation_output = output[:, : self.num_classes]
        gate_output = output[:, self.num_classes :]
        return self.act(activation_output) * self.gate(gate_output)


class _SwiGLU(Module):
    def __init__(self, dim: int = -1) -> None:
        super().__init__()
        self.dim = dim

    def forward(self, x: Any) -> Any:
        f, g = x.chunk(2, dim=self.dim)
        return silu(f) * g


class _BatchLinear(Module):
    def __init__(
        self,
        batch_shape: tuple[int, ...] | int,
        in_features: int,
        out_features: int,
        *,
        bias: bool = False,
        flatten: bool = False,
        bias_inplace: bool = True,
        device: Any = None,
        dtype: Any = None,
    ) -> None:
        super().__init__()
        if isinstance(batch_shape, int):
            batch_shape = (batch_shape,)
        elif not batch_shape:
            raise ValueError("At least one batch dimension is required.")

        self.flatten = -(len(batch_shape) + 1) if flatten else 0
        self.weight = Parameter(
            torch.empty(
                *batch_shape, in_features, out_features, device=device, dtype=dtype
            )
        )

        bt = self.weight.flatten(end_dim=-3).mT
        for idx in range(bt.size(0)):
            init.kaiming_uniform_(bt[idx], a=float(np.sqrt(5.0)))

        self.bias = (
            Parameter(
                torch.zeros(*batch_shape, out_features, device=device, dtype=dtype)
            )
            if bias
            else None
        )
        self.bias_inplace = bias_inplace

    def forward(self, x: Any) -> Any:
        output = torch.matmul(x.unsqueeze(-2), self.weight).squeeze(-2)
        if self.bias is not None:
            if self.bias_inplace:
                output.add_(self.bias)
            else:
                output = output + self.bias
        if self.flatten:
            output = output.flatten(self.flatten)
        return output


class _Mean(Module):
    def __init__(
        self, dim: tuple[int, ...] | int = -1, *, keepdim: bool = False
    ) -> None:
        super().__init__()
        self.dim = dim
        self.keepdim = keepdim

    def forward(self, x: Any) -> Any:
        return x.mean(self.dim, self.keepdim)


class _HydraPool(Module):
    def __init__(
        self,
        attn_dim: int,
        head_dim: int,
        n_classes: int,
        *,
        ff_ratio: float = 3.0,
        ff_dropout: float = 0.0,
        input_dim: int = -1,
        output_dim: int = 1,
        device: Any = None,
        dtype: Any = None,
    ) -> None:
        super().__init__()
        if input_dim < 0:
            input_dim = attn_dim
        if attn_dim % head_dim != 0:
            raise ValueError("attn_dim must be divisible by head_dim")

        n_heads = attn_dim // head_dim
        self.head_dim = head_dim
        self.output_dim = output_dim
        self._has_ff = ff_ratio > 0.0

        self.q = Parameter(
            torch.randn(n_heads, n_classes, head_dim, device=device, dtype=dtype)
        )
        self.kv = Linear(
            input_dim, attn_dim * 2, bias=False, device=device, dtype=dtype
        )
        self.qk_norm = RMSNorm(head_dim, eps=1e-5, elementwise_affine=False)

        self.ff_norm: Any
        self.ff_in: Any
        self.ff_act: Any
        self.ff_drop: Any
        self.ff_out: Any

        if self._has_ff:
            hidden_dim = int(attn_dim * ff_ratio)
            self.ff_norm = LayerNorm(attn_dim, device=device, dtype=dtype)
            self.ff_in = Linear(
                attn_dim, hidden_dim * 2, bias=False, device=device, dtype=dtype
            )
            self.ff_act = _SwiGLU()
            self.ff_drop = Dropout(ff_dropout)
            self.ff_out = Linear(
                hidden_dim, attn_dim, bias=False, device=device, dtype=dtype
            )
        else:
            self.ff_norm = Identity()
            self.ff_in = Identity()
            self.ff_act = Identity()
            self.ff_drop = Identity()
            self.ff_out = Identity()

        self.mid_blocks = ModuleList()
        self.out_proj = _BatchLinear(
            n_classes, attn_dim, output_dim * 2, device=device, dtype=dtype
        )
        self.out_act = _SwiGLU()

    def create_head(self) -> Module:
        if self.output_dim == 1:
            return Flatten(-2)
        return _Mean(-1)

    def _forward_attn(self, x: Any, attn_mask: Any) -> tuple[Any, Any, Any]:
        q = self.qk_norm(self.q).expand(*x.shape[:-2], -1, -1, -1)
        kv = self.kv(x)
        k, v = rearrange(
            kv, "... s (n h e) -> n ... h s e", n=2, e=self.head_dim
        ).unbind(0)
        k = self.qk_norm(k)
        x_attn = scaled_dot_product_attention(q, k, v, attn_mask=attn_mask)
        return rearrange(x_attn, "... h s e -> ... s (h e)"), k, v

    def _forward_ff(self, x: Any) -> Any:
        if not self._has_ff:
            return x
        f = self.ff_norm(x)
        f = self.ff_in(f)
        f = self.ff_act(f)
        f = self.ff_drop(f)
        f = self.ff_out(f)
        return x + f

    def _forward_out(self, x: Any) -> Any:
        x = self.out_proj(x)
        return self.out_act(x)

    def forward(self, x: Any, attn_mask: Any = None) -> Any:
        x, _, _ = self._forward_attn(x, attn_mask)
        x = self._forward_ff(x)
        return self._forward_out(x)

    @staticmethod
    def for_state(
        state_dict: dict[str, Any],
        prefix: str = "",
        *,
        ff_dropout: float = 0.0,
        device: Any = None,
        dtype: Any = None,
    ) -> "_HydraPool":
        n_heads, n_classes, head_dim = state_dict[f"{prefix}q"].shape
        attn_dim = n_heads * head_dim
        input_dim = state_dict[f"{prefix}kv.weight"].size(1)
        output_dim = state_dict[f"{prefix}out_proj.weight"].size(2) // 2
        ff_out_weight = state_dict.get(f"{prefix}ff_out.weight")
        hidden_dim = ff_out_weight.size(1) + 0.5 if ff_out_weight is not None else 0
        ff_ratio = hidden_dim / attn_dim if attn_dim > 0 else 0.0
        return _HydraPool(
            attn_dim=attn_dim,
            head_dim=head_dim,
            n_classes=n_classes,
            ff_ratio=ff_ratio,
            ff_dropout=ff_dropout,
            input_dim=input_dim,
            output_dim=output_dim,
            device=device,
            dtype=dtype,
        )


def _sdpa_attn_mask(
    patch_valid: Any,
    num_prefix_tokens: int = 0,
    symmetric: bool = True,
    q_len: int | None = None,
    dtype: Any = None,
) -> Any:
    del symmetric
    del q_len
    del dtype
    mask = patch_valid.unflatten(-1, (1, 1, -1))
    if num_prefix_tokens:
        prefix = torch.ones(
            *mask.shape[:-1],
            num_prefix_tokens,
            device=patch_valid.device,
            dtype=torch.bool,
        )
        mask = torch.cat((prefix, mask), dim=-1)
    return mask


if _ML_IMPORT_ERROR is None:
    timm.models.naflexvit.create_attention_mask = _sdpa_attn_mask


def _load_jtp2_runtime(model_id: str) -> tuple[Any, list[str]]:
    cached = _JTP2_RUNTIME_CACHE.get(model_id)
    if cached is not None:
        return cached

    files = _resolve_model_file_set(model_id)
    if files is None:
        raise FileNotFoundError(f"Required files not found for model '{model_id}'.")

    model_path, tags_path = files
    with tags_path.open("r", encoding="utf-8") as handle:
        allowed_tags_dict = json.load(handle)
    allowed_tags = [
        tag for tag, _idx in sorted(allowed_tags_dict.items(), key=lambda x: x[1])
    ]

    model = timm.create_model(
        "vit_so400m_patch14_siglip_384.webli",
        pretrained=False,
        num_classes=len(allowed_tags),
    )
    if model_id == "jtp_pilot2":
        model_head = cast(Any, model.head)
        num_features = int(model_head.in_features)
        model.head = _GatedHead(num_features, len(allowed_tags))

    state_dict = safetensors.torch.load_file(str(model_path), device="cpu")
    model.load_state_dict(state_dict, strict=True)
    model.eval().to(device=_runtime_device())
    _JTP2_RUNTIME_CACHE[model_id] = (model, allowed_tags)
    return model, allowed_tags


def _load_jtp3_runtime() -> tuple[Any, list[str]]:
    cache_key = "jtp-3-hydra"
    cached = _JTP3_RUNTIME_CACHE.get(cache_key)
    if cached is not None:
        return cached

    files = _resolve_model_file_set(cache_key)
    if files is None:
        raise FileNotFoundError("Required files not found for model 'jtp-3-hydra'.")

    model_path = files[0]
    safe_open_fn = cast(Any, safe_open)
    with safe_open_fn(str(model_path), framework="pt", device="cpu") as file:
        metadata = file.metadata() or {}
        tensor_keys = file.keys()
        state_dict = {key: file.get_tensor(key) for key in tensor_keys}

    arch = metadata.get("modelspec.architecture")
    if not isinstance(arch, str) or not arch.startswith(
        "naflexvit_so400m_patch16_siglip"
    ):
        raise ValueError(f"Unrecognized model architecture: {arch}")

    labels = metadata.get("classifier.labels")
    if not isinstance(labels, str) or not labels.strip():
        raise ValueError("Missing classifier.labels metadata in JTP-3 model")
    tags = labels.split("\n")

    device = _runtime_device()
    runtime_dtype = _jtp3_runtime_dtype(device)

    model = timm.create_model(
        "naflexvit_so400m_patch16_siglip",
        pretrained=False,
        num_classes=0,
        pos_embed_interp_mode="bilinear",
        weight_init="skip",
        fix_init=False,
        device="cpu",
        dtype=runtime_dtype,
    )

    arch_suffix = arch[31:]
    if arch_suffix != "+rr_hydra":
        raise ValueError(f"Unsupported JTP-3 architecture suffix: {arch_suffix}")

    model.attn_pool = _HydraPool.for_state(
        state_dict,
        "attn_pool.",
        device=device,
        dtype=runtime_dtype,
    )
    model.head = model.attn_pool.create_head()
    cast(Any, model).num_classes = len(tags)

    model.eval().to(dtype=runtime_dtype)
    model.load_state_dict(state_dict, strict=True)
    model.to(device=device)

    _JTP3_RUNTIME_CACHE[cache_key] = (model, tags)
    return model, tags


def _jtp2_transform() -> Any:
    return transforms.Compose(
        [
            _Fit((384, 384)),
            transforms.ToTensor(),
            _CompositeAlpha(0.5),
            transforms.Normalize(
                mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5], inplace=True
            ),
            transforms.CenterCrop((384, 384)),
        ]
    )


def _preprocess_jtp2(image_path: Path) -> Any:
    transform = _jtp2_transform()
    with Image.open(image_path) as img:
        image = img.convert("RGBA")
        tensor = transform(image)
    return tensor.unsqueeze(0)


def _run_jtp2_inference(model: Any, tensor: Any, model_id: str) -> Any:
    device = _model_device(model)
    tensor = tensor.to(device=device, non_blocking=True)

    with torch.no_grad():
        logits = model(tensor)
    if model_id == "jtp_pilot2":
        probabilities = logits[0]
    else:
        probabilities = torch.nn.functional.sigmoid(logits[0])
    return probabilities.cpu()


_SRGB_PROFILE: Any
_INTENT_FLAGS: dict[Any, Any]

if _ML_IMPORT_ERROR is None:
    Image.MAX_IMAGE_PIXELS = None
    _SRGB_PROFILE = createProfile(colorSpace="sRGB")
    _INTENT_FLAGS = {
        Intent.PERCEPTUAL: ImageCmsFlags.HIGHRESPRECALC,
        Intent.RELATIVE_COLORIMETRIC: (
            ImageCmsFlags.HIGHRESPRECALC | ImageCmsFlags.BLACKPOINTCOMPENSATION
        ),
        Intent.ABSOLUTE_COLORIMETRIC: ImageCmsFlags.HIGHRESPRECALC,
    }
else:
    _SRGB_PROFILE = None
    _INTENT_FLAGS = {}


def _coalesce_intent(intent: Any) -> Any:
    if isinstance(intent, Intent):
        return intent
    if intent == 0:
        return Intent.PERCEPTUAL
    if intent == 1:
        return Intent.RELATIVE_COLORIMETRIC
    if intent == 2:
        return Intent.SATURATION
    if intent == 3:
        return Intent.ABSOLUTE_COLORIMETRIC
    raise ValueError("invalid intent")


def _process_srgb(
    img: Any,
    *,
    resize: Callable[[tuple[int, int]], tuple[int, int] | None]
    | tuple[int, int]
    | None = None,
) -> Any:
    img.load()
    with suppress(Exception):
        exif_transpose(img, in_place=True)

    size = (img.width, img.height)

    icc_raw = img.info.get("icc_profile")
    if icc_raw is not None:
        try:
            profile = ImageCmsProfile(BytesIO(icc_raw))

            working_mode = img.mode
            if img.mode.startswith(("RGB", "BGR", "P")):
                working_mode = "RGBA" if img.has_transparency_data else "RGB"
            elif img.mode.startswith(("L", "I", "F")) or img.mode == "1":
                working_mode = "LA" if img.has_transparency_data else "L"

            if img.mode != working_mode:
                img = img.convert(working_mode)

            mode = "RGBA" if img.has_transparency_data else "RGB"

            intent = Intent.RELATIVE_COLORIMETRIC
            if isIntentSupported(profile, intent, Direction.INPUT) != 1:
                intent = _coalesce_intent(getDefaultIntent(profile))

            flags = _INTENT_FLAGS.get(intent)
            if flags is None:
                raise RuntimeError("Unsupported intent")

            if img.mode == mode:
                profileToProfile(
                    img,
                    profile,
                    _SRGB_PROFILE,
                    renderingIntent=intent,
                    inPlace=True,
                    flags=flags,
                )
            else:
                img = profileToProfile(
                    img,
                    profile,
                    _SRGB_PROFILE,
                    renderingIntent=intent,
                    outputMode=mode,
                    flags=flags,
                )
        except Exception:
            pass

    if img.has_transparency_data:
        if img.mode != "RGBa":
            try:
                img = img.convert("RGBa")
            except ValueError:
                img = img.convert("RGBA").convert("RGBa")
    elif img.mode != "RGB":
        img = img.convert("RGB")

    if resize is not None and not isinstance(resize, tuple):
        resize = resize(size)
    if resize is not None and size != resize:
        img = img.resize(resize, Image.Resampling.LANCZOS, reducing_gap=3.0)

    return img


def _put_srgb_patch(
    img: Any,
    patch_data: Any,
    patch_coord: Any,
    patch_valid: Any,
    patch_size: int,
) -> None:
    if img.mode not in ("RGB", "RGBA", "RGBa"):
        raise ValueError(f"Image has non-RGB mode {img.mode}.")

    patches = rearrange(
        np.asarray(img)[:, :, :3],
        "(h p1) (w p2) c -> h w (p1 p2 c)",
        p1=patch_size,
        p2=patch_size,
    )
    coords = np.stack(
        np.meshgrid(
            np.arange(patches.shape[0], dtype=np.int16),
            np.arange(patches.shape[1], dtype=np.int16),
            indexing="ij",
        ),
        axis=-1,
    )

    coords = rearrange(coords, "h w c -> (h w) c")
    patches = rearrange(patches, "h w p -> (h w) p")
    count = patches.shape[0]

    np.copyto(patch_data[:count].numpy(), patches, casting="no")
    np.copyto(patch_coord[:count].numpy(), coords, casting="no")
    patch_valid[:count] = True


def _get_image_size_for_seq(
    image_hw: tuple[int, int],
    patch_size: int = 16,
    max_seq_len: int = 1024,
    max_ratio: float = 1.0,
    eps: float = 1e-5,
) -> tuple[int, int]:
    h, w = image_hw
    max_py = int(max((h * max_ratio) // patch_size, 1))
    max_px = int(max((w * max_ratio) // patch_size, 1))

    if (max_py * max_px) <= max_seq_len:
        return max_py * patch_size, max_px * patch_size

    def patchify(ratio: float) -> tuple[int, int]:
        return (
            min(int(ceil((h * ratio) / patch_size)), max_py),
            min(int(ceil((w * ratio) / patch_size)), max_px),
        )

    py, px = patchify(eps)
    if (py * px) > max_seq_len:
        raise ValueError(f"Image of size {w}x{h} is too large.")

    ratio = eps
    while (max_ratio - ratio) >= eps:
        mid = (ratio + max_ratio) / 2.0
        mpy, mpx = patchify(mid)
        seq_len = mpy * mpx

        if seq_len > max_seq_len:
            max_ratio = mid
            continue

        ratio = mid
        py = mpy
        px = mpx
        if seq_len == max_seq_len:
            break

    return py * patch_size, px * patch_size


def _preprocess_jtp3(
    image_path: Path,
    patch_size: int = 16,
    max_seq_len: int = 1024,
) -> tuple[Any, Any, Any]:
    with image_path.open("rb", buffering=(1024 * 1024)) as file:
        img = Image.open(file)
        try:

            def compute_resize(wh: tuple[int, int]) -> tuple[int, int]:
                h, w = _get_image_size_for_seq((wh[1], wh[0]), patch_size, max_seq_len)
                return w, h

            processed = _process_srgb(img, resize=compute_resize)
        except Exception:
            img.close()
            raise

    if img is not processed:
        img.close()

    patches = torch.zeros(max_seq_len, patch_size * patch_size * 3, dtype=torch.uint8)
    patch_coords = torch.zeros(max_seq_len, 2, dtype=torch.int16)
    patch_valid = torch.zeros(max_seq_len, dtype=torch.bool)
    _put_srgb_patch(processed, patches, patch_coords, patch_valid, patch_size)
    return patches, patch_coords, patch_valid


def _run_jtp3_inference(model: Any, patches: Any, coords: Any, valid: Any) -> Any:
    device = _model_device(model)
    runtime_dtype = _jtp3_runtime_dtype(device)

    patches = patches.unsqueeze(0).to(device=device, non_blocking=True)
    coords = coords.unsqueeze(0).to(device=device, non_blocking=True)
    valid = valid.unsqueeze(0).to(device=device, non_blocking=True)

    patches = patches.to(dtype=runtime_dtype).div_(127.5).sub_(1.0)
    coords = coords.to(dtype=torch.int32)

    with torch.no_grad():
        logits = model(patches, coords, valid)
        probabilities = logits.float().sigmoid()[0]
        # TailTagger rescales Hydra scores from [0, 1] into [-1, 1].
        probabilities = (probabilities * 2.0) - 1.0

    return probabilities.cpu()


