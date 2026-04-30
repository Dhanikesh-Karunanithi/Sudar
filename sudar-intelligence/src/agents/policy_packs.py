"""
Load YAML policy packs for Sudar Agents (spacing, remediation thresholds).
"""
from pathlib import Path
from typing import Any

import yaml

_PACK_DIR = Path(__file__).resolve().parent / "policies"


def load_policy_pack(pack_id: str) -> dict[str, Any]:
    if pack_id in ("default", "", None):
        path = _PACK_DIR / "default.yaml"
    else:
        path = _PACK_DIR / f"{pack_id}.yaml"
    if not path.is_file():
        path = _PACK_DIR / "default.yaml"
    with open(path, encoding="utf-8") as f:
        raw = yaml.safe_load(f)
    return raw if isinstance(raw, dict) else {}
