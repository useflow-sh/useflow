import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { defineFlow } from "./define-flow";
import { Flow, FlowStep, useFlow } from "./flow";
import type { FlowConfig } from "./type-helpers";

describe("Flow", () => {
  it("should provide flow context to children", () => {
    const flow = defineFlow({
      id: "test",
      start: "idle",
      steps: {
        idle: {
          next: "active",
        },
        active: {},
      },
    } as const satisfies FlowConfig<{ count: number }>);

    function TestComponent() {
      const { context, stepId, status } = useFlow();
      return (
        <div>
          <div data-testid="context">{JSON.stringify(context)}</div>
          <div data-testid="stepId">{stepId}</div>
          <div data-testid="status">{status}</div>
        </div>
      );
    }

    render(
      <Flow
        flow={flow}
        components={() => ({
          idle: () => <div>Idle</div>,
          active: () => <div>Active</div>,
        })}
        initialContext={{ count: 0 }}
      >
        <TestComponent />
      </Flow>,
    );

    expect(screen.getByTestId("context")).toHaveTextContent('{"count":0}');
    expect(screen.getByTestId("stepId")).toHaveTextContent("idle");
    expect(screen.getByTestId("status")).toHaveTextContent("active");
  });

  it("should navigate forward with next()", () => {
    const flow = defineFlow({
      id: "test",
      start: "first",
      steps: {
        first: {
          next: "second",
        },
        second: {},
      },
    } as const satisfies FlowConfig<object>);

    function TestComponent() {
      const { stepId, next } = useFlow();
      return (
        <div>
          <div data-testid="stepId">{stepId}</div>
          <button onClick={() => next()}>Next</button>
        </div>
      );
    }

    render(
      <Flow
        flow={flow}
        components={() => ({
          first: () => <div>First</div>,
          second: () => <div>Second</div>,
        })}
        initialContext={{}}
      >
        <TestComponent />
      </Flow>,
    );

    expect(screen.getByTestId("stepId")).toHaveTextContent("first");

    fireEvent.click(screen.getByText("Next"));

    expect(screen.getByTestId("stepId")).toHaveTextContent("second");
  });

  it("should navigate back with back()", () => {
    const flow = defineFlow({
      id: "test",
      start: "first",
      steps: {
        first: {
          next: "second",
        },
        second: {},
      },
    } as const satisfies FlowConfig<object>);

    function TestComponent() {
      const { stepId, next, back } = useFlow();
      return (
        <div>
          <div data-testid="stepId">{stepId}</div>
          <button onClick={() => next()}>Next</button>
          <button onClick={() => back()}>Back</button>
        </div>
      );
    }

    render(
      <Flow
        flow={flow}
        components={() => ({
          first: () => <div>First</div>,
          second: () => <div>Second</div>,
        })}
        initialContext={{}}
      >
        <TestComponent />
      </Flow>,
    );

    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByTestId("stepId")).toHaveTextContent("second");

    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByTestId("stepId")).toHaveTextContent("first");
  });

  it("should update context with setContext()", () => {
    const flow = defineFlow({
      id: "test",
      start: "profile",
      steps: {
        profile: {},
      },
    } as const satisfies FlowConfig<{ name: string }>);

    function TestComponent() {
      const { context, setContext } = useFlow<{ name: string }>();
      return (
        <div>
          <div data-testid="name">{context.name}</div>
          <button onClick={() => setContext({ name: "Alice" })}>
            Set Name
          </button>
        </div>
      );
    }

    render(
      <Flow
        flow={flow}
        components={() => ({
          profile: () => <div>Profile</div>,
        })}
        initialContext={{ name: "" }}
      >
        <TestComponent />
      </Flow>,
    );

    expect(screen.getByTestId("name")).toHaveTextContent("");

    fireEvent.click(screen.getByText("Set Name"));

    expect(screen.getByTestId("name")).toHaveTextContent("Alice");
  });

  it("should call onComplete when flow reaches final state", () => {
    const flow = defineFlow({
      id: "test",
      start: "active",
      steps: {
        active: {
          next: "complete",
        },
        complete: {
          // No next = final step
        },
      },
    } as const satisfies FlowConfig<object>);

    const onComplete = vi.fn();

    function TestComponent() {
      const { next } = useFlow();
      return <button onClick={() => next()}>Go to Complete</button>;
    }

    render(
      <Flow
        flow={flow}
        components={() => ({
          active: () => <div>Active</div>,
          complete: () => <div>Complete</div>,
        })}
        initialContext={{}}
        onComplete={onComplete}
      >
        <TestComponent />
      </Flow>,
    );

    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("Go to Complete"));

    expect(onComplete).toHaveBeenCalled();
  });

  it("should support conditional next with function", () => {
    const flow = defineFlow({
      id: "test",
      start: "profile",
      steps: {
        profile: {
          next: (ctx: { isBusiness: boolean }) =>
            ctx.isBusiness ? "business" : "personal",
        },
        business: {},
        personal: {},
      },
    } as const satisfies FlowConfig<{ isBusiness: boolean }>);

    function TestComponent() {
      const { stepId, next, setContext } = useFlow<{ isBusiness: boolean }>();
      return (
        <div>
          <div data-testid="stepId">{stepId}</div>
          <button onClick={() => setContext({ isBusiness: true })}>
            Set Business
          </button>
          <button onClick={() => next()}>Next</button>
        </div>
      );
    }

    render(
      <Flow
        flow={flow}
        components={() => ({
          profile: () => <div>Profile</div>,
          business: () => <div>Business</div>,
          personal: () => <div>Personal</div>,
        })}
        initialContext={{ isBusiness: false }}
      >
        <TestComponent />
      </Flow>,
    );

    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByTestId("stepId")).toHaveTextContent("personal");
  });

  it("should render components from components function", () => {
    const flow = defineFlow({
      id: "test",
      start: "test",
      steps: {
        test: {},
      },
    } as const satisfies FlowConfig<object>);

    render(
      <Flow
        flow={flow}
        components={() => ({
          test: () => <div data-testid="test-step">Test Step</div>,
        })}
        initialContext={{}}
      />,
    );

    expect(screen.getByTestId("test-step")).toBeInTheDocument();
  });

  it("should pass flowState to components function", () => {
    const flow = defineFlow({
      id: "test",
      start: "test",
      steps: {
        test: {},
      },
    } as const satisfies FlowConfig<{ name: string }>);

    render(
      <Flow
        flow={flow}
        components={(flowState) => ({
          test: () => (
            <div>
              <div data-testid="name">{flowState.context.name}</div>
              <div data-testid="step">{flowState.stepId}</div>
            </div>
          ),
        })}
        initialContext={{ name: "Alice" }}
      />,
    );

    expect(screen.getByTestId("name")).toHaveTextContent("Alice");
    expect(screen.getByTestId("step")).toHaveTextContent("test");
  });
});

describe("useFlow", () => {
  it("should throw error when used outside Flow", () => {
    function TestComponent() {
      useFlow();
      return <div>Test</div>;
    }

    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow(
      "useFlow must be used within a Flow component",
    );

    consoleSpy.mockRestore();
  });

  it("should work with typed hook from defineFlow", () => {
    const flow = defineFlow({
      id: "test",
      start: "first",
      steps: {
        first: {
          next: ["second", "third"] as const,
        },
        second: {},
        third: {},
      },
    } as const satisfies FlowConfig<{ value: string }>);

    function TestComponent() {
      // Use the typed hook from the flow definition
      const { stepId, next, context } = flow.useFlow({ step: "first" });
      return (
        <div>
          <div data-testid="stepId">{stepId}</div>
          <div data-testid="value">{context.value}</div>
          <button onClick={() => next("second")}>Go to Second</button>
          <button onClick={() => next("third")}>Go to Third</button>
        </div>
      );
    }

    render(
      <Flow
        flow={flow}
        components={() => ({
          first: TestComponent,
          second: () => <div data-testid="second-step">Second</div>,
          third: () => <div data-testid="third-step">Third</div>,
        })}
        initialContext={{ value: "test" }}
      />,
    );

    expect(screen.getByTestId("stepId")).toHaveTextContent("first");
    expect(screen.getByTestId("value")).toHaveTextContent("test");

    fireEvent.click(screen.getByText("Go to Second"));

    expect(screen.getByTestId("second-step")).toBeInTheDocument();
  });
});

describe("Edge cases", () => {
  it("should handle multiple back() calls beyond history", () => {
    const flow = defineFlow({
      id: "test",
      start: "first",
      steps: {
        first: {
          next: "second",
        },
        second: {},
      },
    } as const satisfies FlowConfig<object>);

    function TestComponent() {
      const { stepId, next, back } = useFlow();
      return (
        <div>
          <div data-testid="stepId">{stepId}</div>
          <button onClick={() => next()}>Next</button>
          <button onClick={() => back()}>Back</button>
        </div>
      );
    }

    render(
      <Flow
        flow={flow}
        components={() => ({
          first: () => <div>First</div>,
          second: () => <div>Second</div>,
        })}
        initialContext={{}}
      >
        <TestComponent />
      </Flow>,
    );

    expect(screen.getByTestId("stepId")).toHaveTextContent("first");

    // Navigate forward
    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByTestId("stepId")).toHaveTextContent("second");

    // Go back once (should work)
    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByTestId("stepId")).toHaveTextContent("first");

    // Try to go back again (should stay on first)
    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByTestId("stepId")).toHaveTextContent("first");

    // Try multiple times (should still stay on first)
    fireEvent.click(screen.getByText("Back"));
    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByTestId("stepId")).toHaveTextContent("first");
  });

  it("should handle context updates with next() in one call", () => {
    const flow = defineFlow({
      id: "test",
      start: "first",
      steps: {
        first: {
          next: "second",
        },
        second: {},
      },
    } as const satisfies FlowConfig<{ count: number }>);

    function TestComponent() {
      const { stepId, context, next } = useFlow<{ count: number }>();
      return (
        <div>
          <div data-testid="stepId">{stepId}</div>
          <div data-testid="count">{context.count}</div>
          <button
            onClick={() => next((ctx) => ({ ...ctx, count: ctx.count + 1 }))}
          >
            Next and Increment
          </button>
        </div>
      );
    }

    render(
      <Flow
        flow={flow}
        components={() => ({
          first: () => <div>First</div>,
          second: () => <div>Second</div>,
        })}
        initialContext={{ count: 0 }}
      >
        <TestComponent />
      </Flow>,
    );

    expect(screen.getByTestId("stepId")).toHaveTextContent("first");
    expect(screen.getByTestId("count")).toHaveTextContent("0");

    // Navigate and update context in one call
    fireEvent.click(screen.getByText("Next and Increment"));

    expect(screen.getByTestId("stepId")).toHaveTextContent("second");
    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });

  it("should handle nested object updates in context", () => {
    type NestedContext = {
      user: {
        profile: {
          name: string;
          age: number;
        };
      };
    };

    const flow = defineFlow({
      id: "test",
      start: "test",
      steps: {
        test: {},
      },
    } as const satisfies FlowConfig<NestedContext>);

    function TestComponent() {
      const { context, setContext } = useFlow<NestedContext>();
      return (
        <div>
          <div data-testid="name">{context.user.profile.name}</div>
          <div data-testid="age">{context.user.profile.age}</div>
          <button
            onClick={() =>
              setContext((ctx) => ({
                user: {
                  profile: {
                    ...ctx.user.profile,
                    age: ctx.user.profile.age + 1,
                  },
                },
              }))
            }
          >
            Increment Age
          </button>
        </div>
      );
    }

    render(
      <Flow
        flow={flow}
        components={() => ({
          test: () => <div>Test</div>,
        })}
        initialContext={{ user: { profile: { name: "Alice", age: 25 } } }}
      >
        <TestComponent />
      </Flow>,
    );

    expect(screen.getByTestId("name")).toHaveTextContent("Alice");
    expect(screen.getByTestId("age")).toHaveTextContent("25");

    fireEvent.click(screen.getByText("Increment Age"));

    expect(screen.getByTestId("age")).toHaveTextContent("26");
    expect(screen.getByTestId("name")).toHaveTextContent("Alice");
  });
});

describe("FlowStep", () => {
  it("should render the current step component", () => {
    const flow = defineFlow({
      id: "test",
      start: "test",
      steps: {
        test: {},
      },
    } as const satisfies FlowConfig<object>);

    render(
      <Flow
        flow={flow}
        components={() => ({
          test: () => <div data-testid="test-step">Test Step Content</div>,
        })}
        initialContext={{}}
      >
        <div data-testid="wrapper">
          <FlowStep />
        </div>
      </Flow>,
    );

    expect(screen.getByTestId("wrapper")).toBeInTheDocument();
    expect(screen.getByTestId("test-step")).toBeInTheDocument();
    expect(screen.getByTestId("test-step")).toHaveTextContent(
      "Test Step Content",
    );
  });

  it("should render by default when no children provided", () => {
    const flow = defineFlow({
      id: "test",
      start: "test",
      steps: {
        test: {},
      },
    } as const satisfies FlowConfig<object>);

    render(
      <Flow
        flow={flow}
        components={() => ({
          test: () => <div data-testid="auto-step">Auto Rendered</div>,
        })}
        initialContext={{}}
      />,
    );

    expect(screen.getByTestId("auto-step")).toBeInTheDocument();
    expect(screen.getByTestId("auto-step")).toHaveTextContent("Auto Rendered");
  });

  it("should update when step changes", () => {
    const flow = defineFlow({
      id: "test",
      start: "first",
      steps: {
        first: {
          next: "second",
        },
        second: {},
      },
    } as const satisfies FlowConfig<object>);

    function TestApp() {
      const { next } = useFlow();
      return (
        <>
          <button onClick={() => next()}>Next</button>
          <FlowStep />
        </>
      );
    }

    render(
      <Flow
        flow={flow}
        components={() => ({
          first: () => <div data-testid="first-step">First</div>,
          second: () => <div data-testid="second-step">Second</div>,
        })}
        initialContext={{}}
      >
        <TestApp />
      </Flow>,
    );

    expect(screen.getByTestId("first-step")).toBeInTheDocument();
    expect(screen.queryByTestId("second-step")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Next"));

    expect(screen.queryByTestId("first-step")).not.toBeInTheDocument();
    expect(screen.getByTestId("second-step")).toBeInTheDocument();
  });

  it("should warn when component is missing", () => {
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    const flow = defineFlow({
      id: "test",
      start: "test",
      steps: {
        test: {},
      },
    } as const satisfies FlowConfig<object>);

    render(
      <Flow
        flow={flow}
        components={() => ({
          // @ts-expect-error - Testing missing component
          test: undefined,
        })}
        initialContext={{}}
      >
        <div data-testid="wrapper">
          <FlowStep />
        </div>
      </Flow>,
    );

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "[FlowStep] No component found for step: test",
    );
    // FlowStep returns null when component is missing, but wrapper should exist
    expect(screen.getByTestId("wrapper")).toBeInTheDocument();

    consoleWarnSpy.mockRestore();
  });
});
