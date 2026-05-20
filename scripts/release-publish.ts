#!/usr/bin/env bun

import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

interface PackageJson {
  name?: string;
  version?: string;
  private?: boolean;
}

interface RunOptions {
  cwd?: string;
}

const rootDir = process.cwd();
const packagesDir = join(rootDir, "packages");
const changesetBin = join(
  rootDir,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "changeset.cmd" : "changeset",
);
const dryRun = process.env.RELEASE_PUBLISH_DRY_RUN === "1";

const packageDirs = readdirSync(packagesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(packagesDir, entry.name))
  .sort();

let publishedCount = 0;

for (const packageDir of packageDirs) {
  const pkg = readPackageJson(packageDir);

  if (!pkg.name || !pkg.version || pkg.private) {
    continue;
  }

  if (packageVersionExists(pkg.name, pkg.version)) {
    console.log(`${pkg.name}@${pkg.version} already exists on npm; skipping`);
    continue;
  }

  const tempDir = mkdtempSync(join(tmpdir(), "useflow-release-"));

  try {
    run("bun", ["pm", "pack", "--destination", tempDir, "--quiet"], {
      cwd: packageDir,
    });

    const tarball = findTarball(tempDir);
    const publishArgs = ["publish", tarball, "--access", "public"];

    if (dryRun) {
      publishArgs.push("--dry-run");
    }

    run("npm", publishArgs);
    publishedCount += 1;
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

if (publishedCount === 0) {
  console.log("No unpublished packages found.");
} else if (dryRun) {
  console.log(`Dry run completed for ${publishedCount} package(s).`);
} else {
  console.log(`Published ${publishedCount} package(s).`);
}

if (!dryRun && publishedCount > 0) {
  run(changesetBin, ["tag"]);
}

function readPackageJson(packageDir: string): PackageJson {
  return JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"));
}

function findTarball(directory: string): string {
  const tarballs = readdirSync(directory)
    .filter((entry) => entry.endsWith(".tgz"))
    .map((entry) => join(directory, entry));

  if (tarballs.length !== 1) {
    console.error(
      `Expected one packed tarball in ${directory}, found ${tarballs.length}.`,
    );
    process.exit(1);
  }

  return tarballs[0];
}

function packageVersionExists(packageName: string, version: string): boolean {
  const result = spawnSync(
    "npm",
    ["view", `${packageName}@${version}`, "version", "--json"],
    {
      cwd: rootDir,
      encoding: "utf8",
      env: {
        ...process.env,
        NPM_CONFIG_LOGLEVEL: "error",
      },
    },
  );

  if (result.status === 0) {
    return true;
  }

  const output = `${result.stdout}${result.stderr}`;

  if (output.includes("E404") || output.includes("404 Not Found")) {
    return false;
  }

  if (output.trim()) {
    console.error(output.trim());
  }

  process.exit(result.status ?? 1);
}

function run(command: string, args: string[], options: RunOptions = {}) {
  console.log(`$ ${[command, ...args].join(" ")}`);

  const result = spawnSync(command, args, {
    cwd: options.cwd ?? rootDir,
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
