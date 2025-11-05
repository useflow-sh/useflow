#!/usr/bin/env bun
/**
 * Syncs workspace package versions in bun.lock with package.json versions.
 * This is needed because Changesets updates package.json but not the lockfile,
 * causing bun publish to resolve workspace:* to wrong versions.
 *
 * See: https://github.com/oven-sh/bun/issues/16074 and https://github.com/changesets/changesets/issues/1454
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

interface PackageJson {
  name: string;
  version: string;
}

async function main() {
  const rootDir = process.cwd();
  const lockfilePath = join(rootDir, "bun.lock");

  // Read workspace package.json files to get current versions
  const workspacePackages = new Map<string, string>();

  for (const dir of ["packages/core", "packages/react"]) {
    const pkgPath = join(rootDir, dir, "package.json");
    const pkg: PackageJson = JSON.parse(readFileSync(pkgPath, "utf-8"));
    workspacePackages.set(dir, pkg.version);
    console.log(`Found ${pkg.name}@${pkg.version} in ${dir}`);
  }

  // Read lockfile
  let lockfileContent = readFileSync(lockfilePath, "utf-8");

  // Update workspace package versions in lockfile
  for (const [dir, version] of workspacePackages) {
    // Match the workspace package section and update its version
    // Pattern: "packages/core": {\n  "name": "@useflow/core",\n  "version": "0.0.0",
    const pattern = new RegExp(
      `("${dir.replace("/", "\\/")}":\\s*\\{[^}]*"version":\\s*)"[^"]*"`,
      "g",
    );

    const before = lockfileContent;
    lockfileContent = lockfileContent.replace(pattern, `$1"${version}"`);

    if (before !== lockfileContent) {
      console.log(`✓ Updated ${dir} to version ${version} in lockfile`);
    } else {
      console.warn(`⚠ Could not find ${dir} in lockfile`);
    }
  }

  // Write updated lockfile
  writeFileSync(lockfilePath, lockfileContent, "utf-8");
  console.log("\n✅ Lockfile synced successfully");
}

main().catch((error) => {
  console.error("Error syncing lockfile:", error);
  process.exit(1);
});
