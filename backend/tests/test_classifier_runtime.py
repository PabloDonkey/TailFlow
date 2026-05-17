"""Unit tests for classifier runtime device selection and tensor placement."""

from app.services import classifier


class _FakeParam:
    def __init__(self, device: str) -> None:
        self.device = device


class _FakeModel:
    def __init__(self, device: str, logits: object) -> None:
        self._device = device
        self._logits = logits

    def parameters(self):
        yield _FakeParam(self._device)

    def __call__(self, _tensor: object) -> object:
        return self._logits


class _FakeTensor:
    def __init__(self) -> None:
        self.to_calls: list[dict[str, object]] = []

    def to(self, *, device: object, non_blocking: bool) -> "_FakeTensor":
        self.to_calls.append({"device": device, "non_blocking": non_blocking})
        return self


class _FakeProbabilities:
    def __init__(self) -> None:
        self.cpu_called = False

    def cpu(self) -> "_FakeProbabilities":
        self.cpu_called = True
        return self


class _FakeLogits:
    def __init__(self, first_item: _FakeProbabilities) -> None:
        self._first_item = first_item

    def __getitem__(self, index: int) -> _FakeProbabilities:
        if index != 0:
            raise IndexError(index)
        return self._first_item


def test_runtime_device_prefers_cuda_when_available(
    monkeypatch,
) -> None:
    monkeypatch.setattr(classifier.torch.cuda, "is_available", lambda: True)

    assert str(classifier._runtime_device()) == "cuda"


def test_runtime_device_falls_back_to_cpu_when_cuda_unavailable(
    monkeypatch,
) -> None:
    monkeypatch.setattr(classifier.torch.cuda, "is_available", lambda: False)

    assert str(classifier._runtime_device()) == "cpu"


def test_run_jtp2_inference_moves_tensor_to_model_device() -> None:
    probabilities = _FakeProbabilities()
    logits = _FakeLogits(probabilities)
    model = _FakeModel(device="cuda:0", logits=logits)
    tensor = _FakeTensor()

    result = classifier._run_jtp2_inference(model, tensor, model_id="jtp_pilot2")

    assert tensor.to_calls == [{"device": "cuda:0", "non_blocking": True}]
    assert probabilities.cpu_called is True
    assert result is probabilities
