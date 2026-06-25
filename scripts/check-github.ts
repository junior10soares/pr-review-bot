import { Octokit } from "@octokit/rest";
import { getPullRequestDiff } from "../src/github.ts";

const [owner, repo, pullNumber] = process.argv.slice(2);
if (!owner || !repo || !pullNumber) {
  console.error("uso: node scripts/check-github.ts <owner> <repo> <pull_number>");
  process.exit(1);
}

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const files = await getPullRequestDiff(octokit, owner, repo, Number(pullNumber));

console.log(`${files.length} arquivo(s) alterados`);
for (const file of files) {
  console.log(`\n--- ${file.filename} (${file.status}, +${file.additions}/-${file.deletions}) ---`);
  console.log(file.patch ?? "(sem patch — binário ou arquivo grande)");
}
