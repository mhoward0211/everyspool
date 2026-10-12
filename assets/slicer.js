// Reads how much filament a print uses from the summary slicers write into their files.
// Pure text-in, numbers-out, so the tests can check it without a browser.

// Adds up every number in text like "12.34, 0.50" or "1.2m, 0.5m".
function sumNumbers(text) {
  let total = 0;
  for (const n of String(text).match(/\d+(?:\.\d+)?/g) || []) total += parseFloat(n);
  return total;
}

// Finds the first pattern that matches and returns its total, or 0.
function firstTotal(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && sumNumbers(match[1]) > 0) return sumNumbers(match[1]);
  }
  return 0;
}

// Turns a slicer's material name (like "PETG" or "PLA-CF") into one from our list, if it's there.
function matchMaterial(name, materials) {
  const wanted = String(name).trim().toUpperCase();
  for (const material of Object.keys(materials)) {
    if (material.toUpperCase() === wanted) return material;
  }
  const aliases = {
    "PA": "Nylon (PA)",
    "NYLON": "Nylon (PA)",
    "PLA-CF": "Carbon fiber PLA",
    "PETG-CF": "Carbon fiber PETG",
  };
  return aliases[wanted] || null;
}

// Reads a G-code file's text. Works with PrusaSlicer, Bambu Studio, OrcaSlicer, Cura, and Simplify3D.
function parseGcode(text, materials) {
  // Grams, most trusted first. "total" lines already add up every extruder.
  const grams = firstTotal(text, [
    /^\s*;?\s*total filament (?:used|weight) \[g\]\s*[:=]\s*(.+)$/im,  // PrusaSlicer, Bambu, Orca
    /^\s*;?\s*filament used \[g\]\s*[:=]\s*(.+)$/im,                  // PrusaSlicer, Bambu, Orca
    /^\s*;\s*Plastic weight:\s*(\d+(?:\.\d+)?)\s*g/im,                 // Simplify3D
  ]);

  // Length, if there's no weight. Everything here is in millimeters except Cura's meters.
  let meters = 0;
  if (!grams) {
    const mm = firstTotal(text, [
      /^\s*;?\s*total filament length \[mm\]\s*[:=]\s*(.+)$/im,        // Bambu, Orca
      /^\s*;?\s*filament used \[mm\]\s*[:=]\s*(.+)$/im,                // PrusaSlicer, Bambu, Orca
      /^\s*;\s*Filament length:\s*(\d+(?:\.\d+)?)\s*mm/im,              // Simplify3D
    ]);
    meters = mm / 1000;
    if (!meters) meters = firstTotal(text, [/^\s*;\s*Filament used:\s*(.+)$/im]);  // Cura, already in meters
  }

  if (!grams && !meters) return null;

  // The material and diameter, when the slicer lists them.
  let material = null;
  const type = text.match(/^\s*;\s*filament_type\s*=\s*(.+)$/im);
  if (type) {
    const names = [...new Set(type[1].split(/[;,]/).map((t) => t.trim()).filter(Boolean))];
    if (names.length === 1) material = matchMaterial(names[0], materials);
  }

  let diameter = null;
  const dia = text.match(/^\s*;\s*filament_diameter\s*=\s*(\d+(?:\.\d+)?)/im);
  if (dia && ["1.75", "2.85"].includes(parseFloat(dia[1]).toFixed(2))) diameter = parseFloat(dia[1]).toFixed(2);

  return { grams, meters, material, diameter };
}

// Reads Bambu Studio / OrcaSlicer's summary inside a sliced 3MF (Metadata/slice_info.config).
// Returns one entry per plate.
function parseSliceInfo(xml, materials) {
  const attr = (tag, key) => {
    const match = tag.match(new RegExp(`\\b${key}="([^"]*)"`));
    return match ? match[1] : "";
  };

  const plates = [];
  for (const block of xml.match(/<plate>[\s\S]*?<\/plate>/g) || []) {
    let grams = 0;
    let meters = 0;
    const types = new Set();
    for (const tag of block.match(/<filament\b[^>]*>/g) || []) {
      grams += parseFloat(attr(tag, "used_g")) || 0;
      meters += parseFloat(attr(tag, "used_m")) || 0;
      if (attr(tag, "type")) types.add(attr(tag, "type"));
    }

    // Some versions only list the plate's total weight.
    if (!grams) {
      const weight = block.match(/<metadata key="weight" value="([^"]*)"/);
      if (weight) grams = parseFloat(weight[1]) || 0;
    }

    const index = block.match(/<metadata key="index" value="([^"]*)"/);
    const material = types.size === 1 ? matchMaterial([...types][0], materials) : null;
    if (grams || meters) {
      plates.push({ plate: index ? index[1] : String(plates.length + 1), grams, meters, material });
    }
  }
  return plates;
}

if (typeof module !== "undefined") {
  module.exports = { parseGcode, parseSliceInfo, matchMaterial, sumNumbers };
}