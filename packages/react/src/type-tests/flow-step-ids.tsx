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
      {({ stepId }) => {
        const current: TestStepId = stepId;
        void current;

        // @ts-expect-error - step ids should be a literal union, not arbitrary strings
        const _invalid: "does-not-exist" = stepId;
        void _invalid;

        return null;
      }}
    </Flow>
  );
}
