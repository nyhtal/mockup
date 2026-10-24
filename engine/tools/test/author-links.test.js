import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

// Reads the built reference site: run `npm run build -- --site reference` first (build.test.js does).
const read = (p) => readFileSync(`dist/reference/${p}/index.html`, "utf8");
const graph = (html) => JSON.parse(/<script type="application\/ld\+json">(.*?)<\/script>/s.exec(html)[1])["@graph"];

test("a press release's byline, author box and press contact link the author's bio page in every locale, and its NewsArticle names the Person", () => {
  for (const loc of ["en", "de", "ar", "ja"]) {
    const html = read(`${loc}/news/riyadh-office`);
    const bio = `/${loc}/about/team/sofia-lindqvist/`;
    const meta = html.slice(html.indexOf('data-component="article-meta"'), html.indexOf("</section>", html.indexOf('data-component="article-meta"')));
    assert.match(meta, new RegExp(`<a href="${bio}" rel="author"`), `${loc} byline`);
    const box = html.slice(html.indexOf('<aside class="flex gap-4'), html.indexOf("</aside>"));
    assert.match(box, new RegExp(`<a href="${bio}" rel="author"`), `${loc} author box`);
    const contact = html.slice(html.indexOf('data-component="media-contact"'));
    assert.match(contact, new RegExp(`<address[^>]*>\\n<p class="font-semibold"><a href="${bio}"`), `${loc} press contact`);
    const nodes = graph(html);
    const article = nodes.find((n) => n["@type"] === "NewsArticle");
    const person = nodes.find((n) => n["@type"] === "Person");
    assert.equal(article.author["@id"], person["@id"], `${loc} NewsArticle author is the Person node`);
    assert.match(person["@id"], new RegExp(`${bio}#person$`));
  }
});

test("one profile per person: a post's author links the same profile as a press release's, and no author archive is built", () => {
  for (const loc of ["en", "de", "ar", "ja"]) {
    const html = read(`${loc}/blog/sensor-logic-at-the-edge`);
    assert.match(html, new RegExp(`<a href="/${loc}/about/team/priya-natarajan/" rel="author"`), `${loc} post byline`);
    assert.doesNotMatch(html, /\/blog\/author\//, `${loc} no link to an author archive`);
    assert.ok(!existsSync(`dist/reference/${loc}/blog/author`), `${loc} has no author archive pages`);
  }
});

test("a person's profile lists what they wrote: posts and press releases, each list only when it has items", () => {
  for (const loc of ["en", "de", "ar", "ja"]) {
    const sofia = read(`${loc}/about/team/sofia-lindqvist`);
    const press = sofia.slice(sofia.indexOf('data-component="press-cards"'));
    for (const slug of ["riyadh-office", "thousandth-line", "northwind-4"]) assert.match(press, new RegExp(`href="/${loc}/news/${slug}/"`), `${loc} Sofia lists ${slug}`);
    assert.doesNotMatch(sofia, /data-component="related-articles"/, `${loc} Sofia wrote no posts`);
    const priya = read(`${loc}/about/team/priya-natarajan`);
    assert.match(priya, new RegExp(`data-component="related-articles"[\\s\\S]*href="/${loc}/blog/sensor-logic-at-the-edge/"`), `${loc} Priya lists her post`);
    assert.doesNotMatch(priya, /data-component="press-cards"/, `${loc} Priya wrote no press releases`);
  }
});
