## Plan: Project-Scoped Kohya Training Panel

Build a project-scoped Training mode in TailFlow that replaces the center canvas view and orchestrates Kohya runs end-to-end with manual path configuration, SSE progress streaming, DB-backed run journaling, guarded GPU/model handoff, and automatic LoRA artifact handoff to ComfyUI. Keep classifier runtime visibility (loaded state, device, approximate GPU usage) but do not implement classifier reactivation controls. Add deterministic Kohya failure detection and a failure popup that provides one-click copy of a structured troubleshooting prompt for Copilot/ChatGPT.

**Phase 1 Contract**

Phase 1 freezes the data and transport contract before implementation starts.

1. Run lifecycle states are `queued`, `starting`, `running`, `stopping`, `completed`, and `aborted_uncompleted`.
2. `completed` is terminal success with no failure reason.
3. `aborted_uncompleted` is terminal non-success and must always carry a normalized reason code plus a user-facing message.
4. V1 reason codes are `cancelled_by_user`, `kohya_error_oom`, `kohya_error_config`, `kohya_error_process_exit`, and `kohya_error_unknown`.
5. The orchestrator, not the UI, maps raw process exit data and log output to the normalized reason code.
6. Starting a new training run while one is active returns a conflict response that includes the active run id.
7. Stopping with no active run is a successful no-op.
8. Cancelling the GPU unload confirmation before start records `aborted_uncompleted` with `cancelled_by_user` and does not start Kohya.
9. Stopping a running job maps to `aborted_uncompleted` with `cancelled_by_user`.
10. SSE is the transport for progress and terminal state updates in v1, using native `EventSource` on the frontend and a streaming response on the backend.
11. On reconnect, the backend replays the latest snapshot and last terminal event so the UI can recover after a transient disconnect.
12. The UI must show read-only classifier runtime status: loaded/unloaded, active device, and approximate GPU memory usage.
13. The UI must show a failure popup on aborted or failed runs, with a Copy support prompt action.
14. The support prompt must include run metadata, sanitized config snapshot, normalized reason code, log tail, environment summary, and recovery hints.
15. OOM and other Kohya errors use a general error mapping in v1; fine-grained classification can be refined later.

**Steps**
1. Phase 1 - Architecture and data contract
2. Define API contract for Training mode around one active server job: config read/update, preflight validation, start/stop, live status stream, run history, run detail payloads, classifier runtime status endpoint, and run-failure diagnostic payloads (*blocks all later phases*).
3. Define clear scope boundaries for v1: project-scoped training mode replaces center canvas, tagging flow hidden in training mode, one active job globally, no auto path detection, manual path validation only (*depends on 2*).
4. Finalize GPU handoff contract: before start, if JTP runtime is loaded on CUDA, show confirmation dialog; unload only on confirm; if user cancels, do not start training and record an aborted-uncompleted run outcome with reason `cancelled_by_user` (*depends on 2*).
5. Finalize run outcome taxonomy: persist terminal states and reasons including success (completed), aborted-uncompleted (`cancelled_by_user`, `kohya_error_oom`, `kohya_error_config`, `kohya_error_process_exit`, `kohya_error_unknown`) with normalized machine-readable reason codes (*depends on 2*).
6. Finalize failure-assistant contract: on terminal run failure, system must emit normalized reason code plus generated troubleshooting prompt text that includes key run context and redacted logs for clipboard copy (*depends on 2*).

7. Phase 2 - Persistence and backend domain model
8. Add DB schema for training templates and runs with immutable config snapshot per run plus lifecycle timestamps and summary metrics (duration, total steps, average/final loss, output artifact paths, terminal status, failure classification fields) (*depends on 2*).
9. Add backend service layer for training orchestration: preflight checks (paths, writable dirs, dataset/training layout), process spawn, stdout/stderr parser, in-memory active-job registry, graceful stop, completion handling, artifact move to ComfyUI LoRA folder, terminal failure detection/classification, and aborted-uncompleted status persistence (*depends on 8*).
10. Add explicit environment/path configuration support for manual Kohya and Comfy locations with startup validation and runtime validation messages (*parallel with 9 after 8*).
11. Extend classifier runtime service contract to expose read-only status: loaded/unloaded state, active device (cpu/cuda), and approximate memory usage (reserved/allocated MB if CUDA available, otherwise null); no reactivation action in v1 (*depends on 9*).
12. Add diagnostic prompt builder service that composes a support-ready prompt from run metadata, sanitized config snapshot, failure code, summarized stderr tail, environment info, and attempted recovery hints (*depends on 9*).

13. Phase 3 - API surface and streaming
14. Add project-scoped training endpoints under existing project route conventions for: get/update training config, run preflight, start run, stop run, fetch run history, fetch run detail, fetch latest run summary (*depends on 9 and 10*).
15. Add SSE endpoint for active run progress/events (state changes, parsed step/loss, warnings, completion summary, terminal failure event, aborted-uncompleted event). Ensure reconnect behavior includes current snapshot and last known metrics (*depends on 14*).
16. Add classifier status endpoint (read-only) for runtime hinting in UI; exclude reactivation/unload buttons outside training-start flow (*depends on 11*).
17. Add failure diagnostics endpoint (or include in run detail) that returns generated copy-ready troubleshooting prompt text and structured failure context for popup actions (*depends on 12 and 14*).
18. Add API-level guardrails: reject concurrent starts while one run active, reject stop when no run active, and return stable machine-readable error payloads for UI dialogs (*depends on 14*).

19. Phase 4 - Frontend training mode UX
20. Introduce new center panel mode in workspace state to switch between project browser, canvas, and training mode while preserving existing project-scoped visibility rules (*depends on 2*).
21. Build Training mode UI with sections: installation paths, dataset->training generation controls, editable training config form, run controls, classifier runtime status hint, live progress, and run history (*depends on 20 and 14*).
22. Implement start confirmation dialog when classifier GPU unload is required; display expected action and allow cancel/continue. Cancel path records aborted-uncompleted reason `cancelled_by_user` (*depends on 21 and 11*).
23. Implement classifier status hint UI: clearly show loaded/unloaded, device, and approximate GPU memory usage with caveat label (estimate) (*depends on 21 and 16*).
24. Implement completion popup containing useful summary fields: training time, total steps, average loss, final loss, output file path, and Comfy move result (*depends on 15 and 21*).
25. Implement failure popup flow: on failure/aborted event, show concise reason + actions including Copy support prompt; clicking action copies generated prompt text to clipboard and confirms copy success; include optional second action to open the run detail drawer (*depends on 15, 17, and 21*).
26. Hide tagging workflow interactions while training mode is active, but keep project scope behavior and route sync consistent on desktop/mobile (*depends on 20*).

27. Phase 5 - Validation and operational hardening
28. Add backend tests for preflight validation, single-active-job constraints, lifecycle transitions, SSE payload contract, run journaling, artifact move behavior, aborted-uncompleted status reasons, failure classification, and diagnostic prompt generation (*depends on 14-18*).
29. Add frontend unit/e2e coverage for mode switching, form editing, start/stop flow, live progress rendering, classifier status hints, completion popup, failure popup, aborted reason display, and clipboard copy action (*depends on 21-26*).
30. Add manual verification checklist for path setup (Kohya/Comfy), training folder generation rules, unload-confirm flow, aborted-by-user run outcome, OOM/error run outcomes, failure copy-prompt flow, and artifact availability in Comfy LoRA directory (*depends on 28-29*).
31. Update docs for new Training mode, admin/path setup, GPU handoff behavior, run outcome taxonomy, failure troubleshooting popup usage, and operator workflow including failure cases and recovery guidance (*depends on 30*).

**Relevant files**
- /home/pablo/projects/tailflow/docs/AQUA_TRAINING_HANDOFF.md — source contract for dataset->training generation and required config fields.
- /home/pablo/projects/tailflow/docs/project-dataset-workflow.md — project-scoped semantics and filesystem sync constraints to preserve.
- /home/pablo/projects/tailflow/.github/ui-contract.md — componentization and UI architecture constraints.
- /home/pablo/projects/tailflow/frontend/src/pages/WorkspacePage.vue — center panel orchestration entry point.
- /home/pablo/projects/tailflow/frontend/src/pages/workspace/useWorkspacePanelState.ts — center panel view state and visibility logic.
- /home/pablo/projects/tailflow/frontend/src/pages/workspace/side-card-types.ts — center panel/card type contracts.
- /home/pablo/projects/tailflow/frontend/src/pages/workspace/side-card-service.ts — card registration and config assembly patterns.
- /home/pablo/projects/tailflow/frontend/src/stores/projects.ts — selected project context and project-level metadata access.
- /home/pablo/projects/tailflow/backend/app/api/routes/projects.py — existing project-scoped endpoint conventions.
- /home/pablo/projects/tailflow/backend/app/services/classifier.py — runtime GPU/model read-only status and unload behavior for training handoff.
- /home/pablo/projects/tailflow/backend/app/core/config.py — manual path settings and validation extension point.
- /home/pablo/projects/tailflow/backend/app/schemas/project.py — response/schema extension patterns for project-scoped APIs.
- /home/pablo/projects/tailflow/backend/alembic/versions/0005_shared_image_tag_assignments.py — latest migration baseline reference for adding training tables.

**Verification**
1. Backend static checks: run ruff and mypy on backend after adding models/services/routes.
2. Backend targeted tests: run training service/unit tests for lifecycle and parser behavior, then project route tests for start/stop/history and SSE contracts.
3. Backend classifier-status tests: verify status fields (loaded/device/memory estimate) and no reactivation action exposed in v1.
4. Backend failure-diagnostics tests: verify known Kohya failure patterns map to expected reason codes and generated prompt includes required fields while redacting sensitive values.
5. Backend run-outcome tests: verify cancelled start and cancelled running job both persist aborted-uncompleted with correct reason codes.
6. Frontend static checks: run eslint, vue-tsc, and vitest for training mode components/composables/stores.
7. Frontend e2e: verify project selection -> training mode -> JTP loaded hint -> start confirmation -> cancel leads to aborted-uncompleted reason -> forced error leads to kohya error reason -> failure popup copy prompt action works -> completion popup on success path.
8. Integration validation with real paths: confirm generated repeat folder under training parent, successful training completion, safetensors moved into configured Comfy LoRA directory, and useful failure prompt quality on induced fault.

**Decisions**
- Implement now: no, this is planning-only output for handoff.
- Kohya location: manual setting only in TailFlow config (no auto-discovery in v1).
- Comfy location: manual setting only in TailFlow config (no auto-discovery in v1).
- GPU protection: prompt user each start when unload is needed; unload only on confirm.
- Reactivation: out of scope for v1.
- Runtime hinting: UI must show JTP loaded/unloaded, device, and approximate GPU usage.
- Run outcomes: persist aborted-uncompleted outcomes with reason codes for user cancellation and Kohya errors (OOM/config/process/unknown).
- Failure handling: detect terminal Kohya failure, show popup, and provide one-click copy of generated troubleshooting prompt for Copilot/ChatGPT.
- Runner concurrency: single active training job per server in v1.
- Live updates: SSE stream as primary transport.
- Journaling: DB-backed run and config snapshots.
- UX layout: training mode replaces center canvas and hides tagging workflow while active.

**Further Considerations**
1. Prompt template quality: keep a versioned diagnostic prompt template so output stays consistent and testable over time.
2. Approximation method: choose one canonical GPU estimate source (`torch.cuda.memory_reserved` preferred for stability) and document it as process-level estimate, not exact model-only usage.
3. SSE resilience: include optional snapshot polling endpoint for reconnect/fallback situations.