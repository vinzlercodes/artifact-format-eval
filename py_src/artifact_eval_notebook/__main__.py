from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any


ROOT = Path.cwd()


def stable_json(value: Any) -> str:
    if value is None or not isinstance(value, (dict, list)):
        return json.dumps(value, separators=(",", ":"))
    if isinstance(value, list):
        return "[" + ",".join(stable_json(item) for item in value) + "]"
    return "{" + ",".join(json.dumps(key) + ":" + stable_json(value[key]) for key in sorted(value)) + "}"


def source_hash(value: Any) -> str:
    return "sha256:" + hashlib.sha256(stable_json(value).encode("utf-8")).hexdigest()


def load_case(case: str) -> dict[str, Any]:
    if case != "prior-auth":
        raise SystemExit(f"Unsupported case: {case}")
    return json.loads((ROOT / "cases" / "prior-auth" / "canonical.json").read_text(encoding="utf-8"))


def build_notebook(case: str) -> Path:
    canonical = load_case(case)
    metadata = {
        "source_hash": source_hash(canonical),
        "generator": "notebook@0.1.0",
        "schema_version": canonical["schema_version"],
        "case_id": canonical["case_id"],
    }
    notebook = {
        "cells": [
            {
                "id": "summary",
                "cell_type": "markdown",
                "metadata": {},
                "source": ["# Prior Authorization Notebook Report\n", canonical["summary"]],
            },
            {
                "id": "case-fields",
                "cell_type": "code",
                "execution_count": None,
                "metadata": {},
                "outputs": [],
                "source": [
                    f"case_status = {canonical['status']!r}\n",
                    f"required_documentation_count = {canonical['required_documentation_count']}\n",
                ],
            },
            {
                "id": "evidence-count",
                "cell_type": "markdown",
                "metadata": {},
                "source": [f"Evidence items: {len(canonical['evidence'])}"],
            },
        ],
        "metadata": {
            "artifact_eval": metadata,
            "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
            "language_info": {"name": "python", "version": "3"},
        },
        "nbformat": 4,
        "nbformat_minor": 5,
    }
    output_dir = ROOT / "results" / case / "baseline"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "artifact.ipynb"
    output_path.write_text(json.dumps(notebook, indent=2) + "\n", encoding="utf-8")
    (output_dir / "artifact-notebook.html").write_text(
        "<!doctype html><html><body><h1>Notebook Export</h1><p>"
        + canonical["summary"]
        + "</p></body></html>\n",
        encoding="utf-8",
    )
    return output_path


def validate_notebook(path: Path) -> bool:
    notebook = json.loads(path.read_text(encoding="utf-8"))
    try:
        import nbformat

        nbformat.validate(notebook)
    except ImportError:
        pass
    metadata = notebook.get("metadata", {}).get("artifact_eval", {})
    required_cells = len(notebook.get("cells", [])) >= 3
    required_metadata = bool(metadata.get("source_hash") and metadata.get("generator"))
    return notebook.get("nbformat") == 4 and required_cells and required_metadata


def main() -> int:
    parser = argparse.ArgumentParser(description="Notebook builder and validator")
    subparsers = parser.add_subparsers(dest="command", required=True)
    build = subparsers.add_parser("build")
    build.add_argument("--case", default="prior-auth")
    validate = subparsers.add_parser("validate")
    validate.add_argument("path")
    args = parser.parse_args()

    if args.command == "build":
        print(build_notebook(args.case))
        return 0
    if args.command == "validate":
        ok = validate_notebook(Path(args.path))
        print("valid" if ok else "invalid")
        return 0 if ok else 1
    raise AssertionError("unreachable")


if __name__ == "__main__":
    raise SystemExit(main())
