// ===== Settings: change these to your own links =====
// Leave a link as "" to hide its button.
const SITE = {
  repo: "mhoward0211/everyspool",           // your GitHub username/repo
  tipUrl: "https://ko-fi.com/YOURNAME",  // your Ko-fi page
  shopUrl: "",                           // Amazon link, added after approval
};

// What the calculator shows on someone's first visit.
const DEFAULTS = {
  jobs: [{ name: "", amount: "", unit: "g" }],
  material: "PLA",
  diameter: "1.75",
  color: "#2F6FE4",
  spool: "1",
  customKg: "",
  price: "20",
  currency: "USD",
  waste: "5",
  onHand: "",
};

// ===== Helpers =====

// Shortcut: $("price") finds the element with id="price".
function $(id) {
  return document.getElementById(id);
}

// Makes text safe to put inside HTML, so a print named "<b>" can't break the page.
function esc(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

// 1500 → "1.5 kg", 640 → "640 g"
function formatGrams(g) {
  if (g >= 1000) return (g / 1000).toFixed(2).replace(/\.?0+$/, "") + " kg";
  return Math.round(g) + " g";
}

// 0.25 → "250 g", 2 → "2 kg"
function spoolLabel(kg) {
  if (kg < 1) return Math.round(kg * 1000) + " g";
  return kg + " kg";
}

// 24.5 → "$24.50" (or €, £, etc.)
function money(amount) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: state.currency }).format(amount);
}

// ===== Remembering settings =====

// Picks starting values: a share link first, then the last visit, then the defaults.
function load() {
  try {
    const shared = new URLSearchParams(location.search).get("s");
    if (shared) return { ...structuredClone(DEFAULTS), ...JSON.parse(shared) };
  } catch (e) {}
  try {
    const saved = localStorage.getItem("everyspool");
    if (saved) return { ...structuredClone(DEFAULTS), ...JSON.parse(saved) };
  } catch (e) {}
  return structuredClone(DEFAULTS);
}

// Saves the current settings in this browser for next time.
function save() {
  try {
    localStorage.setItem("everyspool", JSON.stringify(state));
  } catch (e) {}
}

let state = load();

// ===== Dropdowns and inputs =====

function setUpControls() {
  // Fill the Material and Spool size dropdowns from our lists.
  if (!MATERIALS[state.material]) state.material = "PLA";
  $("material").innerHTML = Object.keys(MATERIALS)
    .map((name) => `<option>${esc(name)}</option>`)
    .join("");
  $("spool").innerHTML = SPOOL_SIZES
    .map((kg) => `<option value="${kg}">${spoolLabel(kg)}</option>`)
    .join("") + `<option value="custom">Custom</option>`;

  // For each input: show the saved value, and recalculate whenever it changes.
  const ids = ["material", "diameter", "color", "spool", "customKg", "price", "currency", "waste", "onHand"];
  for (const id of ids) {
    const input = $(id);
    input.value = state[id];
    input.addEventListener("input", () => {
      state[id] = input.value;
      update();
    });
  }
}

// ===== The list of prints =====

// Draws one row (name, amount, unit, remove button) per print.
function renderJobs() {
  $("jobs").innerHTML = state.jobs.map((job, i) => `
    <div class="job">
      <div>
        <label for="name${i}">Print name</label>
        <input type="text" id="name${i}" data-i="${i}" data-key="name" placeholder="Print ${i + 1}" value="${esc(job.name)}">
      </div>
      <div>
        <label for="amount${i}">Amount</label>
        <input type="number" id="amount${i}" data-i="${i}" data-key="amount" min="0" step="any" inputmode="decimal" placeholder="0" value="${esc(job.amount)}">
      </div>
      <div>
        <label for="unit${i}">Unit</label>
        <select id="unit${i}" data-i="${i}" data-key="unit">
          <option value="g" ${job.unit === "g" ? "selected" : ""}>g</option>
          <option value="m" ${job.unit === "m" ? "selected" : ""}>m</option>
        </select>
      </div>
      <button type="button" class="remove" data-remove="${i}" aria-label="Remove print ${i + 1}" ${state.jobs.length === 1 ? "disabled" : ""}>×</button>
    </div>`).join("");
}

function setUpJobs() {
  // Typing in any print row updates that print.
  $("jobs").addEventListener("input", (event) => {
    const { i, key } = event.target.dataset;
    if (i === undefined) return;
    state.jobs[i][key] = event.target.value;
    update();
  });

  // Clicking × removes that print.
  $("jobs").addEventListener("click", (event) => {
    const i = event.target.dataset.remove;
    if (i === undefined) return;
    state.jobs.splice(i, 1);
    renderJobs();
    update();
  });

  // "Add another print" adds an empty row and puts the cursor in it.
  $("addJob").addEventListener("click", () => {
    state.jobs.push({ name: "", amount: "", unit: "g" });
    renderJobs();
    update();
    $("name" + (state.jobs.length - 1)).focus();
  });
}

// ===== Results =====

// Draws one spool. "fraction" is how full the colored ring is (0 to 1).
function spoolPicture(fraction, label) {
  const percent = Math.max(0, Math.min(1, fraction)) * 100;
  return `
    <div class="spool">
      <svg viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="30" fill="var(--bg)" stroke="var(--line)" stroke-width="1.5"/>
        <circle cx="32" cy="32" r="20" fill="none" stroke="var(--fil)" stroke-opacity=".18" stroke-width="14"/>
        <circle class="arc" cx="32" cy="32" r="20" fill="none" stroke="var(--fil)" stroke-width="14"
          pathLength="100" stroke-dasharray="${percent} 100" transform="rotate(-90 32 32)"/>
        <circle cx="32" cy="32" r="8" fill="var(--surface)" stroke="var(--line)" stroke-width="1.5"/>
      </svg>
      ${label}
    </div>`;
}

// Runs the math and redraws the results. Called after every change.
function update() {
  document.documentElement.style.setProperty("--fil", state.color);
  $("customWrap").hidden = state.spool !== "custom";

  let spoolKg = parseFloat(state.spool);
  if (state.spool === "custom") spoolKg = toNumber(state.customKg);

  const r = calculate({
    jobs: state.jobs,
    density: MATERIALS[state.material],
    diameter: state.diameter,
    spoolKg: spoolKg,
    wastePct: state.waste,
    onHandG: state.onHand,
    price: state.price,
  });

  $("gpm").textContent = `${state.material} at ${state.diameter} mm weighs about ${r.gramsPerMeter.toFixed(2)} g per meter.`;

  // Nothing entered yet
  if (!r.ready) {
    $("answer").textContent = "Add a print to get started";
    $("sub").textContent = "Enter how much filament each print uses.";
    $("spools").innerHTML = spoolPicture(0, "empty");
    $("stats").innerHTML = "";
    $("breakdown").innerHTML = "";
    save();
    return;
  }

  // The big answer
  if (r.spools === 0) {
    $("answer").textContent = "You have enough on hand";
    $("sub").textContent = `${formatGrams(r.leftoverG)} will be left after printing.`;
  } else {
    $("answer").textContent = `You need ${r.spools} spool${r.spools > 1 ? "s" : ""}`;
    $("sub").textContent = `${spoolLabel(spoolKg)} ${state.material}, with ${formatGrams(r.leftoverG)} left over.`;
  }

  // One spool picture per spool (up to 20)
  let pictures = "";
  const shown = Math.min(r.spools, 20);
  for (let i = 0; i < shown; i++) {
    const used = Math.min(r.spoolG, r.needG - i * r.spoolG);
    const isPartial = i === r.spools - 1 && used < r.spoolG;
    const label = isPartial ? `${Math.round((used / r.spoolG) * 100)}% used` : "full";
    pictures += spoolPicture(used / r.spoolG, label);
  }
  if (r.spools > shown) pictures += `<span class="more">+${r.spools - shown} more</span>`;
  $("spools").innerHTML = pictures;

  // The numbers
  let stats = `<dt>Filament for prints</dt><dd>${formatGrams(r.baseG)}</dd>`;
  if (r.waste) stats += `<dt>With ${Math.round(r.waste * 100)}% buffer</dt><dd>${formatGrams(r.totalG)}</dd>`;
  if (r.onHand) stats += `<dt>Already on hand</dt><dd>−${formatGrams(Math.min(r.onHand, r.totalG))}</dd>`;
  stats += `<dt>Left over after printing</dt><dd>${formatGrams(r.leftoverG)}</dd>`;
  if (r.price) {
    stats += `<dt>Cost to buy</dt><dd>${money(r.costToBuy)}</dd>`;
    stats += `<dt>Cost of filament used</dt><dd>${money(r.costUsed)}</dd>`;
  }
  $("stats").innerHTML = stats;

  // A per-print table, only when there's more than one print
  const filled = r.jobs.filter((job) => job.grams > 0);
  if (filled.length > 1) {
    const rows = filled.map((job) => `
      <tr>
        <td>${esc(job.name)}</td>
        <td>${formatGrams(job.withWaste)}</td>
        ${r.price ? `<td>${money(job.cost)}</td>` : ""}
      </tr>`).join("");
    $("breakdown").innerHTML = `
      <table>
        <thead><tr><th>Print</th><th>Filament</th>${r.price ? "<th>Cost</th>" : ""}</tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  } else {
    $("breakdown").innerHTML = "";
  }

  // Point the shop button at the right filament
  if (SITE.shopUrl) {
    const search = `${state.material} filament ${state.diameter}mm ${spoolLabel(spoolKg || 1)}`;
    $("shop").href = SITE.shopUrl.replace("{q}", encodeURIComponent(search));
  }

  save();
}

// ===== Buttons and links =====

function setUpButtons() {
  // Copies a link that opens the calculator with these exact entries.
  $("share").addEventListener("click", async () => {
    const link = `${location.origin}${location.pathname}?s=${encodeURIComponent(JSON.stringify(state))}`;
    try {
      await navigator.clipboard.writeText(link);
      $("share").textContent = "Link copied";
    } catch (e) {
      prompt("Copy this link:", link);
    }
    setTimeout(() => { $("share").textContent = "Copy share link"; }, 2000);
  });

  // Hide buttons whose links aren't set yet.
  if (SITE.shopUrl) {
    $("shop").hidden = false;
  } else {
    $("shop").hidden = true;
    $("disclose").hidden = true;
  }
  if (SITE.tipUrl) $("tip").href = SITE.tipUrl;
  else $("tip").hidden = true;

  $("source").href = `https://github.com/${SITE.repo}`;
  $("suggest").href = `https://github.com/${SITE.repo}/issues/new/choose`;
}

// ===== Start everything =====
setUpControls();
setUpJobs();
setUpButtons();
renderJobs();
update();