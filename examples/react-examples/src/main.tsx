import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FlowProvider } from "@useflow/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import App from "./App.tsx";
import { persister } from "./lib/storage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

// biome-ignore lint/style/noNonNullAssertion: ignore
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <FlowProvider
        config={{
          persister,
          saveMode: "always",
          saveDebounce: 300,
          onPersistenceError: (error: Error) => {
            console.error("[FlowProvider] Persistence error:", error);
          },
        }}
      >
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </FlowProvider>
    </QueryClientProvider>
  </StrictMode>,
);
