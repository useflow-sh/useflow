// @ts-check

import sitemap from "@astrojs/sitemap";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import starlightThemeObsidian from "starlight-theme-obsidian";

// Repository constants
const REPO_URL = "https://github.com/useflow-sh/useflow";
const DOCS_URL = process.env.DOCS_URL;

// https://astro.build/config
export default defineConfig({
  site: DOCS_URL,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ["zod"],
    },
  },
  integrations: [
    sitemap(),
    starlight({
      plugins: [
        starlightThemeObsidian({
          graph: false,
        }),
      ],
      title: "useFlow",
      description:
        "Type-safe, declarative multi-step flows for React applications",
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 4,
      },
      customCss: [
        // Tailwind base styles and Starlight compatibility
        "./src/styles/global.css",
        // Custom useFlow theme styles
        "./src/styles/custom.css",
      ],
      head: [
        {
          tag: "script",
          content: `
            (function() {
              // Default to dark theme if no preference is saved
              const theme = localStorage.getItem('starlight-theme') || 'dark';
              if (!localStorage.getItem('starlight-theme')) {
                localStorage.setItem('starlight-theme', 'dark');
              }
              document.documentElement.dataset.theme = theme;
              document.documentElement.style.backgroundColor = theme === 'light' ? '#f5f5f0' : '#26252a';
            })();
          `,
        },
        {
          tag: "style",
          content: `
            html, body {
              background-color: #26252a !important;
            }
            html[data-theme='light'], 
            html[data-theme='light'] body {
              background-color: #f5f5f0 !important;
            }
          `,
        },
        {
          tag: "script",
          attrs: {
            src: "/smooth-scroll.js",
          },
        },
      ],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: REPO_URL,
        },
      ],
      sidebar: [
        {
          label: "Getting Started",
          items: [
            { label: "Why useFlow?", link: "/getting-started/why-useflow" },
            { label: "Installation", link: "/getting-started/installation" },
            { label: "Quick Start", link: "/getting-started/quick-start" },
            { label: "Type Safety", link: "/getting-started/type-safety" },
            {
              label: "Decision Guide",
              link: "/getting-started/decision-guide",
            },
          ],
        },
        {
          label: "Core Concepts",
          items: [
            { label: "Overview", link: "/core-concepts/" },
            { label: "Flows", link: "/core-concepts/flows" },
            { label: "Steps", link: "/core-concepts/steps" },
            { label: "Context", link: "/core-concepts/context" },
            { label: "Navigation", link: "/core-concepts/navigation" },
          ],
        },
        {
          label: "Guides",
          items: [
            { label: "Linear Flows", link: "/guides/linear-flows" },
            { label: "Branching Flows", link: "/guides/branching-flows" },
            { label: "Flow Variants", link: "/guides/flow-variants" },
            { label: "Persistence", link: "/guides/persistence" },
            { label: "Callbacks", link: "/guides/callbacks" },
            { label: "Custom Layouts", link: "/guides/custom-layouts" },
            {
              label: "Global Configuration",
              link: "/guides/global-configuration",
            },
            { label: "Migrations", link: "/guides/migrations" },
            { label: "Testing", link: "/guides/testing" },
            { label: "Troubleshooting", link: "/guides/troubleshooting" },
          ],
        },
        {
          label: "Recipes",
          items: [
            { label: "Overview", link: "/recipes/" },
            { label: "Onboarding", link: "/recipes/onboarding" },
            { label: "Checkout", link: "/recipes/checkout" },
            { label: "Survey", link: "/recipes/survey" },
          ],
        },
        {
          label: "API Reference",
          items: [
            { label: "Overview", link: "/api-reference/" },
            { label: "defineFlow", link: "/api-reference/define-flow" },
            { label: "Flow Component", link: "/api-reference/flow-component" },
            { label: "useFlow Hook", link: "/api-reference/use-flow" },
          ],
        },
      ],
    }),
  ],
});
