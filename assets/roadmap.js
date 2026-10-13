// The EverySpool roadmap. Edit this list to update the roadmap page.
// status: "done", "now", "next", or "later". "when" is optional (e.g. "Oct 2026").
const ROADMAP = [
  { status: "done", when: "Oct 2026", title: "Spool calculator",
    text: "Add your prints in grams or meters and see how many spools to buy, what's left over, and what it costs." },
  { status: "done", when: "Oct 2026", title: "Share links",
    text: "Copy a link that opens the calculator with your exact prints and settings." },
  { status: "done", when: "Oct 2026", title: "Add prints from sliced files",
    text: "Drop in a G-code or 3MF file from PrusaSlicer, Bambu Studio, OrcaSlicer, Cura, or Simplify3D and the amounts fill in for you." },
  { status: "done", when: "Oct 2026", title: "Dark mode",
    text: "Follows your device's light or dark setting." },

  { status: "next", title: "Quick-answer pages",
    text: "Pages for common questions, like how many meters are on a 1 kg spool of PETG, each with the calculator ready to go." },
  { status: "next", title: "Weigh your spool",
    text: "Put a partly used spool on a kitchen scale and find out if what's left is enough for your next print." },
  { status: "next", title: "Shopping list by color",
    text: "For multi-color prints, see exactly which colors to buy and how many spools of each." },
  { status: "next", title: "Model links",
    text: "Attach the Printables or MakerWorld page to each print, so a share link carries the whole project." },
  { status: "next", title: "STL estimates",
    text: "A quick filament estimate from an unsliced STL, with infill and wall settings you can adjust." },

  { status: "later", title: "Selling price calculator",
    text: "Sell your prints? Add filament, power, time, and your markup to see what to charge." },
  { status: "later", title: "Use it offline",
    text: "Install EverySpool on your phone or computer and use it next to your printer, even without internet." },
  { status: "later", title: "Brand-specific materials",
    text: "Pick the exact filament you use, like Polymaker PLA or Bambu PETG, instead of typical averages." },
  { status: "later", title: "Mixed materials",
    text: "Plan a project that uses more than one material and see spools for each." },
  { status: "later", title: "Electricity and print-time cost",
    text: "Add your printer's power use and electricity rate to see the full cost of a print." },
  { status: "later", title: "Live filament prices",
    text: "Compare current prices across brands and stores to find the cheapest way to buy what you need." },
  { status: "later", title: "Spool inventory",
    text: "Keep track of the spools you own and how much is left on each." },
];

if (typeof module !== "undefined") module.exports = ROADMAP;