// All the calculator's math. No buttons or page stuff in here,
// so the tests can check it on its own.

// Spool sizes to offer, in kilograms.
const SPOOL_SIZES = [0.25, 0.5, 0.75, 1, 2, 3, 5];

// Turns whatever someone typed into a usable number.
// Blank, negative, or nonsense input becomes 0.
function toNumber(value) {
  const n = parseFloat(value);
  if (isFinite(n) && n > 0) return n;
  return 0;
}

// How many grams one meter of filament weighs.
// Area of the filament's circle (mm²) × density (g/cm³) = grams per meter.
function gramsPerMeter(diameterMm, density) {
  const radius = diameterMm / 2;
  return Math.PI * radius * radius * density;
}

// The main calculation. Takes everything the person entered
// and returns every number the page needs to show.
function calculate(input) {
  const gpm = gramsPerMeter(toNumber(input.diameter), toNumber(input.density));
  const spoolG = toNumber(input.spoolKg) * 1000;
  const waste = Math.min(toNumber(input.wastePct), 100) / 100;
  const onHand = toNumber(input.onHandG);
  const price = toNumber(input.price);

  // Work out grams and cost for each print.
  const jobs = (input.jobs || []).map((job, i) => {
    let grams = toNumber(job.amount);
    if (job.unit === "m") grams = grams * gpm;
    const withWaste = grams * (1 + waste);
    const cost = spoolG && price ? (withWaste / spoolG) * price : 0;
    const name = (job.name || "").trim() || `Print ${i + 1}`;
    return { name, grams, withWaste, cost };
  });

  // Add up all the prints.
  let baseG = 0;
  for (const job of jobs) baseG += job.grams;

  const totalG = baseG * (1 + waste);         // with the waste buffer
  const needG = Math.max(0, totalG - onHand); // minus what you already own

  // Round UP to whole spools. The tiny 1e-9 stops rounding errors
  // (like 1000.0000001 g) from adding an extra spool.
  let spools = 0;
  if (spoolG) spools = Math.max(0, Math.ceil(needG / spoolG - 1e-9));

  let leftoverG = Math.max(0, onHand - totalG);
  if (spools) leftoverG = spools * spoolG - needG;

  return {
    gramsPerMeter: gpm,
    spoolG, waste, onHand, price, jobs,
    baseG, totalG, needG, spools, leftoverG,
    costToBuy: spools * price,
    costUsed: spoolG ? (totalG / spoolG) * price : 0,
    ready: baseG > 0 && spoolG > 0,
  };
}

// Lets the tests use these functions.
if (typeof module !== "undefined") {
  module.exports = { calculate, gramsPerMeter, toNumber, SPOOL_SIZES };
}