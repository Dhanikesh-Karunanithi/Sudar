"""Minimal regression coverage for Sudar Agents policy YAML."""
from pathlib import Path

import yaml


def test_default_policy_yaml_loads():
    path = Path(__file__).resolve().parents[1] / "src" / "agents" / "policies" / "default.yaml"
    assert path.is_file()
    raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    assert raw.get("id") == "default"
    spacing = raw.get("spacing") or {}
    assert "min_gap_days_between_nudges" in spacing


def test_pack_loader_alias():
    import sys
    from pathlib import Path

    root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(root / "src"))
    from agents.policy_packs import load_policy_pack  # noqa: E402

    d = load_policy_pack("default")
    assert isinstance(d, dict)
