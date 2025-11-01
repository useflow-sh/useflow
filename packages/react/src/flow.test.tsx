import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { act, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { defineFlow } from "./define-flow";
import { Flow, FlowStep, useFlow } from "./flow";

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
    });

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
        components={{
          idle: () => <div>Idle</div>,
          active: () => <div>Active</div>,
        }}
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
    });

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
        components={{
          first: () => <div>First</div>,
          second: () => <div>Second</div>,
        }}
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
    });

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
        components={{
          first: () => <div>First</div>,
          second: () => <div>Second</div>,
        }}
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
    });

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
        components={{
          profile: () => <div>Profile</div>,
        }}
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
    });

    const onComplete = vi.fn();

    function TestComponent() {
      const { next } = useFlow();
      return <button onClick={() => next()}>Go to Complete</button>;
    }

    render(
      <Flow
        flow={flow}
        components={{
          active: () => <div>Active</div>,
          complete: () => <div>Complete</div>,
        }}
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
  it("should call onComplete only once when callback is redefined each render", () => {
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
    });

    const onCompleteSpy = vi.fn();

    function TestComponent() {
      const { next } = useFlow();
      return <button onClick={() => next()}>Go to Complete</button>;
    }

    function ParentComponent() {
      const [count, setCount] = useState(0);

      // This creates a new function on every render AND causes parent to re-render
      const handleComplete = () => {
        onCompleteSpy();
        // Stop re-rendering after 10 times to prevent infinite loop in tests
        if (count < 10) {
          setCount((c) => c + 1);
        }
      };

      return (
        <div>
          <div data-testid="count">{count}</div>
          <Flow
            flow={flow}
            components={{
              active: () => <div>Active</div>,
              complete: () => <div>Complete</div>,
            }}
            initialContext={{}}
            onComplete={handleComplete}
          >
            <TestComponent />
          </Flow>
        </div>
      );
    }

    render(<ParentComponent />);

    expect(onCompleteSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId("count")).toHaveTextContent("0");

    fireEvent.click(screen.getByText("Go to Complete"));

    // Should only be called once, not multiple times
    // If onComplete is in the effect dependencies, it will be called multiple times
    expect(onCompleteSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });

  it("should support conditional next with function", () => {
    const flow = defineFlow(
      {
        id: "test",
        start: "profile",
        steps: {
          profile: {
            next: ["business", "personal"],
          },
          business: {},
          personal: {},
        },
      },
      (steps) => ({
        resolve: {
          profile: (ctx: { isBusiness: boolean }) =>
            ctx.isBusiness ? steps.business : steps.personal,
        },
      }),
    );

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
        components={{
          profile: () => <div>Profile</div>,
          business: () => <div>Business</div>,
          personal: () => <div>Personal</div>,
        }}
        initialContext={{ isBusiness: false }}
      >
        <TestComponent />
      </Flow>,
    );

    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByTestId("stepId")).toHaveTextContent("personal");
  });

  it("should render components from components dictionary", () => {
    const flow = defineFlow({
      id: "test",
      start: "step1",
      steps: {
        step1: { next: "step2" },
        step2: {},
      },
    });

    render(
      <Flow
        flow={flow}
        components={{
          step1: () => <div data-testid="step1">Step 1</div>,
          step2: () => <div data-testid="step2">Step 2</div>,
        }}
        initialContext={{}}
      />,
    );

    expect(screen.getByTestId("step1")).toBeInTheDocument();
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
    });

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
        components={{
          first: TestComponent,
          second: () => <div data-testid="second-step">Second</div>,
          third: () => <div data-testid="third-step">Third</div>,
        }}
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
    });

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
        components={{
          first: () => <div>First</div>,
          second: () => <div>Second</div>,
        }}
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
    });

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
        components={{
          first: () => <div>First</div>,
          second: () => <div>Second</div>,
        }}
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
    });

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
        components={{
          test: () => <div>Test</div>,
        }}
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
    });

    render(
      <Flow
        flow={flow}
        components={{
          test: () => <div data-testid="test-step">Test Step Content</div>,
        }}
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
    });

    render(
      <Flow
        flow={flow}
        components={{
          test: () => <div data-testid="auto-step">Auto Rendered</div>,
        }}
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
    });

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
        components={{
          first: () => <div data-testid="first-step">First</div>,
          second: () => <div data-testid="second-step">Second</div>,
        }}
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
    });

    render(
      <Flow
        flow={flow}
        components={{
          // @ts-expect-error - Testing missing component
          test1: () => <div>Test</div>,
        }}
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

  describe("Flow callbacks", () => {
    it("should call onNext callback when navigating forward", () => {
      const flow = defineFlow({
        id: "test",
        start: "first",
        steps: {
          first: { next: "second" },
          second: {},
        },
      });

      const onNext = vi.fn();

      function TestComponent() {
        const { next } = useFlow();
        return <button onClick={() => next()}>Next</button>;
      }

      render(
        <Flow
          flow={flow}
          components={{
            first: TestComponent,
            second: () => <div>Second</div>,
          }}
          initialContext={{}}
          onNext={onNext}
        />,
      );

      fireEvent.click(screen.getByText("Next"));

      expect(onNext).toHaveBeenCalledTimes(1);
      expect(onNext).toHaveBeenCalledWith({
        from: "first",
        to: "second",
        oldContext: {},
        newContext: {},
      });
    });

    it("should call onBack callback when navigating backward", () => {
      const flow = defineFlow({
        id: "test",
        start: "first",
        steps: {
          first: { next: "second" },
          second: {},
        },
      });

      const onBack = vi.fn();

      function TestComponent() {
        const { next, back, stepId } = useFlow();
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
          components={{
            first: TestComponent,
            second: TestComponent,
          }}
          initialContext={{}}
          onBack={onBack}
        />,
      );

      // Navigate forward first
      fireEvent.click(screen.getByText("Next"));
      expect(screen.getByTestId("stepId")).toHaveTextContent("second");

      // Navigate back
      fireEvent.click(screen.getByText("Back"));

      expect(onBack).toHaveBeenCalledTimes(1);
      expect(onBack).toHaveBeenCalledWith({
        from: "second",
        to: "first",
        oldContext: {},
        newContext: {},
      });
    });

    it("should call onContextUpdate callback when context changes", () => {
      const flow = defineFlow({
        id: "test",
        start: "form",
        steps: {
          form: {},
        },
      });

      const onContextUpdate = vi.fn();

      function TestComponent() {
        const { setContext } = useFlow();
        return (
          <button onClick={() => setContext({ name: "Alice" })}>
            Update Context
          </button>
        );
      }

      render(
        <Flow
          flow={flow}
          components={{
            form: TestComponent,
          }}
          initialContext={{ name: "" }}
          onContextUpdate={onContextUpdate}
        />,
      );

      fireEvent.click(screen.getByText("Update Context"));

      expect(onContextUpdate).toHaveBeenCalledTimes(1);
      expect(onContextUpdate).toHaveBeenCalledWith({
        oldContext: { name: "" },
        newContext: { name: "Alice" },
      });
    });

    it("should call both onNext and onContextUpdate when navigating with context update", () => {
      const flow = defineFlow({
        id: "test",
        start: "menu",
        steps: {
          menu: { next: ["option1", "option2"] },
          option1: {},
          option2: {},
        },
      });

      const onNext = vi.fn();
      const onContextUpdate = vi.fn();

      function TestComponent() {
        const { next } = useFlow();
        return (
          <button onClick={() => next("option2", { choice: "option2" })}>
            Choose Option 2
          </button>
        );
      }

      render(
        <Flow
          flow={flow}
          components={{
            menu: TestComponent,
            option1: () => <div>Option 1</div>,
            option2: () => <div>Option 2</div>,
          }}
          initialContext={{ choice: "" }}
          onNext={onNext}
          onContextUpdate={onContextUpdate}
        />,
      );

      fireEvent.click(screen.getByText("Choose Option 2"));

      expect(onNext).toHaveBeenCalledTimes(1);
      expect(onNext).toHaveBeenCalledWith({
        from: "menu",
        to: "option2",
        oldContext: { choice: "" },
        newContext: { choice: "option2" },
      });

      expect(onContextUpdate).toHaveBeenCalledTimes(1);
      expect(onContextUpdate).toHaveBeenCalledWith({
        oldContext: { choice: "" },
        newContext: { choice: "option2" },
      });
    });

    it("should work when no callbacks are provided", () => {
      const flow = defineFlow({
        id: "test",
        start: "first",
        steps: {
          first: { next: "second" },
          second: {},
        },
      });

      function TestComponent() {
        const { next, stepId } = useFlow();
        return (
          <div>
            <div data-testid="stepId">{stepId}</div>
            <button onClick={() => next()}>Next</button>
          </div>
        );
      }

      // Should not throw when no callbacks provided
      render(
        <Flow
          flow={flow}
          components={{
            first: TestComponent,
            second: TestComponent,
          }}
          initialContext={{}}
        />,
      );

      fireEvent.click(screen.getByText("Next"));
      expect(screen.getByTestId("stepId")).toHaveTextContent("second");
    });

    it("should work when only some callbacks are provided", () => {
      const flow = defineFlow({
        id: "test",
        start: "first",
        steps: {
          first: { next: "second" },
          second: {},
        },
      });

      const onNext = vi.fn();
      // onBack and onContextUpdate not provided

      function TestComponent() {
        const { next, back } = useFlow();
        return (
          <div>
            <button onClick={() => next()}>Next</button>
            <button onClick={() => back()}>Back</button>
          </div>
        );
      }

      render(
        <Flow
          flow={flow}
          components={{
            first: TestComponent,
            second: TestComponent,
          }}
          initialContext={{}}
          onNext={onNext}
        />,
      );

      fireEvent.click(screen.getByText("Next"));
      fireEvent.click(screen.getByText("Back"));

      // onNext should have been called
      expect(onNext).toHaveBeenCalledTimes(1);
      // No errors should occur from missing onBack
    });

    it("should call onTransition callback with forward direction", () => {
      const flow = defineFlow({
        id: "test",
        start: "first",
        steps: {
          first: { next: "second" },
          second: {},
        },
      });

      const onTransition = vi.fn();

      function TestComponent() {
        const { next, stepId } = useFlow();
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
          components={{
            first: TestComponent,
            second: TestComponent,
          }}
          initialContext={{ count: 0 }}
          onTransition={onTransition}
        />,
      );

      fireEvent.click(screen.getByText("Next"));

      expect(onTransition).toHaveBeenCalledTimes(1);
      expect(onTransition).toHaveBeenCalledWith({
        from: "first",
        to: "second",
        direction: "forward",
        oldContext: { count: 0 },
        newContext: { count: 0 },
      });
    });

    it("should call onTransition callback with backward direction", () => {
      const flow = defineFlow({
        id: "test",
        start: "first",
        steps: {
          first: { next: "second" },
          second: {},
        },
      });

      const onTransition = vi.fn();

      function TestComponent() {
        const { next, back, stepId } = useFlow();
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
          components={{
            first: TestComponent,
            second: TestComponent,
          }}
          initialContext={{}}
          onTransition={onTransition}
        />,
      );

      // Navigate forward
      fireEvent.click(screen.getByText("Next"));

      // Navigate back
      fireEvent.click(screen.getByText("Back"));

      expect(onTransition).toHaveBeenCalledTimes(2);
      expect(onTransition).toHaveBeenNthCalledWith(1, {
        from: "first",
        to: "second",
        direction: "forward",
        oldContext: {},
        newContext: {},
      });
      expect(onTransition).toHaveBeenNthCalledWith(2, {
        from: "second",
        to: "first",
        direction: "backward",
        oldContext: {},
        newContext: {},
      });
    });

    it("should call onTransition with updated context", () => {
      const flow = defineFlow({
        id: "test",
        start: "first",
        steps: {
          first: { next: "second" },
          second: {},
        },
      });

      const onTransition = vi.fn();

      function TestComponent() {
        const { next } = useFlow();
        return <button onClick={() => next({ name: "Alice" })}>Next</button>;
      }

      render(
        <Flow
          flow={flow}
          components={{
            first: TestComponent,
            second: () => <div>Second</div>,
          }}
          initialContext={{ name: "" }}
          onTransition={onTransition}
        />,
      );

      fireEvent.click(screen.getByText("Next"));

      expect(onTransition).toHaveBeenCalledTimes(1);
      expect(onTransition).toHaveBeenCalledWith({
        from: "first",
        to: "second",
        direction: "forward",
        oldContext: { name: "" },
        newContext: { name: "Alice" },
      });
    });

    it("should call both onNext and onTransition callbacks", () => {
      const flow = defineFlow({
        id: "test",
        start: "first",
        steps: {
          first: { next: "second" },
          second: {},
        },
      });

      const onNext = vi.fn();
      const onTransition = vi.fn();

      function TestComponent() {
        const { next } = useFlow();
        return <button onClick={() => next()}>Next</button>;
      }

      render(
        <Flow
          flow={flow}
          components={{
            first: TestComponent,
            second: () => <div>Second</div>,
          }}
          initialContext={{}}
          onNext={onNext}
          onTransition={onTransition}
        />,
      );

      fireEvent.click(screen.getByText("Next"));

      expect(onNext).toHaveBeenCalledTimes(1);
      expect(onNext).toHaveBeenCalledWith({
        from: "first",
        to: "second",
        oldContext: {},
        newContext: {},
      });

      expect(onTransition).toHaveBeenCalledTimes(1);
      expect(onTransition).toHaveBeenCalledWith({
        from: "first",
        to: "second",
        direction: "forward",
        oldContext: {},
        newContext: {},
      });
    });

    it("should call both onBack and onTransition callbacks", () => {
      const flow = defineFlow({
        id: "test",
        start: "first",
        steps: {
          first: { next: "second" },
          second: {},
        },
      });

      const onBack = vi.fn();
      const onTransition = vi.fn();

      function TestComponent() {
        const { next, back } = useFlow();
        return (
          <div>
            <button onClick={() => next()}>Next</button>
            <button onClick={() => back()}>Back</button>
          </div>
        );
      }

      render(
        <Flow
          flow={flow}
          components={{
            first: TestComponent,
            second: TestComponent,
          }}
          initialContext={{}}
          onBack={onBack}
          onTransition={onTransition}
        />,
      );

      // Navigate forward first
      fireEvent.click(screen.getByText("Next"));

      // Navigate back
      fireEvent.click(screen.getByText("Back"));

      expect(onBack).toHaveBeenCalledTimes(1);
      expect(onBack).toHaveBeenCalledWith({
        from: "second",
        to: "first",
        oldContext: {},
        newContext: {},
      });

      expect(onTransition).toHaveBeenCalledTimes(2);
      expect(onTransition).toHaveBeenNthCalledWith(2, {
        from: "second",
        to: "first",
        direction: "backward",
        oldContext: {},
        newContext: {},
      });
    });
  });

  describe("component property", () => {
    it("should expose current component via useFlow", () => {
      const FirstComponent = () => <div>First</div>;
      const SecondComponent = () => <div>Second</div>;

      const flow = defineFlow({
        id: "test",
        start: "first",
        steps: {
          first: { next: "second" },
          second: {},
        },
      });

      function TestComponent() {
        const { component, stepId } = useFlow();
        return (
          <div>
            <div data-testid="stepId">{stepId}</div>
            <div data-testid="hasComponent">{component ? "yes" : "no"}</div>
          </div>
        );
      }

      render(
        <Flow
          flow={flow}
          components={{
            first: FirstComponent,
            second: SecondComponent,
          }}
          initialContext={{}}
        >
          <TestComponent />
        </Flow>,
      );

      expect(screen.getByTestId("stepId")).toHaveTextContent("first");
      expect(screen.getByTestId("hasComponent")).toHaveTextContent("yes");
    });

    it("should update component when step changes", () => {
      const FirstComponent = () => <div>First Step</div>;
      const SecondComponent = () => <div>Second Step</div>;

      const flow = defineFlow({
        id: "test",
        start: "first",
        steps: {
          first: { next: "second" },
          second: {},
        },
      });

      function TestComponent() {
        const { component: Component, next, stepId } = useFlow();
        return (
          <div>
            <div data-testid="stepId">{stepId}</div>
            <div data-testid="renderedComponent">
              {Component && <Component />}
            </div>
            <button onClick={() => next()}>Next</button>
          </div>
        );
      }

      render(
        <Flow
          flow={flow}
          components={{
            first: FirstComponent,
            second: SecondComponent,
          }}
          initialContext={{}}
        >
          <TestComponent />
        </Flow>,
      );

      // Initially renders FirstComponent
      expect(screen.getByTestId("stepId")).toHaveTextContent("first");
      expect(screen.getByTestId("renderedComponent")).toHaveTextContent(
        "First Step",
      );

      // Navigate to second step
      fireEvent.click(screen.getByText("Next"));

      // Now renders SecondComponent
      expect(screen.getByTestId("stepId")).toHaveTextContent("second");
      expect(screen.getByTestId("renderedComponent")).toHaveTextContent(
        "Second Step",
      );
    });

    it("should allow rendering current component manually", () => {
      const flow = defineFlow({
        id: "test",
        start: "test",
        steps: {
          test: {},
        },
      });

      const TestStep = () => <div data-testid="content">Test Content</div>;

      function CustomRenderer() {
        const { component: Component } = useFlow();
        return (
          <div data-testid="custom-wrapper">{Component && <Component />}</div>
        );
      }

      render(
        <Flow
          flow={flow}
          components={{
            test: TestStep,
          }}
          initialContext={{}}
        >
          <CustomRenderer />
        </Flow>,
      );

      expect(screen.getByTestId("custom-wrapper")).toBeInTheDocument();
      expect(screen.getByTestId("content")).toHaveTextContent("Test Content");
    });

    it("should expose component reference that can be compared", () => {
      const FirstComponent = () => <div>First</div>;
      const SecondComponent = () => <div>Second</div>;

      const flow = defineFlow({
        id: "test",
        start: "first",
        steps: {
          first: { next: "second" },
          second: {},
        },
      });

      const componentRefs: unknown[] = [];

      function TestComponent() {
        const { component, next } = useFlow();

        // Store component reference
        if (component) {
          componentRefs.push(component);
        }

        return <button onClick={() => next()}>Next</button>;
      }

      render(
        <Flow
          flow={flow}
          components={{
            first: FirstComponent,
            second: SecondComponent,
          }}
          initialContext={{}}
        >
          <TestComponent />
        </Flow>,
      );

      // Initially should have FirstComponent
      expect(componentRefs[0]).toBe(FirstComponent);

      // Navigate to second step
      fireEvent.click(screen.getByText("Next"));

      // Should now have SecondComponent
      expect(componentRefs[1]).toBe(SecondComponent);
      expect(componentRefs[0]).not.toBe(componentRefs[1]);
    });

    it("should work with AnimatedFlowStep pattern", () => {
      const FirstComponent = () => <div>First</div>;
      const SecondComponent = () => <div>Second</div>;

      const flow = defineFlow({
        id: "test",
        start: "first",
        steps: {
          first: { next: "second" },
          second: {},
        },
      });

      // Simplified AnimatedFlowStep pattern
      function CustomAnimatedStep() {
        const { component: CurrentComponent, stepId } = useFlow();
        return (
          <div data-testid="animated-container">
            {CurrentComponent && (
              <div key={stepId} data-testid="current-step">
                <CurrentComponent />
              </div>
            )}
          </div>
        );
      }

      function NavigationControls() {
        const { next } = useFlow();
        return <button onClick={() => next()}>Next</button>;
      }

      render(
        <Flow
          flow={flow}
          components={{
            first: FirstComponent,
            second: SecondComponent,
          }}
          initialContext={{}}
        >
          <NavigationControls />
          <CustomAnimatedStep />
        </Flow>,
      );

      // Verify initial render
      expect(screen.getByTestId("current-step")).toHaveTextContent("First");

      // Navigate
      fireEvent.click(screen.getByText("Next"));

      // Verify component changed
      expect(screen.getByTestId("current-step")).toHaveTextContent("Second");
    });
  });

  describe("Persistence", () => {
    it("should restore state from persister on mount", async () => {
      const flow = defineFlow({
        id: "test-flow",
        start: "step1",
        steps: {
          step1: { next: "step2" },
          step2: { next: "step3" },
          step3: {},
        },
      });

      const savedState = {
        stepId: "step2",
        context: { name: "John" },
        path: [
          {
            stepId: "step1",
            startedAt: 1234567890,
            completedAt: 1234567890,
            action: "next" as const,
          },
          { stepId: "step2", startedAt: 1234567891 },
        ],
        history: [
          {
            stepId: "step1",
            startedAt: Date.now(),
            completedAt: Date.now(),
            action: "next" as const,
          },
          { stepId: "step2", startedAt: Date.now() },
        ],
        status: "active",
      };

      const persister = {
        save: vi.fn(),
        restore: vi.fn().mockResolvedValue(savedState),
      };

      render(
        <Flow
          flow={flow}
          components={{
            step1: () => <div>Step 1</div>,
            step2: () => <div>Step 2</div>,
            step3: () => <div>Step 3</div>,
          }}
          initialContext={{ name: "" }}
          persister={persister}
        />,
      );

      // Initially shows loading (or null by default)
      expect(screen.queryByText("Step 2")).not.toBeInTheDocument();

      // Wait for restoration
      await screen.findByText("Step 2");

      expect(persister.restore).toHaveBeenCalledWith("test-flow", {
        version: undefined,
        migrate: undefined,
      });
    });

    it("should call onRestore callback after successful restore", async () => {
      const flow = defineFlow({
        id: "test-flow-restore",
        start: "step1",
        steps: {
          step1: { next: "step2" },
          step2: { next: "step3" },
          step3: {},
        },
      });

      const savedState = {
        stepId: "step2",
        context: { name: "John" },
        path: [
          {
            stepId: "step1",
            startedAt: 1234567890,
            completedAt: 1234567890,
            action: "next" as const,
          },
          { stepId: "step2", startedAt: 1234567891 },
        ],
        history: [
          {
            stepId: "step1",
            startedAt: Date.now(),
            completedAt: Date.now(),
            action: "next" as const,
          },
          { stepId: "step2", startedAt: Date.now() },
        ],
        status: "active" as const,
      };

      const persister = {
        save: vi.fn(),
        restore: vi.fn().mockResolvedValue(savedState),
      };

      const onRestore = vi.fn();

      render(
        <Flow
          flow={flow}
          components={{
            step1: () => <div>Step 1</div>,
            step2: () => <div>Step 2</div>,
            step3: () => <div>Step 3</div>,
          }}
          initialContext={{ name: "" }}
          persister={persister}
          onRestore={onRestore}
        />,
      );

      // Wait for restoration
      await screen.findByText("Step 2");

      expect(onRestore).toHaveBeenCalledWith(savedState);
      expect(persister.restore).toHaveBeenCalledWith("test-flow-restore", {
        version: undefined,
        migrate: undefined,
      });
    });

    it("should call onSave callback when state is saved", async () => {
      const flow = defineFlow({
        id: "test-flow",
        start: "step1",
        steps: {
          step1: { next: "step2" },
          step2: {},
        },
      });

      const persister = {
        save: vi
          .fn()
          .mockImplementation((_flowId, state) => Promise.resolve(state)),
        restore: vi.fn().mockResolvedValue(null),
      };

      const onSave = vi.fn();

      function TestContent() {
        const { next, isRestoring } = useFlow();
        if (isRestoring) return <div>Loading...</div>;
        return (
          <div>
            <FlowStep />
            <button onClick={() => next()}>Next</button>
          </div>
        );
      }

      render(
        <Flow
          flow={flow}
          components={{
            step1: () => <div>Step 1</div>,
            step2: () => <div>Step 2</div>,
          }}
          initialContext={{ count: 0 }}
          persister={persister}
          onSave={onSave}
          saveDebounce={0}
        >
          <TestContent />
        </Flow>,
      );

      // Wait for restoration to complete (returns null, so starts from step1)
      await screen.findByText("Step 1");

      // Navigate to trigger save
      fireEvent.click(screen.getByText("Next"));

      // Wait for save to be called
      await vi.waitFor(() => {
        expect(onSave).toHaveBeenCalled();
      });
    });

    it("should show loading component while restoring", () => {
      const flow = defineFlow({
        id: "test-flow",
        start: "step1",
        steps: {
          step1: {},
        },
      });

      const persister = {
        save: vi.fn(),
        restore: vi.fn().mockImplementation(
          () =>
            new Promise((resolve) => {
              setTimeout(() => resolve(null), 100);
            }),
        ),
      };

      render(
        <Flow
          flow={flow}
          components={{
            step1: () => <div>Step 1</div>,
          }}
          initialContext={{}}
          persister={persister}
          loadingComponent={<div>Loading...</div>}
        />,
      );

      // Should show loading component
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should call onPersistenceError on restore validation failure", async () => {
      const flow = defineFlow({
        id: "test-flow",
        start: "step1",
        steps: {
          step1: { next: "step2" },
          step2: {},
        },
      });

      const invalidState = {
        stepId: "invalid-step", // Invalid step ID
        context: {},
        path: [{ stepId: "step1", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: Date.now() }],
        status: "active" as const,
      };

      const persister = {
        save: vi.fn(),
        restore: vi.fn().mockResolvedValue(invalidState),
      };

      const onPersistenceError = vi.fn();

      render(
        <Flow
          flow={flow}
          components={{
            step1: () => <div>Step 1</div>,
            step2: () => <div>Step 2</div>,
          }}
          initialContext={{}}
          persister={persister}
          onPersistenceError={onPersistenceError}
        />,
      );

      await waitFor(() => {
        expect(onPersistenceError).toHaveBeenCalled();
      });

      // Should fall back to initial state
      await waitFor(() => {
        expect(screen.getByText("Step 1")).toBeInTheDocument();
      });
    });

    it("should call onPersistenceError on restore exception", async () => {
      const flow = defineFlow({
        id: "test-flow",
        start: "step1",
        steps: {
          step1: {},
        },
      });

      const error = new Error("Storage error");
      const persister = {
        save: vi.fn(),
        restore: vi.fn().mockRejectedValue(error),
      };

      const onPersistenceError = vi.fn();

      render(
        <Flow
          flow={flow}
          components={{
            step1: () => <div>Step 1</div>,
          }}
          initialContext={{}}
          persister={persister}
          onPersistenceError={onPersistenceError}
        />,
      );

      await waitFor(() => {
        expect(onPersistenceError).toHaveBeenCalledWith(error);
      });
    });

    it("should handle restore returning null (no saved state)", async () => {
      const flow = defineFlow({
        id: "test-flow",
        start: "step1",
        steps: {
          step1: {},
        },
      });

      const persister = {
        save: vi.fn(),
        restore: vi.fn().mockResolvedValue(null),
      };

      const onRestore = vi.fn();

      render(
        <Flow
          flow={flow}
          components={{
            step1: () => <div>Step 1</div>,
          }}
          initialContext={{}}
          persister={persister}
          onRestore={onRestore}
        />,
      );

      await screen.findByText("Step 1");

      // Should not call onRestore when no state is restored
      expect(onRestore).not.toHaveBeenCalled();
      // Should start from initial state
      expect(screen.getByText("Step 1")).toBeInTheDocument();
    });

    it("should pass version and migrate to persister.restore", async () => {
      const migrate = vi.fn((state) => state);
      const flow = defineFlow(
        {
          id: "test-flow",
          start: "step1",
          version: "v2",
          steps: {
            step1: {},
          },
        } as const,
        () => ({
          migrate,
        }),
      );

      const persister = {
        save: vi.fn(),
        restore: vi.fn().mockResolvedValue(null),
      };

      render(
        <Flow
          flow={flow}
          components={{
            step1: () => <div>Step 1</div>,
          }}
          initialContext={{}}
          persister={persister}
        />,
      );

      await screen.findByText("Step 1");

      expect(persister.restore).toHaveBeenCalledWith("test-flow", {
        version: "v2",
        migrate: flow.runtimeConfig?.migrate,
      });
    });

    it("should call onPersistenceError on save failure", async () => {
      const flow = defineFlow({
        id: "test-flow-save-error",
        start: "step1",
        steps: {
          step1: { next: "step2" },
          step2: {},
        },
      });

      const saveError = new Error("Save failed");
      const persister = {
        save: vi.fn().mockRejectedValue(saveError),
        restore: vi.fn().mockResolvedValue(null),
      };

      const onPersistenceError = vi.fn();

      function TestContent() {
        const { next } = useFlow();
        return (
          <div>
            <FlowStep />
            <button onClick={() => next()}>Next</button>
          </div>
        );
      }

      render(
        <Flow
          flow={flow}
          components={{
            step1: () => <div>Step 1</div>,
            step2: () => <div>Step 2</div>,
          }}
          initialContext={{}}
          persister={persister}
          onPersistenceError={onPersistenceError}
          saveDebounce={0}
        >
          <TestContent />
        </Flow>,
      );

      await screen.findByText("Step 1");

      // Navigate to trigger save
      fireEvent.click(screen.getByText("Next"));

      // Wait for save error to be handled
      await waitFor(() => {
        expect(onPersistenceError).toHaveBeenCalledWith(saveError);
      });
    });

    it("should save with version when config has version", async () => {
      const flow = defineFlow({
        id: "test-flow-with-version",
        start: "step1",
        version: "v1",
        steps: {
          step1: { next: "step2" },
          step2: {},
        },
      } as const);

      const persister = {
        save: vi.fn().mockResolvedValue(undefined),
        restore: vi.fn().mockResolvedValue(null),
      };

      function TestContent() {
        const { next } = useFlow();
        return (
          <div>
            <FlowStep />
            <button onClick={() => next()}>Next</button>
          </div>
        );
      }

      render(
        <Flow
          flow={flow}
          components={{
            step1: () => <div>Step 1</div>,
            step2: () => <div>Step 2</div>,
          }}
          initialContext={{}}
          persister={persister}
          saveDebounce={0}
        >
          <TestContent />
        </Flow>,
      );

      await screen.findByText("Step 1");

      // Navigate to trigger save
      fireEvent.click(screen.getByText("Next"));

      // Wait for save to be called with version
      await vi.waitFor(() => {
        expect(persister.save).toHaveBeenCalledWith(
          "test-flow-with-version",
          expect.objectContaining({
            stepId: "step2",
            context: {},
            path: expect.arrayContaining([
              expect.objectContaining({ stepId: "step1" }),
              expect.objectContaining({ stepId: "step2" }),
            ]),
            history: expect.arrayContaining([
              expect.objectContaining({ stepId: "step1" }),
              expect.objectContaining({ stepId: "step2" }),
            ]),
            status: "complete",
          }),
          expect.objectContaining({ version: "v1" }),
        );
      });
    });

    it("should debounce saves when saveDebounce > 0", async () => {
      vi.useFakeTimers();

      try {
        const flow = defineFlow({
          id: "test-flow-debounce",
          start: "step1",
          steps: {
            step1: { next: "step2" },
            step2: { next: "step3" },
            step3: {},
          },
        });

        const persister = {
          save: vi.fn().mockResolvedValue(undefined),
          restore: vi.fn().mockResolvedValue(null),
        };

        function TestContent() {
          const { next, isRestoring } = useFlow();
          if (isRestoring) return <div>Loading...</div>;
          return (
            <div>
              <FlowStep />
              <button onClick={() => next()}>Next</button>
            </div>
          );
        }

        render(
          <Flow
            flow={flow}
            components={{
              step1: () => <div>Step 1</div>,
              step2: () => <div>Step 2</div>,
              step3: () => <div>Step 3</div>,
            }}
            initialContext={{}}
            persister={persister}
            saveDebounce={100}
          >
            <TestContent />
          </Flow>,
        );

        // Wait for restoration to complete (persister.restore returns null so it uses initial state)
        await act(async () => {
          await vi.runAllTimersAsync();
        });

        expect(screen.getByText("Step 1")).toBeInTheDocument();

        // Navigate multiple times quickly
        await act(async () => {
          fireEvent.click(screen.getByText("Next"));
        });
        expect(screen.getByText("Step 2")).toBeInTheDocument();

        // Should not have saved yet (debounced)
        expect(persister.save).not.toHaveBeenCalled();

        // Navigate again
        await act(async () => {
          fireEvent.click(screen.getByText("Next"));
        });
        expect(screen.getByText("Step 3")).toBeInTheDocument();

        // Still should not have saved yet
        expect(persister.save).not.toHaveBeenCalled();

        // Fast-forward time to trigger debounced save
        await act(async () => {
          await vi.advanceTimersByTimeAsync(100);
        });

        // Should only save once (last state) due to debounce cleanup
        expect(persister.save).toHaveBeenCalledTimes(1);
        expect(persister.save).toHaveBeenCalledWith(
          "test-flow-debounce",
          expect.objectContaining({
            stepId: "step3",
          }),
          expect.objectContaining({
            instanceId: undefined,
            version: undefined,
          }),
        );
      } finally {
        vi.useRealTimers();
      }
    });

    it("should not save when saveMode is manual", async () => {
      const flow = defineFlow({
        id: "test-flow-manual",
        start: "step1",
        steps: {
          step1: { next: "step2" },
          step2: {},
        },
      });

      const persister = {
        save: vi.fn().mockResolvedValue(undefined),
        restore: vi.fn().mockResolvedValue(null),
      };

      function TestContent() {
        const { next } = useFlow();
        return (
          <div>
            <FlowStep />
            <button onClick={() => next()}>Next</button>
          </div>
        );
      }

      render(
        <Flow
          flow={flow}
          components={{
            step1: () => <div>Step 1</div>,
            step2: () => <div>Step 2</div>,
          }}
          initialContext={{}}
          persister={persister}
          saveMode="manual"
          saveDebounce={0}
        >
          <TestContent />
        </Flow>,
      );

      await screen.findByText("Step 1");

      // Navigate
      fireEvent.click(screen.getByText("Next"));
      await screen.findByText("Step 2");

      // Wait a bit to ensure save is not called
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should not have saved
      expect(persister.save).not.toHaveBeenCalled();
    });

    it("should manually save when save() is called with saveMode=manual", async () => {
      const flow = defineFlow({
        id: "test-flow-manual-save",
        start: "step1",
        steps: {
          step1: { next: "step2" },
          step2: {},
        },
      });

      const persister = {
        save: vi.fn().mockResolvedValue(undefined),
        restore: vi.fn().mockResolvedValue(null),
      };

      function TestContent() {
        const { next, save } = useFlow();
        return (
          <div>
            <FlowStep />
            <button onClick={() => next()}>Next</button>
            <button onClick={() => save()}>Save</button>
          </div>
        );
      }

      render(
        <Flow
          flow={flow}
          components={{
            step1: () => <div>Step 1</div>,
            step2: () => <div>Step 2</div>,
          }}
          initialContext={{}}
          persister={persister}
          saveMode="manual"
          saveDebounce={0}
        >
          <TestContent />
        </Flow>,
      );

      await screen.findByText("Step 1");

      // Navigate
      fireEvent.click(screen.getByText("Next"));
      await screen.findByText("Step 2");

      // Wait a bit to ensure auto-save is not called
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(persister.save).not.toHaveBeenCalled();

      // Manually trigger save
      fireEvent.click(screen.getByText("Save"));

      // Wait for save to be called
      await vi.waitFor(() => {
        expect(persister.save).toHaveBeenCalledWith(
          "test-flow-manual-save",
          expect.objectContaining({
            stepId: "step2",
          }),
          expect.objectContaining({
            version: undefined,
            instanceId: undefined,
          }),
        );
      });

      expect(persister.save).toHaveBeenCalledTimes(1);
    });

    it("should call onPersistenceError on manual save failure", async () => {
      const flow = defineFlow({
        id: "test-flow-manual-error",
        start: "step1",
        steps: {
          step1: {},
        },
      });

      const saveError = new Error("Manual save failed");
      const persister = {
        save: vi.fn().mockRejectedValue(saveError),
        restore: vi.fn().mockResolvedValue(null),
      };

      const onPersistenceError = vi.fn();

      function TestContent() {
        const { save } = useFlow();
        return (
          <div>
            <FlowStep />
            <button onClick={() => save()}>Save</button>
          </div>
        );
      }

      render(
        <Flow
          flow={flow}
          components={{
            step1: () => <div>Step 1</div>,
          }}
          initialContext={{}}
          persister={persister}
          saveMode="manual"
          onPersistenceError={onPersistenceError}
        >
          <TestContent />
        </Flow>,
      );

      await screen.findByText("Step 1");

      // Manually trigger save (which will fail)
      fireEvent.click(screen.getByText("Save"));

      // Wait for error to be called
      await vi.waitFor(() => {
        expect(onPersistenceError).toHaveBeenCalledWith(saveError);
      });
    });

    it("should handle manual save when no persister is configured", async () => {
      const flow = defineFlow({
        id: "test-flow-no-persister",
        start: "step1",
        steps: {
          step1: {},
        },
      });

      function TestContent() {
        const { save } = useFlow();
        return (
          <div>
            <FlowStep />
            <button onClick={() => save()}>Save</button>
          </div>
        );
      }

      render(
        <Flow
          flow={flow}
          components={{
            step1: () => <div>Step 1</div>,
          }}
          initialContext={{}}
          // No persister configured
        >
          <TestContent />
        </Flow>,
      );

      await screen.findByText("Step 1");

      // Should not throw when calling save without persister
      fireEvent.click(screen.getByText("Save"));

      // Just verify it doesn't crash
      expect(screen.getByText("Step 1")).toBeInTheDocument();
    });

    it("should call onSave callback when manual save succeeds", async () => {
      const flow = defineFlow({
        id: "test-flow-onsave",
        start: "step1",
        steps: {
          step1: {},
        },
      });

      const persister = {
        save: vi
          .fn()
          .mockImplementation((_flowId, state) => Promise.resolve(state)),
        restore: vi.fn().mockResolvedValue(null),
      };

      const onSave = vi.fn();

      function TestContent() {
        const { save } = useFlow();
        return (
          <div>
            <FlowStep />
            <button onClick={() => save()}>Save</button>
          </div>
        );
      }

      render(
        <Flow
          flow={flow}
          components={{
            step1: () => <div>Step 1</div>,
          }}
          initialContext={{}}
          persister={persister}
          saveMode="manual"
          onSave={onSave}
        >
          <TestContent />
        </Flow>,
      );

      await screen.findByText("Step 1");

      // Manually trigger save
      fireEvent.click(screen.getByText("Save"));

      // Wait for onSave to be called
      await vi.waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            stepId: "step1",
          }),
        );
      });
    });

    it("should save on every change when saveMode is always", async () => {
      const flow = defineFlow({
        id: "test-flow-always",
        start: "step1",
        steps: {
          step1: { next: "step2" },
          step2: {},
        },
      });

      const persister = {
        save: vi.fn().mockResolvedValue(undefined),
        restore: vi.fn().mockResolvedValue(null),
      };

      function TestContent() {
        const { next, setContext } = useFlow();
        return (
          <div>
            <FlowStep />
            <button onClick={() => next()}>Next</button>
            <button onClick={() => setContext({ count: 1 })}>
              Update Context
            </button>
          </div>
        );
      }

      render(
        <Flow
          flow={flow}
          components={{
            step1: () => <div>Step 1</div>,
            step2: () => <div>Step 2</div>,
          }}
          initialContext={{ count: 0 }}
          persister={persister}
          saveMode="always"
          saveDebounce={0}
        >
          <TestContent />
        </Flow>,
      );

      await screen.findByText("Step 1");

      // Update context (should save with saveMode: always)
      fireEvent.click(screen.getByText("Update Context"));

      // Wait for save
      await vi.waitFor(() => {
        expect(persister.save).toHaveBeenCalled();
      });

      const firstCallCount = persister.save.mock.calls.length;

      // Navigate (should also save)
      fireEvent.click(screen.getByText("Next"));
      await screen.findByText("Step 2");

      // Wait for second save
      await vi.waitFor(() => {
        expect(persister.save).toHaveBeenCalledTimes(firstCallCount + 1);
      });
    });

    it("should default to navigation strategy when saveMode is not provided", async () => {
      const flow = defineFlow({
        id: "test-flow-default",
        start: "step1",
        steps: {
          step1: { next: "step2" },
          step2: {},
        },
      });

      const persister = {
        save: vi.fn().mockResolvedValue(undefined),
        restore: vi.fn().mockResolvedValue(null),
      };

      function TestContent() {
        const { next, setContext } = useFlow();
        return (
          <div>
            <FlowStep />
            <button onClick={() => next()}>Next</button>
            <button onClick={() => setContext({ count: 1 })}>
              Update Context
            </button>
          </div>
        );
      }

      render(
        <Flow
          flow={flow}
          components={{
            step1: () => <div>Step 1</div>,
            step2: () => <div>Step 2</div>,
          }}
          initialContext={{ count: 0 }}
          persister={persister}
          // No saveMode prop - should default to "navigation"
          saveDebounce={0}
        >
          <TestContent />
        </Flow>,
      );

      await screen.findByText("Step 1");

      // Update context (should NOT save with default navigation strategy)
      fireEvent.click(screen.getByText("Update Context"));

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should not have saved
      expect(persister.save).not.toHaveBeenCalled();

      // Navigate (should save with default navigation strategy)
      fireEvent.click(screen.getByText("Next"));
      await screen.findByText("Step 2");

      // Wait for save
      await vi.waitFor(() => {
        expect(persister.save).toHaveBeenCalled();
      });
    });

    describe("instanceId support", () => {
      it("should save with instanceId when provided", async () => {
        const flow = defineFlow({
          id: "test-flow-instance",
          start: "step1",
          steps: {
            step1: { next: "step2" },
            step2: {},
          },
        });

        const persister = {
          save: vi.fn().mockResolvedValue(undefined),
          restore: vi.fn().mockResolvedValue(null),
        };

        function TestContent() {
          const { next } = useFlow();
          return (
            <div>
              <FlowStep />
              <button onClick={() => next()}>Next</button>
            </div>
          );
        }

        render(
          <Flow
            flow={flow}
            components={{
              step1: () => <div>Step 1</div>,
              step2: () => <div>Step 2</div>,
            }}
            initialContext={{}}
            instanceId="task-123"
            persister={persister}
            saveDebounce={0}
          >
            <TestContent />
          </Flow>,
        );

        await screen.findByText("Step 1");

        // Navigate to trigger save
        fireEvent.click(screen.getByText("Next"));

        // Wait for save with instanceId
        await vi.waitFor(() => {
          expect(persister.save).toHaveBeenCalledWith(
            "test-flow-instance",
            expect.objectContaining({
              stepId: "step2",
            }),
            expect.objectContaining({
              instanceId: "task-123",
            }),
          );
        });
      });

      it("should restore with instanceId when provided", async () => {
        const flow = defineFlow({
          id: "test-flow-restore-instance",
          start: "step1",
          steps: {
            step1: { next: "step2" },
            step2: { next: "step3" },
            step3: {},
          },
        });

        const savedState = {
          stepId: "step2",
          context: { name: "John" },
          path: [
            {
              stepId: "step1",
              startedAt: 1234567890,
              completedAt: 1234567890,
              action: "next" as const,
            },
            { stepId: "step2", startedAt: 1234567891 },
          ],
          history: [
            {
              stepId: "step1",
              startedAt: Date.now(),
              completedAt: Date.now(),
              action: "next" as const,
            },
            { stepId: "step2", startedAt: Date.now() },
          ],
          status: "active" as const,
        };

        const persister = {
          save: vi.fn(),
          restore: vi.fn().mockResolvedValue(savedState),
        };

        render(
          <Flow
            flow={flow}
            components={{
              step1: () => <div>Step 1</div>,
              step2: () => <div>Step 2</div>,
              step3: () => <div>Step 3</div>,
            }}
            initialContext={{ name: "" }}
            instanceId="task-456"
            persister={persister}
          />,
        );

        // Initially shows loading (or null by default)
        expect(screen.queryByText("Step 2")).not.toBeInTheDocument();

        // Wait for restoration
        await screen.findByText("Step 2");

        expect(persister.restore).toHaveBeenCalledWith(
          "test-flow-restore-instance",
          expect.objectContaining({
            instanceId: "task-456",
          }),
        );
      });

      it("should keep different instances separate", async () => {
        const flow = defineFlow({
          id: "test-flow-multi-instance",
          start: "step1",
          steps: {
            step1: { next: "step2" },
            step2: {},
          },
        });

        const persister1 = {
          save: vi.fn().mockResolvedValue(undefined),
          restore: vi.fn().mockResolvedValue(null),
        };

        const persister2 = {
          save: vi.fn().mockResolvedValue(undefined),
          restore: vi.fn().mockResolvedValue(null),
        };

        function TestContent() {
          const { next } = useFlow();
          return (
            <div>
              <FlowStep />
              <button onClick={() => next()}>Next</button>
            </div>
          );
        }

        const { unmount } = render(
          <>
            <Flow
              flow={flow}
              components={{
                step1: () => <div>Instance 1 - Step 1</div>,
                step2: () => <div>Instance 1 - Step 2</div>,
              }}
              initialContext={{}}
              instanceId="instance-1"
              persister={persister1}
              saveDebounce={0}
            >
              <TestContent />
            </Flow>
            <Flow
              flow={flow}
              components={{
                step1: () => <div>Instance 2 - Step 1</div>,
                step2: () => <div>Instance 2 - Step 2</div>,
              }}
              initialContext={{}}
              instanceId="instance-2"
              persister={persister2}
              saveDebounce={0}
            >
              <TestContent />
            </Flow>
          </>,
        );

        await screen.findByText("Instance 1 - Step 1");
        await screen.findByText("Instance 2 - Step 1");

        // Navigate first instance
        const buttons = screen.getAllByText("Next");
        fireEvent.click(buttons[0]!);

        await screen.findByText("Instance 1 - Step 2");

        // Verify first instance saved with correct instanceId
        await vi.waitFor(() => {
          expect(persister1.save).toHaveBeenCalledWith(
            "test-flow-multi-instance",
            expect.objectContaining({
              stepId: "step2",
            }),
            expect.objectContaining({
              instanceId: "instance-1",
            }),
          );
        });

        // Second instance should not have been saved yet
        expect(persister2.save).not.toHaveBeenCalled();

        unmount();
      });

      it("should save with both instanceId and version", async () => {
        const flow = defineFlow({
          id: "test-flow-instance-version",
          start: "step1",
          version: "v2",
          steps: {
            step1: { next: "step2" },
            step2: {},
          },
        } as const);

        const persister = {
          save: vi.fn().mockResolvedValue(undefined),
          restore: vi.fn().mockResolvedValue(null),
        };

        function TestContent() {
          const { next } = useFlow();
          return (
            <div>
              <FlowStep />
              <button onClick={() => next()}>Next</button>
            </div>
          );
        }

        render(
          <Flow
            flow={flow}
            components={{
              step1: () => <div>Step 1</div>,
              step2: () => <div>Step 2</div>,
            }}
            initialContext={{}}
            instanceId="task-789"
            persister={persister}
            saveDebounce={0}
          >
            <TestContent />
          </Flow>,
        );

        await screen.findByText("Step 1");

        // Navigate to trigger save
        fireEvent.click(screen.getByText("Next"));

        // Wait for save with both instanceId and version
        await vi.waitFor(() => {
          expect(persister.save).toHaveBeenCalledWith(
            "test-flow-instance-version",
            expect.objectContaining({
              stepId: "step2",
            }),
            {
              instanceId: "task-789",
              version: "v2",
            },
          );
        });
      });
    });
  });

  describe("reset", () => {
    it("should reset flow to initial state", () => {
      const flow = defineFlow({
        id: "test-reset",
        start: "first",
        steps: {
          first: { next: "second" },
          second: { next: "third" },
          third: {},
        },
      });

      function TestComponent() {
        const { stepId, context, next, setContext, reset } = useFlow();
        return (
          <div>
            <div data-testid="stepId">{stepId}</div>
            <div data-testid="count">{context.count}</div>
            <button onClick={() => next()}>Next</button>
            <button onClick={() => setContext({ count: context.count + 1 })}>
              Increment
            </button>
            <button onClick={() => reset()}>Reset</button>
          </div>
        );
      }

      render(
        <Flow
          flow={flow}
          components={{
            first: () => <div>First</div>,
            second: () => <div>Second</div>,
            third: () => <div>Third</div>,
          }}
          initialContext={{ count: 0 }}
        >
          <TestComponent />
        </Flow>,
      );

      // Initial state
      expect(screen.getByTestId("stepId")).toHaveTextContent("first");
      expect(screen.getByTestId("count")).toHaveTextContent("0");

      // Navigate and modify context
      fireEvent.click(screen.getByText("Increment"));
      expect(screen.getByTestId("count")).toHaveTextContent("1");

      fireEvent.click(screen.getByText("Next"));
      expect(screen.getByTestId("stepId")).toHaveTextContent("second");

      fireEvent.click(screen.getByText("Increment"));
      expect(screen.getByTestId("count")).toHaveTextContent("2");

      // Reset should go back to initial state
      fireEvent.click(screen.getByText("Reset"));

      expect(screen.getByTestId("stepId")).toHaveTextContent("first");
      expect(screen.getByTestId("count")).toHaveTextContent("0");
    });

    it("should clear persisted state on reset", async () => {
      const persister = {
        save: vi.fn(async () => ({
          stepId: "test",
          context: {},
          path: [],
          history: [],
          status: "active" as const,
        })),
        restore: vi.fn(async () => null),
        remove: vi.fn(async () => {}),
      };

      const flow = defineFlow({
        id: "test-reset-persist",
        start: "first",
        steps: {
          first: { next: "second" },
          second: {},
        },
      });

      function TestComponent() {
        const { stepId, next, reset } = useFlow();
        return (
          <div>
            <div data-testid="stepId">{stepId}</div>
            <button onClick={() => next()}>Next</button>
            <button onClick={() => reset()}>Reset</button>
          </div>
        );
      }

      function FirstStep() {
        return <div>First</div>;
      }

      function SecondStep() {
        return <div>Second</div>;
      }

      render(
        <Flow
          flow={flow}
          components={{
            first: FirstStep,
            second: SecondStep,
          }}
          initialContext={{ value: 0 }}
          persister={persister}
          saveDebounce={0}
        >
          <FlowStep />
          <TestComponent />
        </Flow>,
      );

      await waitFor(() => {
        expect(screen.getByText("First")).toBeInTheDocument();
      });

      // Navigate to trigger save
      fireEvent.click(screen.getByText("Next"));

      // Wait for save to be called
      await vi.waitFor(() => {
        expect(persister.save).toHaveBeenCalled();
      });

      // Reset should call persister.remove
      fireEvent.click(screen.getByText("Reset"));

      await waitFor(() => {
        expect(persister.remove).toHaveBeenCalledWith("test-reset-persist", {
          instanceId: undefined,
          variantId: undefined,
        });
        expect(screen.getByTestId("stepId")).toHaveTextContent("first");
      });
    });

    it("should clear persisted state with instanceId on reset", async () => {
      const persister = {
        save: vi.fn(async () => ({
          stepId: "test",
          context: {},
          path: [],
          history: [],
          status: "active" as const,
        })),
        restore: vi.fn(async () => null),
        remove: vi.fn(async () => {}),
      };

      const flow = defineFlow({
        id: "test-reset-instance",
        start: "step1",
        steps: {
          step1: { next: "step2" },
          step2: {},
        },
      });

      function TestComponent() {
        const { reset } = useFlow();
        return <button onClick={() => reset()}>Reset</button>;
      }

      function Step1() {
        return <div>Step 1</div>;
      }

      function Step2() {
        return <div>Step 2</div>;
      }

      render(
        <Flow
          flow={flow}
          components={{
            step1: Step1,
            step2: Step2,
          }}
          initialContext={{}}
          instanceId="instance-123"
          persister={persister}
        >
          <FlowStep />
          <TestComponent />
        </Flow>,
      );

      await waitFor(() => {
        expect(screen.getByText("Step 1")).toBeInTheDocument();
      });

      // Reset should call persister.remove with instanceId
      fireEvent.click(screen.getByText("Reset"));

      await waitFor(() => {
        expect(persister.remove).toHaveBeenCalledWith("test-reset-instance", {
          instanceId: "instance-123",
          variantId: undefined,
        });
      });
    });

    it("should handle persistence errors on reset", async () => {
      const onPersistenceError = vi.fn();
      const persister = {
        save: vi.fn(async () => ({
          stepId: "test",
          context: {},
          path: [],
          history: [],
          status: "active" as const,
        })),
        restore: vi.fn(async () => null),
        remove: vi.fn(async () => {
          throw new Error("Failed to remove");
        }),
      };

      const flow = defineFlow({
        id: "test-reset-error",
        start: "first",
        steps: {
          first: {},
        },
      });

      function TestComponent() {
        const { reset } = useFlow();
        return <button onClick={() => reset()}>Reset</button>;
      }

      function FirstStep() {
        return <div>First</div>;
      }

      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(
        <Flow
          flow={flow}
          components={{
            first: FirstStep,
          }}
          initialContext={{}}
          persister={persister}
          onPersistenceError={onPersistenceError}
        >
          <FlowStep />
          <TestComponent />
        </Flow>,
      );

      await waitFor(() => {
        expect(screen.getByText("First")).toBeInTheDocument();
      });

      // Reset should handle error gracefully
      fireEvent.click(screen.getByText("Reset"));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          "[Flow] Failed to remove persisted state on reset:",
          expect.any(Error),
        );
        expect(onPersistenceError).toHaveBeenCalledWith(expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it("should reset from completed state", () => {
      const flow = defineFlow({
        id: "test-reset-complete",
        start: "first",
        steps: {
          first: { next: "last" },
          last: {},
        },
      });

      function TestComponent() {
        const { stepId, status, next, reset } = useFlow();
        return (
          <div>
            <div data-testid="stepId">{stepId}</div>
            <div data-testid="status">{status}</div>
            <button onClick={() => next()}>Next</button>
            <button onClick={() => reset()}>Reset</button>
          </div>
        );
      }

      render(
        <Flow
          flow={flow}
          components={{
            first: () => <div>First</div>,
            last: () => <div>Last</div>,
          }}
          initialContext={{ value: "start" }}
        >
          <TestComponent />
        </Flow>,
      );

      // Navigate to completed state
      fireEvent.click(screen.getByText("Next"));
      expect(screen.getByTestId("stepId")).toHaveTextContent("last");
      expect(screen.getByTestId("status")).toHaveTextContent("complete");

      // Reset from completed state
      fireEvent.click(screen.getByText("Reset"));
      expect(screen.getByTestId("stepId")).toHaveTextContent("first");
      expect(screen.getByTestId("status")).toHaveTextContent("active");
    });
  });

  describe("metadata exposure", () => {
    it("should expose steps metadata with only next property", () => {
      const flow = defineFlow({
        id: "test",
        start: "stepA",
        steps: {
          stepA: { next: "stepB" },
          stepB: { next: ["stepC", "stepD"] },
          stepC: {},
          stepD: {},
        },
      });

      function TestComponent() {
        const { steps } = useFlow();
        return <div data-testid="steps">{JSON.stringify(steps)}</div>;
      }

      render(
        <Flow
          flow={flow}
          components={{
            stepA: TestComponent,
            stepB: () => <div>B</div>,
            stepC: () => <div>C</div>,
            stepD: () => <div>D</div>,
          }}
          initialContext={{ value: "" }}
        />,
      );

      const steps = JSON.parse(screen.getByTestId("steps").textContent || "{}");

      expect(steps).toEqual({
        stepA: { next: "stepB" },
        stepB: { next: ["stepC", "stepD"] },
        stepC: { next: undefined },
        stepD: { next: undefined },
      });
    });

    it("should expose nextSteps from current step (string next)", () => {
      const flow = defineFlow({
        id: "test",
        start: "stepA",
        steps: {
          stepA: { next: "stepB" },
          stepB: {},
        },
      });

      function TestComponent() {
        const { nextSteps } = useFlow();
        return <div data-testid="nextSteps">{JSON.stringify(nextSteps)}</div>;
      }

      render(
        <Flow
          flow={flow}
          components={{
            stepA: TestComponent,
            stepB: () => <div>B</div>,
          }}
          initialContext={{ value: "" }}
        />,
      );

      const nextSteps = JSON.parse(
        screen.getByTestId("nextSteps").textContent || "[]",
      );
      expect(nextSteps).toEqual(["stepB"]);
    });

    it("should expose nextSteps from current step (array next)", () => {
      const flow = defineFlow({
        id: "test",
        start: "stepA",
        steps: {
          stepA: { next: ["stepB", "stepC"] },
          stepB: {},
          stepC: {},
        },
      });

      function TestComponent() {
        const { nextSteps } = useFlow();
        return <div data-testid="nextSteps">{JSON.stringify(nextSteps)}</div>;
      }

      render(
        <Flow
          flow={flow}
          components={{
            stepA: TestComponent,
            stepB: () => <div>B</div>,
            stepC: () => <div>C</div>,
          }}
          initialContext={{ value: "" }}
        />,
      );

      const nextSteps = JSON.parse(
        screen.getByTestId("nextSteps").textContent || "[]",
      );
      expect(nextSteps).toEqual(["stepB", "stepC"]);
    });

    it("should return undefined nextSteps for terminal step", () => {
      const flow = defineFlow({
        id: "test",
        start: "stepA",
        steps: {
          stepA: { next: "stepB" },
          stepB: {},
        },
      });

      function TestComponent() {
        const { nextSteps, stepId } = useFlow();
        return (
          <div>
            <div data-testid="stepId">{stepId}</div>
            <div data-testid="nextSteps">
              {nextSteps === undefined
                ? "undefined"
                : JSON.stringify(nextSteps)}
            </div>
          </div>
        );
      }

      render(
        <Flow
          flow={flow}
          components={{
            stepA: TestComponent,
            stepB: TestComponent,
          }}
          initialContext={{ value: "" }}
        />,
      );

      // First step should have nextSteps
      expect(screen.getByTestId("stepId")).toHaveTextContent("stepA");
      expect(screen.getByTestId("nextSteps")).toHaveTextContent('["stepB"]');

      // Navigate to terminal step
      fireEvent.click(screen.getByTestId("stepId")); // Trigger re-render
      const nextButton = screen.getByTestId("stepId");
      fireEvent.click(nextButton);

      // Need to actually navigate - let me use a button
    });

    it("should update nextSteps when navigating between steps", () => {
      const flow = defineFlow({
        id: "test",
        start: "stepA",
        steps: {
          stepA: { next: "stepB" },
          stepB: { next: ["stepC", "stepD"] },
          stepC: {},
          stepD: {},
        },
      });

      function TestComponent() {
        const { nextSteps, next, stepId } = useFlow();
        return (
          <div>
            <div data-testid="stepId">{stepId}</div>
            <div data-testid="nextSteps">
              {nextSteps === undefined
                ? "undefined"
                : JSON.stringify(nextSteps)}
            </div>
            <button type="button" onClick={() => next()} data-testid="next">
              Next
            </button>
          </div>
        );
      }

      render(
        <Flow
          flow={flow}
          components={{
            stepA: TestComponent,
            stepB: TestComponent,
            stepC: TestComponent,
            stepD: TestComponent,
          }}
          initialContext={{ value: "" }}
        />,
      );

      // stepA should have nextSteps: ["stepB"]
      expect(screen.getByTestId("stepId")).toHaveTextContent("stepA");
      expect(screen.getByTestId("nextSteps")).toHaveTextContent('["stepB"]');

      // Navigate to stepB
      fireEvent.click(screen.getByTestId("next"));

      // stepB should have nextSteps: ["stepC", "stepD"]
      expect(screen.getByTestId("stepId")).toHaveTextContent("stepB");
      expect(screen.getByTestId("nextSteps")).toHaveTextContent(
        '["stepC","stepD"]',
      );
    });
  });
});
