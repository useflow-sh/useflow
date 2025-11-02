import alchemy from "alchemy";
import { Website } from "alchemy/cloudflare";

const app = await alchemy("useflow");

const docs = await Website("docs", {
  assets: "dist",
  cwd: "./apps/docs",
  build: "bun run build",
  dev: {
    command: "bun run dev",
  },
});

console.log({
  docs: docs.url,
});

await app.finalize();
