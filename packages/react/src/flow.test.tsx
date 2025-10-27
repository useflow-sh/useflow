import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  describe("Flow callbacks", () => {
    it("should call onNext callback when navigating forward", () => {
      const flow = defineFlow({
        id: "test",
        start: "first",
        steps: {
          first: { next: "second" },
          second: {},
        },
      } as const satisfies FlowConfig<object>);

      const onNext = vi.fn();

      function TestComponent() {
        const { next } = useFlow();
        return <button onClick={() => next()}>Next</button>;
      }

      render(
        <Flow
          flow={flow}
          components={() => ({
            first: TestComponent,
            second: () => <div>Second</div>,
          })}
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
      } as const satisfies FlowConfig<object>);

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
          components={() => ({
            first: TestComponent,
            second: TestComponent,
          })}
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
      } as const satisfies FlowConfig<{ name: string }>);

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
          components={() => ({
            form: TestComponent,
          })}
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
      } as const satisfies FlowConfig<{ choice: string }>);

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
          components={() => ({
            menu: TestComponent,
            option1: () => <div>Option 1</div>,
            option2: () => <div>Option 2</div>,
          })}
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
      } as const satisfies FlowConfig<object>);

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
          components={() => ({
            first: TestComponent,
            second: TestComponent,
          })}
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
      } as const satisfies FlowConfig<object>);

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
          components={() => ({
            first: TestComponent,
            second: TestComponent,
          })}
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
      } as const satisfies FlowConfig<{ count: number }>);

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
          components={() => ({
            first: TestComponent,
            second: TestComponent,
          })}
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
      } as const satisfies FlowConfig<object>);

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
          components={() => ({
            first: TestComponent,
            second: TestComponent,
          })}
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
      } as const satisfies FlowConfig<{ name: string }>);

      const onTransition = vi.fn();

      function TestComponent() {
        const { next } = useFlow();
        return <button onClick={() => next({ name: "Alice" })}>Next</button>;
      }

      render(
        <Flow
          flow={flow}
          components={() => ({
            first: TestComponent,
            second: () => <div>Second</div>,
          })}
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
      } as const satisfies FlowConfig<object>);

      const onNext = vi.fn();
      const onTransition = vi.fn();

      function TestComponent() {
        const { next } = useFlow();
        return <button onClick={() => next()}>Next</button>;
      }

      render(
        <Flow
          flow={flow}
          components={() => ({
            first: TestComponent,
            second: () => <div>Second</div>,
          })}
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
      } as const satisfies FlowConfig<object>);

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
          components={() => ({
            first: TestComponent,
            second: TestComponent,
          })}
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
      } as const satisfies FlowConfig<object>);

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
          components={() => ({
            first: FirstComponent,
            second: SecondComponent,
          })}
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
      } as const satisfies FlowConfig<object>);

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
          components={() => ({
            first: FirstComponent,
            second: SecondComponent,
          })}
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
      } as const satisfies FlowConfig<object>);

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
          components={() => ({
            test: TestStep,
          })}
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
      } as const satisfies FlowConfig<object>);

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
          components={() => ({
            first: FirstComponent,
            second: SecondComponent,
          })}
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
      } as const satisfies FlowConfig<object>);

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
          components={() => ({
            first: FirstComponent,
            second: SecondComponent,
          })}
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
      } as const satisfies FlowConfig<{ name: string }>);

      const savedState = {
        stepId: "step2",
        context: { name: "John" },
        history: ["step1", "step2"],
        status: "active" as const,
      };

      const persister = {
        save: vi.fn(),
        restore: vi.fn().mockResolvedValue(savedState),
      };

      render(
        <Flow
          flow={flow}
          components={() => ({
            step1: () => <div>Step 1</div>,
            step2: () => <div>Step 2</div>,
            step3: () => <div>Step 3</div>,
          })}
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
      } as const satisfies FlowConfig<{ name: string }>);

      const savedState = {
        stepId: "step2",
        context: { name: "John" },
        history: ["step1", "step2"],
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
          components={() => ({
            step1: () => <div>Step 1</div>,
            step2: () => <div>Step 2</div>,
            step3: () => <div>Step 3</div>,
          })}
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
      } as const satisfies FlowConfig<{ count: number }>);

      const persister = {
        save: vi.fn().mockResolvedValue(undefined),
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
          components={() => ({
            step1: () => <div>Step 1</div>,
            step2: () => <div>Step 2</div>,
          })}
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
      } as const satisfies FlowConfig<Record<string, never>>);

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
          components={() => ({
            step1: () => <div>Step 1</div>,
          })}
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
      } as const satisfies FlowConfig<Record<string, never>>);

      const invalidState = {
        stepId: "invalid-step", // Invalid step ID
        context: {},
        history: ["step1"],
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
          components={() => ({
            step1: () => <div>Step 1</div>,
            step2: () => <div>Step 2</div>,
          })}
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
      } as const satisfies FlowConfig<Record<string, never>>);

      const error = new Error("Storage error");
      const persister = {
        save: vi.fn(),
        restore: vi.fn().mockRejectedValue(error),
      };

      const onPersistenceError = vi.fn();

      render(
        <Flow
          flow={flow}
          components={() => ({
            step1: () => <div>Step 1</div>,
          })}
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
      } as const satisfies FlowConfig<Record<string, never>>);

      const persister = {
        save: vi.fn(),
        restore: vi.fn().mockResolvedValue(null),
      };

      const onRestore = vi.fn();

      render(
        <Flow
          flow={flow}
          components={() => ({
            step1: () => <div>Step 1</div>,
          })}
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
      const flow = defineFlow({
        id: "test-flow",
        start: "step1",
        version: "v2",
        migrate,
        steps: {
          step1: {},
        },
      } as const);

      const persister = {
        save: vi.fn(),
        restore: vi.fn().mockResolvedValue(null),
      };

      render(
        <Flow
          flow={flow}
          components={() => ({
            step1: () => <div>Step 1</div>,
          })}
          initialContext={{}}
          persister={persister}
        />,
      );

      await screen.findByText("Step 1");

      expect(persister.restore).toHaveBeenCalledWith("test-flow", {
        version: "v2",
        migrate: flow.config.migrate,
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
      } as const satisfies FlowConfig<Record<string, never>>);

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
          components={() => ({
            step1: () => <div>Step 1</div>,
            step2: () => <div>Step 2</div>,
          })}
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
          components={() => ({
            step1: () => <div>Step 1</div>,
            step2: () => <div>Step 2</div>,
          })}
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
            history: ["step1", "step2"],
            status: "complete",
          }),
          { version: "v1" },
        );
      });
    });

    it("should debounce saves when saveDebounce > 0", async () => {
      const flow = defineFlow({
        id: "test-flow-debounce",
        start: "step1",
        steps: {
          step1: { next: "step2" },
          step2: { next: "step3" },
          step3: {},
        },
      } as const satisfies FlowConfig<Record<string, never>>);

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
          components={() => ({
            step1: () => <div>Step 1</div>,
            step2: () => <div>Step 2</div>,
            step3: () => <div>Step 3</div>,
          })}
          initialContext={{}}
          persister={persister}
          saveDebounce={100}
        >
          <TestContent />
        </Flow>,
      );

      await screen.findByText("Step 1");

      // Navigate multiple times quickly
      fireEvent.click(screen.getByText("Next"));
      await screen.findByText("Step 2");

      // Should not have saved yet (debounced)
      expect(persister.save).not.toHaveBeenCalled();

      // Navigate again
      fireEvent.click(screen.getByText("Next"));
      await screen.findByText("Step 3");

      // Still should not have saved yet
      expect(persister.save).not.toHaveBeenCalled();

      // Wait for debounce to complete
      await vi.waitFor(
        () => {
          expect(persister.save).toHaveBeenCalled();
        },
        { timeout: 200 },
      );

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
    });

    it("should not save when saveMode is manual", async () => {
      const flow = defineFlow({
        id: "test-flow-manual",
        start: "step1",
        steps: {
          step1: { next: "step2" },
          step2: {},
        },
      } as const satisfies FlowConfig<Record<string, never>>);

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
          components={() => ({
            step1: () => <div>Step 1</div>,
            step2: () => <div>Step 2</div>,
          })}
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
      } as const satisfies FlowConfig<Record<string, never>>);

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
          components={() => ({
            step1: () => <div>Step 1</div>,
            step2: () => <div>Step 2</div>,
          })}
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
      } as const satisfies FlowConfig<Record<string, never>>);

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
          components={() => ({
            step1: () => <div>Step 1</div>,
          })}
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
      } as const satisfies FlowConfig<Record<string, never>>);

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
          components={() => ({
            step1: () => <div>Step 1</div>,
          })}
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
      } as const satisfies FlowConfig<Record<string, never>>);

      const persister = {
        save: vi.fn().mockResolvedValue(undefined),
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
          components={() => ({
            step1: () => <div>Step 1</div>,
          })}
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
      } as const satisfies FlowConfig<{ count: number }>);

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
          components={() => ({
            step1: () => <div>Step 1</div>,
            step2: () => <div>Step 2</div>,
          })}
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
      } as const satisfies FlowConfig<{ count: number }>);

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
          components={() => ({
            step1: () => <div>Step 1</div>,
            step2: () => <div>Step 2</div>,
          })}
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
        } as const satisfies FlowConfig<Record<string, never>>);

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
            components={() => ({
              step1: () => <div>Step 1</div>,
              step2: () => <div>Step 2</div>,
            })}
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
        } as const satisfies FlowConfig<{ name: string }>);

        const savedState = {
          stepId: "step2",
          context: { name: "John" },
          history: ["step1", "step2"],
          status: "active" as const,
        };

        const persister = {
          save: vi.fn(),
          restore: vi.fn().mockResolvedValue(savedState),
        };

        render(
          <Flow
            flow={flow}
            components={() => ({
              step1: () => <div>Step 1</div>,
              step2: () => <div>Step 2</div>,
              step3: () => <div>Step 3</div>,
            })}
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
        } as const satisfies FlowConfig<Record<string, never>>);

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
              components={() => ({
                step1: () => <div>Instance 1 - Step 1</div>,
                step2: () => <div>Instance 1 - Step 2</div>,
              })}
              initialContext={{}}
              instanceId="instance-1"
              persister={persister1}
              saveDebounce={0}
            >
              <TestContent />
            </Flow>
            <Flow
              flow={flow}
              components={() => ({
                step1: () => <div>Instance 2 - Step 1</div>,
                step2: () => <div>Instance 2 - Step 2</div>,
              })}
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
            components={() => ({
              step1: () => <div>Step 1</div>,
              step2: () => <div>Step 2</div>,
            })}
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
});
