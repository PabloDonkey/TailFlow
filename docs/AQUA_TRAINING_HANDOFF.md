# Aqua Training Handoff (for external project)

Date: 2026-05-29

## Goal
The external project owns only the dataset source. Kohya training for Aqua needs extra generated folders and config values.

This document defines:
- what folders/files must exist
- how to generate them from dataset only
- which JSON fields must be set
- what agents are available and how to use them

## Required Aqua layout

Expected project layout:

- /home/pablo/projects/ai/lora_training/projects/Aqua/dataset
  - Source images and captions managed by external project
- /home/pablo/projects/ai/lora_training/projects/Aqua/training
  - Generated training input for Kohya
  - Must contain repeat-named subfolder(s), for example: 3_4qua
- /home/pablo/projects/ai/lora_training/projects/Aqua/aqua_config.json
  - Main training config
- /home/pablo/projects/ai/lora_training/projects/Aqua/aqua_lora
  - Output checkpoints and logs

Important Kohya rule:
- train_data_dir must be the parent folder that contains repeat subfolders.
- Example repeat subfolder format: N_name, where N is repeat count.
- Example: 3_4qua

## Generation flow (dataset -> training)

Use this when dataset is the only known input.

```bash
#!/usr/bin/env bash
set -euo pipefail

AQUA_ROOT="/home/pablo/projects/ai/lora_training/projects/Aqua"
DATASET_DIR="$AQUA_ROOT/dataset"
TRAINING_DIR="$AQUA_ROOT/training"
REPEAT=3
SUBJECT="4qua"
TARGET_DIR="$TRAINING_DIR/${REPEAT}_${SUBJECT}"

mkdir -p "$TARGET_DIR"

# Clean only generated files inside target repeat folder.
find "$TARGET_DIR" -maxdepth 1 -type f \( \
  -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' -o -iname '*.bmp' -o -iname '*.txt' \
\) -delete

# Case A: dataset is flat (image/txt files directly inside dataset)
if find "$DATASET_DIR" -maxdepth 1 -type f | grep -qiE '\\.(jpg|jpeg|png|webp|bmp)$'; then
  find "$DATASET_DIR" -maxdepth 1 -type f \( \
    -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' -o -iname '*.bmp' -o -iname '*.txt' \
  \) -exec cp -f {} "$TARGET_DIR" \;
fi

# Case B: dataset contains repeat folders already (for example 3_4qua, 2_char)
# Copy all supported files from one level below dataset.
find "$DATASET_DIR" -mindepth 2 -maxdepth 2 -type f \( \
  -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' -o -iname '*.bmp' -o -iname '*.txt' \
\) -exec cp -f {} "$TARGET_DIR" \;

# Optional cleanup for temporary backup-like files
find "$TARGET_DIR" -maxdepth 1 -type f -name '*~' -delete

# Validate counts
img_count=$(find "$TARGET_DIR" -maxdepth 1 -type f | grep -Eic '\\.(jpg|jpeg|png|webp|bmp)$' || true)
txt_count=$(find "$TARGET_DIR" -maxdepth 1 -type f | grep -Eic '\\.txt$' || true)

echo "Generated: $TARGET_DIR"
echo "Images: $img_count"
echo "Captions: $txt_count"

if [[ "$img_count" -eq 0 ]]; then
  echo "ERROR: no images generated in training repeat folder" >&2
  exit 1
fi
```

## Required JSON config values

In aqua_config.json, these values must be set:

- train_data_dir: /home/pablo/projects/ai/lora_training/projects/Aqua/training
- logging_dir: /home/pablo/projects/ai/lora_training/projects/Aqua/aqua_lora/log
- output_dir: /home/pablo/projects/ai/lora_training/projects/Aqua/aqua_lora

Recommended Aqua training values currently used:

- train_batch_size: 2
- max_train_epochs: 30
- max_train_steps: 990
- optimizer: prodigy
- sdxl: true

Reason for 30/990 with repeat=3 and 22 images:

- total raw steps = (images x repeat x epochs) / batch
- total raw steps = (22 x 3 x 30) / 2 = 990
- effective steps at batch 2 are approximately 1980 (close to 2000 target baseline)

## Quick validation checks

Run before launching training:

```bash
AQUA_ROOT="/home/pablo/projects/ai/lora_training/projects/Aqua"

find "$AQUA_ROOT/training" -maxdepth 2 -type d | sort
rg -n '"train_data_dir"|"logging_dir"|"max_train_epochs"|"max_train_steps"|"train_batch_size"' "$AQUA_ROOT/aqua_config.json"
find "$AQUA_ROOT/training/3_4qua" -maxdepth 1 -type f | head
```

## Agents info

### 1) LoRA knowledge agent (local)
Location:
- /home/pablo/projects/ai/lora_training/agent/lora_agent.py

Purpose:
- Interactive Q&A for LoRA and LyCORIS best practices (dataset, tagging, Kohya settings, troubleshooting).

Usage:

```bash
cd /home/pablo/projects/ai/lora_training/agent
python3 lora_agent.py
python3 lora_agent.py "how many images for character lora"
python3 lora_agent.py --topic settings
```

### 2) Copilot subagent: Explore
Purpose:
- Fast read-only codebase exploration and Q&A in VS Code.

Use when:
- You need to locate config paths, folder conventions, or training values quickly across files.

## Notes

- The transformers clean_up_tokenization_spaces warning is informational and not the cause of No data found.
- No data found is usually a folder-layout mismatch: train_data_dir must point to a parent folder containing repeat subfolders.
