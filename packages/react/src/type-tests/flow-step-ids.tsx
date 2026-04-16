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
      {({ next, nextSteps, skip, stepId }) => {
        const current: TestStepId = stepId;
        void current;

        const allowedNextSteps: readonly TestStepId[] | undefined = nextSteps;
        void allowedNextSteps;

        next("profile");
        skip("profile");

        // @ts-expect-error - step ids should be a literal union, not arbitrary strings
        const _invalid: "does-not-exist" = stepId;
        void _invalid;

        // @ts-expect-error - render-prop navigation targets should be known step ids
        next("does-not-exist");

        // @ts-expect-error - render-prop skip targets should be known step ids
        skip("does-not-exist");

        return null;
      }}
    </Flow>
  );
}
