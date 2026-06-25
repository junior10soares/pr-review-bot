import assert from "node:assert/strict";
import { test } from "node:test";
import type { PullRequestFile } from "../src/github.ts";
import { reviewDiff, type ReviewModel } from "../src/review.ts";

const sampleFiles: PullRequestFile[] = [
  {
    filename: "src/sum.ts",
    status: "modified",
    additions: 1,
    deletions: 0,
    patch: "+export const sum = (a: any, b: any) => a + b",
  },
];

test("reviewDiff envia o diff formatado pro model e retorna o conteúdo da resposta", async () => {
  const calls: { role: string; content: string }[][] = [];
  const fakeModel: ReviewModel = {
    invoke: async (messages) => {
      calls.push(messages);
      return { content: "review fake" };
    },
  };

  const result = await reviewDiff(sampleFiles, "fake-key", fakeModel);

  assert.equal(result, "review fake");
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0].role, "system");
  assert.equal(calls[0][1].role, "user");
  assert.match(calls[0][1].content, /src\/sum\.ts/);
  assert.match(calls[0][1].content, /sum = \(a: any, b: any\)/);
});

test("reviewDiff usa um placeholder quando o arquivo não tem patch", async () => {
  const filesWithoutPatch: PullRequestFile[] = [
    { filename: "image.png", status: "modified", additions: 0, deletions: 0 },
  ];
  const fakeModel: ReviewModel = {
    invoke: async (messages) => {
      assert.match(messages[1].content, /sem patch disponível/);
      return { content: "ok" };
    },
  };

  await reviewDiff(filesWithoutPatch, "fake-key", fakeModel);
});
