# Changesets

This directory contains changesets for managing package versions and changelogs.

## Workflow

### 1. Creating a Changeset

When you make a change that should be released, create a changeset:

```bash
bun changeset
```

This will prompt you to:
- Select which packages changed
- Choose the bump type (major/minor/patch)
- Write a summary of the changes

The changeset will be saved as a markdown file in this directory.

### 2. Releasing

When you push changesets to the `main` branch, GitHub Actions will:

1. **Create a "Version Packages" PR** that:
   - Bumps package versions
   - Updates CHANGELOGs
   - Removes consumed changesets

2. **When you merge the Version PR**, it will:
   - Publish packages to npm
   - Create git tags
   - Push tags to GitHub

### 3. Manual Release (if needed)

You can also release manually:

```bash
# Bump versions and update CHANGELOGs
bun run version

# Build and verify the publish payloads
bun run build
RELEASE_PUBLISH_DRY_RUN=1 bun scripts/release-publish.ts

# If dry-run looks good, publish for real and create git tags
bun run release:publish
git push --follow-tags
```

## Configuration

- **config.json**: Changesets configuration
- Packages are published to npm with public access
- `@useflow/core` and `@useflow/react` use fixed versioning and release together
- Examples and docs are ignored (won't be versioned/published)
- GitHub Actions publishes through npm Trusted Publishing, not an npm token

## Important Notes

- The `workspace:*` protocol in dependencies is preserved during versioning
- `bun pm pack` resolves `workspace:*` to actual versions before npm publishes the tarball
- Always run `bun install` after `changeset version` to update the lockfile
