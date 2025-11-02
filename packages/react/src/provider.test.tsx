import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FlowProvider, useFlowConfig } from "./provider";

describe("FlowProvider", () => {
  it("provides config to children", () => {
    const TestComponent = () => {
      const config = useFlowConfig();
      return <div>{config?.saveMode}</div>;
    };

    render(
      <FlowProvider config={{ saveMode: "always" }}>
        <TestComponent />
      </FlowProvider>,
    );

    expect(screen.getByText("always")).toBeInTheDocument();
  });

  it("returns null when no provider is present", () => {
    const TestComponent = () => {
      const config = useFlowConfig();
      return <div>{config === null ? "null" : "not null"}</div>;
    };

    render(<TestComponent />);

    expect(screen.getByText("null")).toBeInTheDocument();
  });

  it("provides persister config", () => {
    const mockPersister = {
      store: { get: vi.fn(), set: vi.fn(), remove: vi.fn() },
      save: vi.fn(),
      restore: vi.fn(),
    };

    const TestComponent = () => {
      const config = useFlowConfig();
      return <div>{config?.persister ? "has persister" : "no persister"}</div>;
    };

    render(
      <FlowProvider config={{ persister: mockPersister }}>
        <TestComponent />
      </FlowProvider>,
    );

    expect(screen.getByText("has persister")).toBeInTheDocument();
  });

  it("provides callbacks config", () => {
    const onFlowStart = vi.fn();
    const onFlowComplete = vi.fn();
    const onStepTransition = vi.fn();

    const TestComponent = () => {
      const config = useFlowConfig();
      return (
        <div>
          {config?.callbacks?.onFlowStart ? "has onFlowStart" : "no callback"}
        </div>
      );
    };

    render(
      <FlowProvider
        config={{
          callbacks: {
            onFlowStart,
            onFlowComplete,
            onStepTransition,
          },
        }}
      >
        <TestComponent />
      </FlowProvider>,
    );

    expect(screen.getByText("has onFlowStart")).toBeInTheDocument();
  });

  it("provides saveDebounce config", () => {
    const TestComponent = () => {
      const config = useFlowConfig();
      return <div>{config?.saveDebounce}</div>;
    };

    render(
      <FlowProvider config={{ saveDebounce: 500 }}>
        <TestComponent />
      </FlowProvider>,
    );

    expect(screen.getByText("500")).toBeInTheDocument();
  });

  it("provides error handler config", () => {
    const onPersistenceError = vi.fn();

    const TestComponent = () => {
      const config = useFlowConfig();
      return (
        <div>
          {config?.onPersistenceError ? "has error handler" : "no handler"}
        </div>
      );
    };

    render(
      <FlowProvider config={{ onPersistenceError }}>
        <TestComponent />
      </FlowProvider>,
    );

    expect(screen.getByText("has error handler")).toBeInTheDocument();
  });
});
