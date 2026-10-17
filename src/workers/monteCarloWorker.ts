import type { StressRunInput } from "@/lib/monteCarloRunner";
import { runStressAnalysis } from "@/lib/monteCarloRunner";

export type MonteCarloWorkerRequest = {
  type: "run";
  runId: number;
  input: StressRunInput;
};

export type MonteCarloWorkerResponse = {
  type: "result";
  runId: number;
  result: ReturnType<typeof runStressAnalysis>;
};

self.onmessage = (ev: MessageEvent<MonteCarloWorkerRequest>) => {
  if (ev.data.type === "run") {
    const result = runStressAnalysis(ev.data.input);
    const msg: MonteCarloWorkerResponse = {
      type: "result",
      runId: ev.data.runId,
      result,
    };
    self.postMessage(msg);
  }
};
