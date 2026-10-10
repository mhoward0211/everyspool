// Filament densities in grams per cubic centimeter (g/cm³).
// These are typical averages; brands vary by a few percent.
const MATERIALS = {
  "PLA": 1.24,
  "PLA+": 1.23,
  "Silk PLA": 1.25,
  "PETG": 1.27,
  "ABS": 1.04,
  "ASA": 1.07,
  "TPU": 1.21,
  "Nylon (PA)": 1.14,
  "PC": 1.20,
  "HIPS": 1.04,
  "PVA": 1.23,
  "Wood PLA": 1.28,
  "Carbon fiber PLA": 1.30,
  "Carbon fiber PETG": 1.30,
};

// Lets the tests (which run in Node, not a browser) use this list too.
if (typeof module !== "undefined") module.exports = MATERIALS;
