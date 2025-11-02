import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryStore, createPersister } from "@useflow/core";
import { describe, expect, it, vi } from "vitest";
import { defineFlow } from "./define-flow";
import { Flow } from "./flow";
import { FlowProvider } from "./provider";

const testFlow = defineFlow({
  id: "test-flow",
  start: "step1",
  steps: {
    step1: { next: "step2" },
    step2: {},
  },
});

describe("Flow with Global Config", () => {
  it("uses persister from FlowProvider", async () => {
    const store = createMemoryStore();
    const persister = createPersister({ store });
    const saveSpy = vi.spyOn(persister, "save");

    render(
      <FlowProvider config={{ persister, saveMode: "always" }}>
        <Flow
          flow={testFlow}
          initialContext={{}}
          loadingComponent={<div>Loading...</div>}
        >
          {({ renderStep }) =>
            renderStep({
              step1: <div>Step 1</div>,
              step2: <div>Step 2</div>,
            })
          }
        </Flow>
      </FlowProvider>,
    );

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalled();
    });
  });

  it("allows Flow to override persister from provider", async () => {
    const globalStore = createMemoryStore();
    const globalPersister = createPersister({ store: globalStore });
    const globalSaveSpy = vi.spyOn(globalPersister, "save");

    const localStore = createMemoryStore();
    const localPersister = createPersister({ store: localStore });
    const localSaveSpy = vi.spyOn(localPersister, "save");

    render(
      <FlowProvider config={{ persister: globalPersister, saveMode: "always" }}>
        <Flow
          flow={testFlow}
          initialContext={{}}
          persister={localPersister}
          loadingComponent={<div>Loading...</div>}
        >
          {({ renderStep }) =>
            renderStep({
              step1: <div>Step 1</div>,
              step2: <div>Step 2</div>,
            })
          }
        </Flow>
      </FlowProvider>,
    );

    await waitFor(() => {
      expect(localSaveSpy).toHaveBeenCalled();
      expect(globalSaveSpy).not.toHaveBeenCalled();
    });
  });

  it("uses saveMode from FlowProvider", async () => {
    const store = createMemoryStore();
    const persister = createPersister({ store });

    render(
      <FlowProvider config={{ persister, saveMode: "manual" }}>
        <Flow
          flow={testFlow}
          initialContext={{}}
          loadingComponent={<div>Loading...</div>}
        >
          {({ renderStep, save }) => (
            <div>
              {renderStep({
                step1: <div>Step 1</div>,
                step2: <div>Step 2</div>,
              })}
              <button onClick={save}>Save</button>
            </div>
          )}
        </Flow>
      </FlowProvider>,
    );

    // saveMode is "manual", so save() should not be called automatically
    await waitFor(() => {
      expect(screen.getByText("Step 1")).toBeInTheDocument();
    });
  });

  it("uses saveDebounce from FlowProvider", async () => {
    const store = createMemoryStore();
    const persister = createPersister({ store });
    const saveSpy = vi.spyOn(persister, "save");

    render(
      <FlowProvider
        config={{ persister, saveMode: "always", saveDebounce: 100 }}
      >
        <Flow
          flow={testFlow}
          initialContext={{}}
          loadingComponent={<div>Loading...</div>}
        >
          {({ renderStep }) =>
            renderStep({
              step1: <div>Step 1</div>,
              step2: <div>Step 2</div>,
            })
          }
        </Flow>
      </FlowProvider>,
    );

    // Save should be debounced
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(saveSpy).toHaveBeenCalled();
  });

  it("calls global onFlowStart callback", async () => {
    const onFlowStart = vi.fn();

    render(
      <FlowProvider config={{ callbacks: { onFlowStart } }}>
        <Flow
          flow={testFlow}
          initialContext={{ test: "value" }}
          loadingComponent={<div>Loading...</div>}
        >
          {({ renderStep }) =>
            renderStep({
              step1: <div>Step 1</div>,
              step2: <div>Step 2</div>,
            })
          }
        </Flow>
      </FlowProvider>,
    );

    await waitFor(() => {
      expect(onFlowStart).toHaveBeenCalledWith({
        flowId: "test-flow",
        variantId: undefined,
        instanceId: undefined,
        context: { test: "value" },
      });
    });
  });

  it("calls global onFlowComplete callback", async () => {
    const onFlowComplete = vi.fn();
    const twoStepFlow = defineFlow({
      id: "two-step",
      start: "step1",
      steps: {
        step1: { next: "complete" },
        complete: {},
      },
    });

    render(
      <FlowProvider config={{ callbacks: { onFlowComplete } }}>
        <Flow
          flow={twoStepFlow}
          initialContext={{ data: "test" }}
          loadingComponent={<div>Loading...</div>}
        >
          {({ renderStep, next }) => (
            <div>
              {renderStep({
                step1: (
                  <div>
                    <div>Step 1</div>
                    <button onClick={() => next()}>Next</button>
                  </div>
                ),
                complete: <div>Complete</div>,
              })}
            </div>
          )}
        </Flow>
      </FlowProvider>,
    );

    // Click next to complete the flow
    const button = screen.getByText("Next");
    button.click();

    await waitFor(() => {
      expect(onFlowComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          flowId: "two-step",
          variantId: undefined,
          instanceId: undefined,
          context: { data: "test" },
        }),
      );
    });
  });

  it("calls global onStepTransition callback on next", async () => {
    const onStepTransition = vi.fn();

    render(
      <FlowProvider config={{ callbacks: { onStepTransition } }}>
        <Flow
          flow={testFlow}
          initialContext={{}}
          loadingComponent={<div>Loading...</div>}
        >
          {({ renderStep, next }) => (
            <div>
              {renderStep({
                step1: (
                  <div>
                    <div>Step 1</div>
                    <button onClick={() => next()}>Next</button>
                  </div>
                ),
                step2: <div>Step 2</div>,
              })}
            </div>
          )}
        </Flow>
      </FlowProvider>,
    );

    const button = screen.getByText("Next");
    button.click();

    await waitFor(() => {
      expect(onStepTransition).toHaveBeenCalledWith(
        expect.objectContaining({
          flowId: "test-flow",
          from: "step1",
          to: "step2",
          direction: "forward",
        }),
      );
    });
  });

  it("calls global onStepTransition callback on skip", async () => {
    const onStepTransition = vi.fn();

    render(
      <FlowProvider config={{ callbacks: { onStepTransition } }}>
        <Flow
          flow={testFlow}
          initialContext={{}}
          loadingComponent={<div>Loading...</div>}
        >
          {({ renderStep, skip }) => (
            <div>
              {renderStep({
                step1: (
                  <div>
                    <div>Step 1</div>
                    <button onClick={() => skip()}>Skip</button>
                  </div>
                ),
                step2: <div>Step 2</div>,
              })}
            </div>
          )}
        </Flow>
      </FlowProvider>,
    );

    const button = screen.getByText("Skip");
    button.click();

    await waitFor(() => {
      expect(onStepTransition).toHaveBeenCalledWith(
        expect.objectContaining({
          flowId: "test-flow",
          from: "step1",
          to: "step2",
          direction: "forward",
        }),
      );
    });
  });

  it("calls global onStepTransition callback on back", async () => {
    const onStepTransition = vi.fn();

    const threeStepFlow = defineFlow({
      id: "three-step",
      start: "step1",
      steps: {
        step1: { next: "step2" },
        step2: { next: "step3" },
        step3: {},
      },
    });

    render(
      <FlowProvider config={{ callbacks: { onStepTransition } }}>
        <Flow
          flow={threeStepFlow}
          initialContext={{}}
          loadingComponent={<div>Loading...</div>}
        >
          {({ renderStep, next, back }) => (
            <div>
              {renderStep({
                step1: (
                  <div>
                    <div>Step 1</div>
                    <button onClick={() => next()}>Next</button>
                  </div>
                ),
                step2: (
                  <div>
                    <div>Step 2</div>
                    <button onClick={() => next()}>Next</button>
                  </div>
                ),
                step3: (
                  <div>
                    <div>Step 3</div>
                    <button onClick={back}>Back</button>
                  </div>
                ),
              })}
            </div>
          )}
        </Flow>
      </FlowProvider>,
    );

    // Navigate to step2
    const nextButton1 = screen.getByText("Next");
    nextButton1.click();

    await waitFor(() => {
      expect(screen.getByText("Step 2")).toBeInTheDocument();
    });

    // Navigate to step3
    const nextButton2 = screen.getByText("Next");
    nextButton2.click();

    await waitFor(() => {
      expect(screen.getByText("Step 3")).toBeInTheDocument();
    });

    // Clear previous calls
    onStepTransition.mockClear();

    // Go back to step2
    const backButton = screen.getByText("Back");
    backButton.click();

    await waitFor(() => {
      expect(onStepTransition).toHaveBeenCalledWith(
        expect.objectContaining({
          flowId: "three-step",
          from: "step3",
          to: "step2",
          direction: "backward",
        }),
      );
    });
  });
});

it("uses onPersistenceError from FlowProvider", async () => {
  const onPersistenceError = vi.fn();
  const store = createMemoryStore();
  const persister = createPersister({ store });

  // Make save throw an error
  vi.spyOn(persister, "save").mockRejectedValue(new Error("Save failed"));

  render(
    <FlowProvider
      config={{ persister, saveMode: "always", onPersistenceError }}
    >
      <Flow
        flow={testFlow}
        initialContext={{}}
        loadingComponent={<div>Loading...</div>}
      >
        {({ renderStep }) =>
          renderStep({
            step1: <div>Step 1</div>,
            step2: <div>Step 2</div>,
          })
        }
      </Flow>
    </FlowProvider>,
  );

  await waitFor(() => {
    expect(onPersistenceError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Save failed" }),
    );
  });
});

it("Flow works without FlowProvider", () => {
  render(
    <Flow
      flow={testFlow}
      initialContext={{}}
      loadingComponent={<div>Loading...</div>}
    >
      {({ renderStep }) =>
        renderStep({
          step1: <div>Step 1</div>,
          step2: <div>Step 2</div>,
        })
      }
    </Flow>,
  );

  expect(screen.getByText("Step 1")).toBeInTheDocument();
});

it("includes variantId and instanceId in global callbacks", async () => {
  const onFlowStart = vi.fn();
  const onStepTransition = vi.fn();

  const flowWithVariant = defineFlow({
    id: "variant-flow",
    variantId: "variant-a",
    start: "step1",
    steps: {
      step1: { next: "step2" },
      step2: {},
    },
  });

  render(
    <FlowProvider config={{ callbacks: { onFlowStart, onStepTransition } }}>
      <Flow
        flow={flowWithVariant}
        initialContext={{}}
        instanceId="instance-123"
        loadingComponent={<div>Loading...</div>}
      >
        {({ renderStep, next }) => (
          <div>
            {renderStep({
              step1: (
                <div>
                  <div>Step 1</div>
                  <button onClick={() => next()}>Next</button>
                </div>
              ),
              step2: <div>Step 2</div>,
            })}
          </div>
        )}
      </Flow>
    </FlowProvider>,
  );

  await waitFor(() => {
    expect(onFlowStart).toHaveBeenCalledWith(
      expect.objectContaining({
        flowId: "variant-flow",
        variantId: "variant-a",
        instanceId: "instance-123",
      }),
    );
  });

  await waitFor(() => {
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  const button = screen.getByText("Next");
  button.click();

  await waitFor(
    () => {
      expect(onStepTransition).toHaveBeenCalledWith(
        expect.objectContaining({
          flowId: "variant-flow",
          variantId: "variant-a",
          instanceId: "instance-123",
          from: "step1",
          to: "step2",
          direction: "forward",
        }),
      );
    },
    { timeout: 3000 },
  );
});
