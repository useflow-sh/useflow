import alchemy from "alchemy";
import { Vite, Website } from "alchemy/cloudflare";

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

const demosDomain = `demo.${domain}`;
const demos = await Vite("demos", {
  assets: "dist",
  cwd: "./examples/react-examples",
  build: "bun run build",
  dev: {
    command: "bun run dev",
  },
  domains: [demosDomain],
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
