// Run with: npm test
const test = require("node:test");
const assert = require("node:assert/strict");
const { calculate, gramsPerMeter } = require("../assets/calc.js");
const MATERIALS = require("../assets/materials.js");

const base = { density: 1.24, diameter: 1.75, spoolKg: 1, wastePct: 0, onHandG: 0, price: 20 };
const run = (jobs, extra = {}) => calculate({ ...base, jobs, ...extra });

test("1.75 mm PLA weighs about 2.98 g per meter", () => {
  assert.ok(Math.abs(gramsPerMeter(1.75, 1.24) - 2.98) < 0.01);
});

test("exactly one spool's worth needs one spool, not two", () => {
  const r = run([{ amount: 1000, unit: "g" }]);
  assert.equal(r.spools, 1);
  assert.equal(r.leftoverG, 0);
});

test("one gram over a spool needs a second spool", () => {
  assert.equal(run([{ amount: 1001, unit: "g" }]).spools, 2);
});

test("meters are converted to grams", () => {
  const r = run([{ amount: 100, unit: "m" }]);
  assert.ok(Math.abs(r.baseG - 298) < 1);
});

test("multiple prints are added together", () => {
  const r = run([{ amount: 600, unit: "g" }, { amount: 600, unit: "g" }]);
  assert.equal(r.baseG, 1200);
  assert.equal(r.spools, 2);
});

test("waste buffer increases the total", () => {
  const r = run([{ amount: 1000, unit: "g" }], { wastePct: 10 });
  assert.ok(Math.abs(r.totalG - 1100) < 1e-6);
  assert.equal(r.spools, 2);
});

test("filament on hand reduces what you need to buy", () => {
  assert.equal(run([{ amount: 1200, unit: "g" }], { onHandG: 300 }).spools, 1);
  const enough = run([{ amount: 200, unit: "g" }], { onHandG: 500 });
  assert.equal(enough.spools, 0);
  assert.equal(enough.leftoverG, 300);
});

test("costs are calculated from spool price", () => {
  const r = run([{ amount: 500, unit: "g" }]);
  assert.equal(r.costToBuy, 20);
  assert.equal(r.costUsed, 10);
});

test("empty and junk input doesn't crash", () => {
  const r = run([{ amount: "", unit: "g" }, { amount: "abc", unit: "m" }, { amount: -5, unit: "g" }]);
  assert.equal(r.ready, false);
  assert.equal(r.spools, 0);
});

test("every material has a realistic density", () => {
  for (const [name, d] of Object.entries(MATERIALS)) {
    assert.ok(typeof d === "number" && d >= 0.8 && d <= 2.5, `${name} has an unrealistic density: ${d}`);
  }
  assert.ok(MATERIALS.PLA, "PLA must exist (it's the default)");
});