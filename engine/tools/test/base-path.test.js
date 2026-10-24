import { test } from "node:test";
import assert from "node:assert/strict";
import { rewriteHtml, rewriteJson } from "../base-path.js";

test("base path: the search index URL on the results and the result links in the index move under the sub-path", () => {
  assert.equal(rewriteHtml('<div data-index="/en/search/index.json">', "/repo"), '<div data-index="/repo/en/search/index.json">');
  assert.equal(rewriteJson('[{"href":"/en/x/","title":"/not a url"},{"href":"https://a.b/"}]', "/repo"), '[{"href":"/repo/en/x/","title":"/not a url"},{"href":"https://a.b/"}]');
});
