import alchemy from "alchemy";
import { Website } from "alchemy/cloudflare";

const app = await alchemy("useflow");

const domain =
  app.stage === "production" ? "useflow.sh" : `${app.stage}.useflow.sh`;

const docsDomain = `docs.${domain}`;
const docs = await Website("docs", {
  assets: "dist",
  cwd: "./apps/docs",
  build: "bun run build",
  bindings: {
    DOCS_URL: `https://${docsDomain}`,
  },
  dev: {
    command: "bun run dev",
  },
  domains: [docsDomain],
});

console.log({
  docs: docs.domains?.map((domain) => domain.name),
});

await app.finalize();
