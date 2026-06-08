# GitHub Optional Setup

The project works without GitHub. These steps are only for publishing or sharing later.

## Local Git only

Use this when you want local history but no remote repository:

```bash
git init
git add .
git commit -m "feat: initial artifact format evaluation harness"
```

## Create a GitHub repo later

When you are ready:

1. Create an empty GitHub repository.
2. Do not initialize it with a README, license, or `.gitignore`; this project already has those.
3. Add the remote locally:

```bash
git remote add origin https://github.com/<your-user>/<your-repo>.git
git branch -M main
git push -u origin main
```

## Enable GitHub Pages

This repository includes:

```text
.github/workflows/pages.yml
```

The workflow builds the benchmark and publishes `site-dist/` through GitHub Pages.

After pushing to GitHub:

1. Open the repository settings.
2. Go to Pages.
3. Set the source to GitHub Actions.
4. Run the Pages workflow or push to `main`.

## CI

This repository includes:

```text
.github/workflows/ci.yml
```

CI runs:

```text
pnpm validate
pnpm benchmark
uv run pytest
pnpm doctor --ci
```

It does not run optional live agent evaluation.

## Secrets

No secrets are required for v0.1.

Future optional agent re-read evaluation may use provider keys, but that is intentionally excluded
from normal CI.
