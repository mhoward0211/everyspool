// ===== Add prints from sliced files =====
// Files are read right here in the browser. Nothing is uploaded anywhere.

const EDGE_BYTES = 1024 * 1024;  // slicers put their summary in the first or last 1 MB

// Reads part of a file as text.
async function readText(blob) {
  return new TextDecoder().decode(await blob.arrayBuffer());
}

// G-code files can be huge, so only read the start and the end.
async function readGcodeFile(file) {
  let text;
  if (file.size <= EDGE_BYTES * 2) {
    text = await readText(file);
  } else {
    const start = await readText(file.slice(0, EDGE_BYTES));
    const end = await readText(file.slice(file.size - EDGE_BYTES));
    text = start + "\n" + end;
  }
  const found = parseGcode(text, MATERIALS);
  return found ? [{ name: printName(file.name), ...found }] : [];
}

// A 3MF file is a zip. This finds one file inside it and returns its text.
// It uses the browser's built-in unzipping, so no extra library is needed.
async function readFromZip(file, isWanted) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const data = new DataView(bytes.buffer);
  const big = (at) => Number(data.getBigUint64(at, true));

  // 1. The zip's table of contents is described by a small record at the very end.
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (data.getUint32(i, true) === 0x06054b50) { end = i; break; }
  }
  if (end < 0) return null;
  let count = data.getUint16(end + 10, true);
  let at = data.getUint32(end + 16, true);

  // Large ("ZIP64") archives keep the real numbers in another record just before it.
  if (count === 0xffff || at === 0xffffffff) {
    const zip64End = big(end - 20 + 8);
    count = big(zip64End + 32);
    at = big(zip64End + 48);
  }

  // 2. Walk the table of contents looking for the file we want.
  for (let n = 0; n < count; n++) {
    const nameLength = data.getUint16(at + 28, true);
    const extraLength = data.getUint16(at + 30, true);
    const commentLength = data.getUint16(at + 32, true);
    const name = new TextDecoder().decode(bytes.subarray(at + 46, at + 46 + nameLength));

    if (isWanted(name)) {
      const method = data.getUint16(at + 10, true);
      let size = data.getUint32(at + 20, true);
      let local = data.getUint32(at + 42, true);

      // ZIP64 again: real sizes live in an "extra" field after the name.
      let e = at + 46 + nameLength;
      while (e < at + 46 + nameLength + extraLength) {
        const id = data.getUint16(e, true);
        const length = data.getUint16(e + 2, true);
        if (id === 0x0001) {
          let q = e + 4;
          if (data.getUint32(at + 24, true) === 0xffffffff) q += 8;
          if (size === 0xffffffff) { size = big(q); q += 8; }
          if (local === 0xffffffff) local = big(q);
        }
        e += 4 + length;
      }

      // 3. Jump to the file's data and unzip it.
      const start = local + 30 + data.getUint16(local + 26, true) + data.getUint16(local + 28, true);
      const packed = bytes.subarray(start, start + size);
      if (method === 0) return new TextDecoder().decode(packed);
      const stream = new Blob([packed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      return await new Response(stream).text();
    }
    at += 46 + nameLength + extraLength + commentLength;
  }
  return null;
}

// Sliced 3MF files from Bambu Studio and OrcaSlicer list each plate's filament.
async function read3mfFile(file) {
  const xml = await readFromZip(file, (name) => name.endsWith("slice_info.config"));
  if (!xml) return [];
  const plates = parseSliceInfo(xml, MATERIALS);
  const base = printName(file.name);
  return plates.map((plate) => ({
    ...plate,
    name: plates.length > 1 ? `${base} (plate ${plate.plate})` : base,
  }));
}

// "Benchy_0.2mm_PLA.gcode.3mf" → "Benchy_0.2mm_PLA"
function printName(fileName) {
  return fileName.replace(/(\.gcode)?\.(3mf|gcode|gco|g|bgcode)$/i, "");
}

// Adds one print found in a file. Fills the first row if it's still empty.
function addPrintFromFile(found) {
  const job = found.grams
    ? { name: found.name, amount: String(Math.round(found.grams * 10) / 10), unit: "g" }
    : { name: found.name, amount: String(Math.round(found.meters * 100) / 100), unit: "m" };

  const only = state.jobs[0];
  if (state.jobs.length === 1 && !only.name && !only.amount) state.jobs[0] = job;
  else state.jobs.push(job);

  if (found.material) { state.material = found.material; $("material").value = found.material; }
  if (found.diameter) { state.diameter = found.diameter; $("diameter").value = found.diameter; }
}

// Reads every file the person picked or dropped, then shows what happened.
async function addFromFiles(files) {
  const notes = [];
  for (const file of files) {
    let found = [];
    try {
      found = /\.3mf$/i.test(file.name) ? await read3mfFile(file) : await readGcodeFile(file);
    } catch (e) {
      found = [];
    }

    if (found.length) {
      found.forEach(addPrintFromFile);
      notes.push(`Added ${file.name}.`);
    } else if (/\.3mf$/i.test(file.name)) {
      notes.push(`${file.name} has no filament totals. Slice it first, then use File → Export → Export plate sliced file, or add the G-code instead.`);
    } else {
      notes.push(`Couldn't find a filament amount in ${file.name}. Try the G-code file your slicer exported.`);
    }
  }
  renderJobs();
  update();
  $("uploadStatus").textContent = notes.join(" ");
}

function setUpUpload() {
  const zone = $("dropzone");
  const input = $("fileInput");

  $("chooseFile").addEventListener("click", () => input.click());
  input.addEventListener("change", () => {
    addFromFiles([...input.files]);
    input.value = "";  // so picking the same file again still works
  });

  // Dragging a file over the box highlights it; dropping it adds the prints.
  zone.addEventListener("dragover", (event) => {
    event.preventDefault();
    zone.classList.add("over");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("over"));
  zone.addEventListener("drop", (event) => {
    event.preventDefault();
    zone.classList.remove("over");
    addFromFiles([...event.dataTransfer.files]);
  });

  // A file dropped anywhere else shouldn't make the browser open it and leave the page.
  window.addEventListener("dragover", (event) => event.preventDefault());
  window.addEventListener("drop", (event) => event.preventDefault());
}

setUpUpload();