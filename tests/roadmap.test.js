// Catches typos in the roadmap before they go live. Run with: npm test
const test = require("node:test");
const assert = require("node:assert/strict");
const ROADMAP = require("../assets/roadmap.js");

test("every roadmap item has a valid status, a title, and a description", () => {
  for (const item of ROADMAP) {
    assert.ok(["done", "now", "next", "later"].includes(item.status), `"${item.title}" has an unknown status: ${item.status}`);
    assert.ok(item.title && item.title.length <= 60, `an item is missing a title, or its title is too long: ${item.title}`);
    assert.ok(item.text && item.text.length <= 200, `"${item.title}" is missing a description, or it's too long`);
  }
});