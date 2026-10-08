import assert from "node:assert/strict";
import test from "node:test";
import { openItems } from "./github.mjs";

test("REST queue recovers issue and PR wakes across pages without GraphQL", () => {
  const issue = (number, label, extra = {}) => ({ number, title: `Item ${number}`, html_url: `https://github.com/o/r/issues/${number}`, updated_at: "2026-10-08T10:00:00Z", labels: [{ name: label }], ...extra });
  const result = openItems(["wake:ui"], (...args) => {
    assert.deepEqual(args, ["api", "--paginate", "--slurp", "repos/{owner}/{repo}/issues?state=open&per_page=100"]);
    return JSON.stringify([[issue(1, "wake:lead"), issue(2, "wake:ui")], [issue(3, "wake:ui", { pull_request: {}, html_url: "https://github.com/o/r/pull/3" })]]);
  });
  assert.deepEqual(result.map((it) => [it.number, it.url, it.updatedAt]), [
    [2, "https://github.com/o/r/issues/2", "2026-10-08T10:00:00Z"],
    [3, "https://github.com/o/r/pull/3", "2026-10-08T10:00:00Z"],
  ]);
  assert.deepEqual(result[1].labels, [{ name: "wake:ui" }]);
});

test("queue failures propagate rather than becoming an empty queue", () => {
  assert.throws(() => openItems(["wake:ui"], () => { throw new Error("GitHub unavailable"); }), /GitHub unavailable/);
  assert.throws(() => openItems(["wake:ui"], () => "not JSON"), SyntaxError);
  assert.deepEqual(openItems(["wake:ui"], () => "[[]]"), []);
});
