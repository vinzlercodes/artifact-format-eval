from pathlib import Path

from artifact_eval_notebook.__main__ import build_notebook, validate_notebook


def test_build_and_validate_notebook() -> None:
    path = build_notebook("prior-auth")

    assert path.as_posix().endswith("results/prior-auth/baseline/artifact.ipynb")
    assert validate_notebook(path)
