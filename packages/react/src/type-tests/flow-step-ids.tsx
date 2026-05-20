import { defineFlow, Flow } from "../index";

const testFlow = defineFlow({
  id: "type-tests",
  start: "welcome",
  steps: {
    welcome: { next: "profile" },
    profile: {},
  },
});

type TestStepId = keyof typeof testFlow.config.steps & string;

export function FlowStepIdTypeTest() {
  return (
    <Flow
      flow={testFlow}
      onTransition={(event) => {
        const to: TestStepId = event.to;
        const from: TestStepId = event.from;

        void to;
        void from;

        // @ts-expect-error - step ids should be a literal union, not arbitrary strings
        const _invalid: "does-not-exist" = event.to;
        void _invalid;
      }}
    >
      {(state) => {
        const current: TestStepId = state.stepId;
        void current;

        const allowedNextSteps: readonly TestStepId[] | undefined =
          state.nextSteps;
        void allowedNextSteps;

        // @ts-expect-error - step ids should be a literal union, not arbitrary strings
        const _invalid: "does-not-exist" = state.stepId;
        void _invalid;

        // @ts-expect-error - render-prop navigation targets should be known step ids
        state.next("does-not-exist");

        // @ts-expect-error - render-prop skip targets should be known step ids
        state.skip("does-not-exist");

        // @ts-expect-error - explicit render-prop targets require narrowing by stepId
        state.next("profile");

        if (state.stepId === "welcome") {
          const welcomeNextSteps: readonly "profile"[] | undefined =
            state.nextSteps;
          void welcomeNextSteps;

          state.next("profile");
          state.skip("profile");

          // @ts-expect-error - welcome can only navigate directly to profile
          state.next("welcome");

          // @ts-expect-error - welcome can only skip directly to profile
          state.skip("welcome");
        }

        if (state.stepId === "profile") {
          const terminalNextSteps: readonly never[] | undefined =
            state.nextSteps;
          void terminalNextSteps;

          // @ts-expect-error - profile is terminal and has no explicit next target
          state.next("welcome");

          // @ts-expect-error - profile is terminal and has no explicit skip target
          state.skip("welcome");
        }

        return null;
      }}
    </Flow>
  );
}

export function FlowRenderPropDestructureTypeTest() {
  return (
    <Flow flow={testFlow}>
      {({ next, skip, stepId }) => {
        if (stepId === "welcome") {
          next("profile");
          skip("profile");

          // @ts-expect-error - destructured render props should preserve step-local next targets
          next("welcome");

          // @ts-expect-error - destructured render props should preserve step-local skip targets
          skip("welcome");
        }

        return null;
      }}
    </Flow>
  );
}
