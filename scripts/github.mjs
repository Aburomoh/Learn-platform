// REST only: Anthropic-hosted Claude sessions proxy gh api, but not GraphQL gh issue/pr list.
import { execFileSync } from "node:child_process";

export const gh = (...args) => execFileSync("gh", args, {
  encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 30_000, windowsHide: true,
});

export function openItems(labels, request = gh) {
  // The repository issues endpoint includes pull requests. Paginate before filtering so a role's
  // wake cannot disappear just because the first page is filled with unrelated open items.
  const pages = JSON.parse(request("api", "--paginate", "--slurp", "repos/{owner}/{repo}/issues?state=open&per_page=100"));
  return pages.flat().filter((it) => it.labels.some((label) => labels.includes(label.name))).map((it) => ({
    number: it.number, title: it.title, url: it.html_url, updatedAt: it.updated_at, labels: it.labels,
  }));
}
