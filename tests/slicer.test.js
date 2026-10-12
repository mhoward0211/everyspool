// Checks that each slicer's file format is read correctly. Run with: npm test
const test = require("node:test");
const assert = require("node:assert/strict");
const { parseGcode, parseSliceInfo } = require("../assets/slicer.js");
const MATERIALS = require("../assets/materials.js");

const close = (a, b) => assert.ok(Math.abs(a - b) < 0.01, `expected ${b}, got ${a}`);

test("PrusaSlicer: grams, material, and diameter", () => {
  const gcode = [
    "G1 X10 Y10",
    "; filament used [mm] = 4123.45",
    "; filament used [cm3] = 9.92",
    "; filament used [g] = 12.30",
    "; filament cost = 0.25",
    "; prusaslicer_config = begin",
    "; filament_diameter = 1.75",
    "; filament_type = PETG",
  ].join("\n");
  const r = parseGcode(gcode, MATERIALS);
  close(r.grams, 12.3);
  assert.equal(r.material, "PETG");
  assert.equal(r.diameter, "1.75");
});

test("PrusaSlicer multi-material: uses the total, not each extruder twice", () => {
  const gcode = "; filament used [g] = 10.00, 5.50\n; total filament used [g] = 15.50\n; filament_type = PLA;PLA";
  const r = parseGcode(gcode, MATERIALS);
  close(r.grams, 15.5);
  assert.equal(r.material, "PLA");
});

test("PrusaSlicer with no density set: falls back to length", () => {
  const r = parseGcode("; filament used [mm] = 2000\n; filament used [g] = 0.00", MATERIALS);
  assert.equal(r.grams, 0);
  close(r.meters, 2);
});

test("Bambu Studio / OrcaSlicer header", () => {
  const gcode = [
    "; HEADER_BLOCK_START",
    "; total filament length [mm] : 13591.23",
    "; total filament weight [g] : 40.54",
    "; HEADER_BLOCK_END",
    "; filament_type = PLA-CF",
  ].join("\n");
  const r = parseGcode(gcode, MATERIALS);
  close(r.grams, 40.54);
  assert.equal(r.material, "Carbon fiber PLA");
});

test("Cura: meters, possibly per extruder", () => {
  const r = parseGcode(";FLAVOR:Marlin\n;TIME:3600\n;Filament used: 1.2m, 0.5m\n;Layer height: 0.2", MATERIALS);
  assert.equal(r.grams, 0);
  close(r.meters, 1.7);
});

test("Simplify3D", () => {
  const gcode = ";   Filament length: 1234.5 mm (1.23 m)\n;   Plastic weight: 3.71 g (0.01 lb)";
  close(parseGcode(gcode, MATERIALS).grams, 3.71);
});

test("Mixed materials don't guess a material", () => {
  assert.equal(parseGcode("; filament used [g] = 5\n; filament_type = PLA;PETG", MATERIALS).material, null);
});

test("A file with no summary returns nothing", () => {
  assert.equal(parseGcode("G28\nG1 X0 Y0\nM104 S200", MATERIALS), null);
});

test("Bambu sliced 3MF: one entry per plate", () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <plate>
    <metadata key="index" value="1"/>
    <metadata key="weight" value="40.54"/>
    <filament id="1" type="PLA" color="#FFFFFF" used_m="13.59" used_g="40.54" />
  </plate>
  <plate>
    <metadata key="index" value="2"/>
    <filament id="1" type="PETG" used_m="3.00" used_g="9.00" />
    <filament id="2" type="PLA" used_m="1.00" used_g="3.00" />
  </plate>
</config>`;
  const plates = parseSliceInfo(xml, MATERIALS);
  assert.equal(plates.length, 2);
  close(plates[0].grams, 40.54);
  assert.equal(plates[0].material, "PLA");
  close(plates[1].grams, 12);
  assert.equal(plates[1].material, null);
});

test("3MF plate with only a total weight", () => {
  const plates = parseSliceInfo('<plate><metadata key="index" value="1"/><metadata key="weight" value="7.5"/></plate>', MATERIALS);
  close(plates[0].grams, 7.5);
});

test("Unsliced 3MF has no plates", () => {
  assert.equal(parseSliceInfo("<config><header/></config>", MATERIALS).length, 0);
});