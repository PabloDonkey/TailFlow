import sys
from pathlib import Path

# Make "import triage" work when pytest runs from the repository root.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
