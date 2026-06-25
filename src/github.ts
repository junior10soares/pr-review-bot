import { Octokit } from "@octokit/rest";

// estrutural: aceita tanto @octokit/rest quanto o client de @actions/github.getOctokit(), que só expõe .rest/.paginate
export type GitHubClient = Pick<Octokit, "rest" | "paginate">;

export interface PullRequestFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

export async function getPullRequestDiff(
  octokit: GitHubClient,
  owner: string,
  repo: string,
  pullNumber: number,
): Promise<PullRequestFile[]> {
  const files = await octokit.paginate(octokit.rest.pulls.listFiles, {
    owner,
    repo,
    pull_number: pullNumber,
    per_page: 100,
  });

  return files.map(({ filename, status, additions, deletions, patch }) => ({
    filename,
    status,
    additions,
    deletions,
    patch,
  }));
}

export async function postReviewComment(
  octokit: GitHubClient,
  owner: string,
  repo: string,
  pullNumber: number,
  body: string,
): Promise<void> {
  await octokit.rest.pulls.createReview({
    owner,
    repo,
    pull_number: pullNumber,
    body,
    event: "COMMENT",
  });
}
