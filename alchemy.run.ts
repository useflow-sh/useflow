import alchemy from "alchemy";
import { Vite, Website } from "alchemy/cloudflare";
import { CloudflareStateStore } from "alchemy/state";

const app = await alchemy("useflow", {
  // Only use CloudflareStateStore in CI, not locally
  stateStore: process.env.CI
    ? (scope) => new CloudflareStateStore(scope)
    : undefined,
});

const domain =
  app.stage === "production" ? "useflow.sh" : `${app.stage}.useflow.sh`;

const REPO_URL = "https://github.com/useflow-sh/useflow";
const DOMAINS = {
  DOCS: `docs.${domain}`,
  DEMOS: `demo.${domain}`,
};
const docs = await Website("docs", {
  assets: "dist",
  cwd: "./apps/docs",
  build: "bun run build",
  bindings: {
    DOCS_URL: `https://${DOMAINS.DOCS}`,
    DEMOS_URL: `https://${DOMAINS.DEMOS}`,
    REPO_URL: REPO_URL,
  },
  dev: {
    command: "bun run dev",
  },
  domains: [DOMAINS.DOCS],
});

const demos = await Vite("demos", {
  assets: "dist",
  cwd: "./examples/react-examples",
  build: "bun run build",
  bindings: {
    VITE_DOCS_URL: `https://${DOMAINS.DOCS}`,
    VITE_REPO_URL: REPO_URL,
  },
  dev: {
    command: "bun run dev",
  },
  domains: [DOMAINS.DEMOS],
});

if (!app.local) {
  console.log({
    docs: docs.domains?.map((domain) => domain.name),
    demos: demos.domains?.map((domain) => domain.name),
  });
} else {
  console.log({
    docs: docs.url,
    demos: demos.url,
  });
}

await app.finalize();
