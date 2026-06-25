import * as core from "@actions/core";
import * as github from "@actions/github";
import { getPullRequestDiff, postReviewComment } from "./github.ts";
import { reviewDiff } from "./review.ts";

async function run(): Promise<void> {
  const pullRequest = github.context.payload.pull_request;
  if (!pullRequest) {
    core.setFailed("Este Action só roda em eventos de pull_request.");
    return;
  }

  const token = core.getInput("github-token", { required: true });
  const openrouterApiKey = core.getInput("openrouter-api-key", { required: true });
  const octokit = github.getOctokit(token);
  const { owner, repo } = github.context.repo;

  const files = await getPullRequestDiff(octokit, owner, repo, pullRequest.number);
  const review = await reviewDiff(files, openrouterApiKey);
  await postReviewComment(octokit, owner, repo, pullRequest.number, review);

  core.info(`Review postado no PR #${pullRequest.number}`);
}

run().catch((error) => core.setFailed(error instanceof Error ? error.message : String(error)));
