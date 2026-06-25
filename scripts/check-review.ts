import type { PullRequestFile } from "../src/github.ts";
import { reviewDiff } from "../src/review.ts";

const apiKey = process.env.OPENROUTER_API_KEY;
console.assert(apiKey, "OPENROUTER_API_KEY não está definida");

const sampleDiff: PullRequestFile[] = [
  {
    filename: "src/sum.ts",
    status: "modified",
    additions: 3,
    deletions: 1,
    patch: "@@ -1,1 +1,3 @@\n-export const sum = (a, b) => a + b\n+export const sum = (a: any, b: any) => {\n+  return a + b\n+}",
  },
];

const review = await reviewDiff(sampleDiff, apiKey!);
console.log(review);
