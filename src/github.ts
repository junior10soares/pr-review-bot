import { fileURLToPath } from "node:url";
import { Octokit } from "@octokit/rest";

export interface PullRequestFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

export async function getPullRequestDiff(
  octokit: Octokit,
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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [owner, repo, pullNumber] = process.argv.slice(2);
  if (!owner || !repo || !pullNumber) {
    console.error("uso: node src/github.ts <owner> <repo> <pull_number>");
    process.exit(1);
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const files = await getPullRequestDiff(octokit, owner, repo, Number(pullNumber));

  console.log(`${files.length} arquivo(s) alterados`);
  for (const file of files) {
    console.log(`\n--- ${file.filename} (${file.status}, +${file.additions}/-${file.deletions}) ---`);
    console.log(file.patch ?? "(sem patch — binário ou arquivo grande)");
  }
}
