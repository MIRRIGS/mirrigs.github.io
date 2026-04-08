// =====================================================
//  MIR RIGS — GT7 Race Strategy Calculator  v8
//
//  RULES:
//  - Tank always 100L max. startingFuel ≤ 100.
//  - pitTime (input) = full stop including 3s tire change.
//  - Planned tire-change stop = pitTime + refuelTime.
//  - Unplanned fuel-only stop = (pitTime − 3) + refuelTime.
//  - TIME mode: race ends at END of lap where time ≥ limit.
//  - TIME mode: fuel at each stop sized to estimated
//    remaining laps only.
//  - Lap 1 counts toward tire wear like every other lap.
//  - MAX_STINTS computed dynamically per race.
//  - Fuel displayed in litres (tank = 100L always).
//  - Rules: mandatory tires + minimum compound count filter.
// =====================================================

// ── DOM ──────────────────────────────────────────────
const calcBtn           = document.getElementById("calcBtn");
const clearBtn          = document.getElementById("clearBtn");
const resultsBox        = document.getElementById("results");
const raceLengthInput   = document.getElementById("raceLength");
const raceButtons       = document.querySelectorAll(".race-btn");
const pitTimeInput      = document.getElementById("pitTime");
const fuelPerLapInput   = document.getElementById("fuelPerLap");
const refuelRateInput   = document.getElementById("refuelRate");
const startingFuelInput = document.getElementById("startingFuel");
const softLapI  = document.getElementById("softLap");
const softLifeI = document.getElementById("softLife");
const medLapI   = document.getElementById("medLap");
const medLifeI  = document.getElementById("medLife");
const hardLapI  = document.getElementById("hardLap");
const hardLifeI = document.getElementById("hardLife");

// ── Race mode ─────────────────────────────────────────
let raceMode = "laps";

raceButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    raceButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    raceMode = btn.dataset.mode;
    raceLengthInput.placeholder = raceMode === "laps" ? "Total laps" : "Race length in mins";
    clearErr(raceLengthInput);
  });
});

// ── Mandatory tire toggle buttons ────────────────────
const mandBtns = document.querySelectorAll(".mand-btn");
const mandActive = new Set(); // tracks which compounds are toggled on

function getMandatoryCount() { return mandActive.size; }

function onMandChange() {
  const count = getMandatoryCount();
  // Clamp minCompounds up to mandatory count, never below
  const newMin = Math.max(minCompounds, count);
  updateSlider(newMin);
  // Lock slider nodes that are below the mandatory floor
  updateSliderLocks();
}

mandBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const compound = btn.dataset.compound;
    if (mandActive.has(compound)) {
      mandActive.delete(compound);
      btn.classList.remove("active");
      btn.setAttribute("aria-pressed", "false");
    } else {
      mandActive.add(compound);
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
    }
    onMandChange();
  });
});

// ── Compounds Required slider ─────────────────────────
let minCompounds = 1;
const creqNodes = document.querySelectorAll(".creq-node");
const creqFill  = document.getElementById("creqFill");

function updateSlider(val) {
  val = Math.max(1, Math.min(3, val));
  minCompounds = val;
  creqNodes.forEach(n => {
    const nVal = Number(n.dataset.val);
    n.classList.toggle("active", nVal === val);
    n.setAttribute("aria-pressed", nVal === val ? "true" : "false");
  });
  // Track fill: spans from left node centre to active node centre
  // Nodes live at positions 0%, 50%, 100% of the inner track space
  const pct = (val - 1) / 2; // 0, 0.5, 1
  creqFill.style.width = `calc(${pct * 100}% * (1 - 28px / 100%))`;
  // Simpler: use fixed pixel-aware calc
  if (val === 1) creqFill.style.width = '0px';
  if (val === 2) creqFill.style.width = 'calc(50% - 32px)';
  if (val === 3) creqFill.style.width = 'calc(100% - 64px)';
  updateSliderLocks();
}

function updateSliderLocks() {
  const floor = getMandatoryCount(); // minimum selectable value
  creqNodes.forEach(n => {
    const nVal = Number(n.dataset.val);
    const isLocked = nVal < floor; // can't go below mandatory count
    const isActive = nVal === minCompounds;
    n.classList.toggle("locked", isLocked && !isActive);
    n.disabled = isLocked && !isActive;
  });
}

creqNodes.forEach(node => {
  node.addEventListener("click", () => {
    const val = Number(node.dataset.val);
    if (val < getMandatoryCount()) return; // locked
    updateSlider(val);
  });
});

// Drag support
(function () {
  const slider = document.getElementById("creqSlider");
  let dragging = false;

  function valFromX(clientX) {
    const rect = slider.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(pct * 2) + 1;
  }

  slider.addEventListener("mousedown",  e => { dragging = true; const v = valFromX(e.clientX); if (v >= getMandatoryCount()) updateSlider(v); });
  slider.addEventListener("touchstart", e => { dragging = true; const v = valFromX(e.touches[0].clientX); if (v >= getMandatoryCount()) updateSlider(v); }, { passive: true });
  document.addEventListener("mousemove",  e => { if (!dragging) return; const v = valFromX(e.clientX); if (v >= getMandatoryCount()) updateSlider(v); });
  document.addEventListener("touchmove",  e => { if (!dragging) return; const v = valFromX(e.touches[0].clientX); if (v >= getMandatoryCount()) updateSlider(v); }, { passive: true });
  document.addEventListener("mouseup",  () => { dragging = false; });
  document.addEventListener("touchend", () => { dragging = false; });
})();

updateSlider(1);

// ── Validation ────────────────────────────────────────
function setErr(input, msg) {
  const field = input.closest(".field");
  if (!field) return;
  field.classList.add("has-error");
  const span = field.querySelector(".error-msg");
  if (span) span.textContent = "— " + msg;
}

function clearErr(input) {
  const field = input.closest(".field");
  if (!field) return;
  field.classList.remove("has-error");
  const span = field.querySelector(".error-msg");
  if (span) span.textContent = "";
}

function validate(input) {
  if (input.value === "") { clearErr(input); return; }
  const v = Number(input.value);

  if (input === raceLengthInput) {
    if (raceMode === "laps")
      (!Number.isInteger(v) || v < 1 || v > 300) ? setErr(input, "1–300 whole laps") : clearErr(input);
    else
      (v < 1 || v > 1440) ? setErr(input, "1–1440 mins") : clearErr(input);
  } else if (input === pitTimeInput) {
    v < 3 ? setErr(input, "min 3s (includes tire change)") : clearErr(input);
  } else if (input === fuelPerLapInput) {
    (v <= 0 || v > 100) ? setErr(input, "0.1–100 L") : clearErr(input);
  } else if (input === startingFuelInput) {
    (v <= 0 || v > 100) ? setErr(input, "1–100 L") : clearErr(input);
  } else if (input === refuelRateInput) {
    (v <= 0 || v > 100) ? setErr(input, "0.1–100 L/s") : clearErr(input);
  } else if ([softLapI, medLapI, hardLapI].includes(input)) {
    v < 1 ? setErr(input, "≥ 1 sec") : clearErr(input);
  } else if ([softLifeI, medLifeI, hardLifeI].includes(input)) {
    v < 1 ? setErr(input, "≥ 1 lap") : clearErr(input);
  }
}

document.querySelectorAll(".strategy-panel input[type='number']").forEach(inp => {
  inp.addEventListener("input", () => validate(inp));
  inp.addEventListener("blur",  () => validate(inp));
});

// ── Collect inputs ────────────────────────────────────
function getInputs() {
  return {
    raceMode,
    raceLaps:      raceMode === "laps" ? Number(raceLengthInput.value) : null,
    raceLimitSecs: raceMode === "time" ? Number(raceLengthInput.value) * 60 : null,
    pitTime:       Number(pitTimeInput.value)      || 0,
    fuelPerLap:    Number(fuelPerLapInput.value)   || 0,
    startingFuel:  Number(startingFuelInput.value) || 100,
    refuelRate:    Number(refuelRateInput.value)   || 0,
    tires: [
      { name: "Soft",   color: "#ff3333", lap: Number(softLapI.value),  life: Number(softLifeI.value)  },
      { name: "Medium", color: "#f5c400", lap: Number(medLapI.value),   life: Number(medLifeI.value)   },
      { name: "Hard",   color: "#ffffff", lap: Number(hardLapI.value),  life: Number(hardLifeI.value)  }
    ].filter(t => t.lap > 0 && t.life > 0),
    mandatoryTires: [...mandActive],
    minCompounds
  };
}

// ═══════════════════════════════════════════════════
//  ALLOCATORS
// ═══════════════════════════════════════════════════

function allocateGreedy(tireSeq, totalLaps) {
  const n = tireSeq.length;
  if (totalLaps < n) return null;
  const laps = new Array(n).fill(1);
  let rem = totalLaps - n;
  const order = [...Array(n).keys()].sort((a, b) => tireSeq[a].lap - tireSeq[b].lap);
  for (const i of order) {
    const add = Math.min(rem, tireSeq[i].life - 1);
    laps[i] += add;
    rem -= add;
    if (rem <= 0) break;
  }
  if (rem > 0) return null;
  return laps;
}

function allocateLastFull(tireSeq, totalLaps) {
  const n = tireSeq.length;
  if (totalLaps < n) return null;
  const laps = new Array(n).fill(1);
  const lastMax  = Math.min(tireSeq[n - 1].life, totalLaps - (n - 1));
  laps[n - 1]    = lastMax;
  let rem        = totalLaps - lastMax;
  if (rem < n - 1) return null;
  const order = [...Array(n - 1).keys()].sort((a, b) => tireSeq[a].lap - tireSeq[b].lap);
  for (const i of order) {
    const add = Math.min(rem - (n - 2 - i), tireSeq[i].life - 1);
    if (add < 0) return null;
    laps[i] += add;
    rem     -= add;
    if (rem <= n - 2 - i) break;
  }
  for (let i = 0; i < n; i++) {
    if (laps[i] < 1 || laps[i] > tireSeq[i].life) return null;
  }
  if (laps.reduce((a, b) => a + b, 0) !== totalLaps) return null;
  return laps;
}

function allocateFuelAligned(tireSeq, totalLaps, inp) {
  if (inp.raceMode !== 'laps') return null;
  const n = tireSeq.length;
  if (totalLaps < n) return null;
  if (!inp.fuelPerLap || inp.fuelPerLap <= 0) return null;
  const tankLaps = Math.floor(inp.startingFuel / inp.fuelPerLap);
  if (tankLaps < 1) return null;
  const laps = new Array(n).fill(0);
  let rem = totalLaps;
  for (let i = 0; i < n - 1; i++) {
    const cap = Math.min(tireSeq[i].life, tankLaps, rem - (n - 1 - i));
    laps[i] = Math.max(1, cap);
    rem -= laps[i];
  }
  laps[n - 1] = rem;
  if (laps[n - 1] < 1 || laps[n - 1] > tireSeq[n - 1].life) return null;
  return laps;
}

// ═══════════════════════════════════════════════════
//  SIMULATION
// ═══════════════════════════════════════════════════

function simulate(plan, inp) {
  let time     = 0;
  let fuel     = inp.startingFuel;
  let tirePits = 0;
  let fuelPits = 0;
  let lapsDone = 0;
  const events = [];

  for (let si = 0; si < plan.length; si++) {
    const { tire, laps: stintLen } = plan[si];
    let segLaps = 0;

    for (let lap = 0; lap < stintLen; lap++) {

      if (inp.fuelPerLap > 0 && fuel < inp.fuelPerLap) {
        if (segLaps > 0) {
          events.push({ kind: 'stint', tire, laps: segLaps });
          segLaps = 0;
        }
        fuelPits++;
        const lapsLeft   = stintLen - lap;
        const need       = lapsLeft * inp.fuelPerLap;
        const fuelAdded  = Math.min(100 - fuel, need);
        const refuelTime = inp.refuelRate > 0 ? fuelAdded / inp.refuelRate : 0;
        const stopBase   = Math.max(0, inp.pitTime - 3);
        const stopTime   = stopBase + refuelTime;
        events.push({ kind: 'fuelstop', fuelAdded, stopTime });
        time += stopTime;
        fuel += fuelAdded;
      }

      time += tire.lap;
      fuel  = Math.max(0, fuel - inp.fuelPerLap);
      lapsDone++;
      segLaps++;

      if (inp.raceMode === 'time' && time >= inp.raceLimitSecs) {
        events.push({ kind: 'stint', tire, laps: segLaps });
        return { events, time, tirePits, fuelPits, lapsDone };
      }
      if (inp.raceMode === 'laps' && lapsDone >= inp.raceLaps) {
        events.push({ kind: 'stint', tire, laps: segLaps });
        return { events, time, tirePits, fuelPits, lapsDone };
      }
    }

    if (segLaps > 0) events.push({ kind: 'stint', tire, laps: segLaps });

    if (si < plan.length - 1) {
      tirePits++;
      const next      = plan[si + 1];
      let   stopTime  = inp.pitTime;
      let   fuelAdded = 0;

      if (inp.fuelPerLap > 0) {
        let lapsToFuelFor = next.laps;
        if (inp.raceMode === 'time') {
          const timeAfterStop   = time + inp.pitTime;
          const drivingTimeLeft = Math.max(0, inp.raceLimitSecs - timeAfterStop);
          const estLaps         = Math.max(1, Math.ceil(drivingTimeLeft / next.tire.lap));
          lapsToFuelFor         = Math.min(next.laps, estLaps);
        }
        const fuelNeeded = lapsToFuelFor * inp.fuelPerLap;
        fuelAdded = Math.max(0, Math.min(100 - fuel, fuelNeeded - fuel));
        if (fuelAdded > 0 && inp.refuelRate > 0) stopTime += fuelAdded / inp.refuelRate;
        fuel += fuelAdded;
      }

      events.push({ kind: 'tirechange', fuelAdded, stopTime });
      time += stopTime;
    }
  }

  return { events, time, tirePits, fuelPits, lapsDone };
}

// ═══════════════════════════════════════════════════
//  ORCHESTRATOR
// ═══════════════════════════════════════════════════

function getMaxStints(inp) {
  if (!inp.tires.length) return 4;
  const maxLife    = Math.max(...inp.tires.map(t => t.life));
  const targetLaps = inp.raceMode === "laps"
    ? inp.raceLaps
    : Math.ceil((inp.raceLimitSecs / Math.min(...inp.tires.map(t => t.lap))) * 1.1);
  return Math.min(7, Math.max(4, Math.ceil(targetLaps / maxLife) + 1));
}

function isValidSequence(seq) {
  const usedNames = new Set();
  let lastName = null;
  for (const t of seq) {
    if (t.name !== lastName) {
      if (usedNames.has(t.name)) return false;
      usedNames.add(t.name);
      lastName = t.name;
    }
  }
  return true;
}

function genSequences(tires, maxStints) {
  const out = [];
  function dfs(seq) {
    if (seq.length > 0 && isValidSequence(seq)) out.push([...seq]);
    if (seq.length >= maxStints) return;
    for (const t of tires) {
      const next = [...seq, t];
      if (isValidSequence(next)) dfs(next);
    }
  }
  dfs([]);
  return out;
}

// ── Rules filter ──────────────────────────────────────
// Check planned sequence (fast pre-filter before simulation)
function passesRules(tireSeq, inp) {
  const names = new Set(tireSeq.map(t => t.name));
  for (const mand of inp.mandatoryTires) {
    if (!names.has(mand)) return false;
  }
  if (names.size < inp.minCompounds) return false;
  return true;
}

// Check actual simulation result — critical for TIME mode where race
// can end before all planned stints are reached.
function resultPassesRules(result, inp) {
  if (!inp.mandatoryTires.length && inp.minCompounds <= 1) return true;
  const actualNames = new Set(
    result.events.filter(e => e.kind === 'stint').map(e => e.tire.name)
  );
  for (const mand of inp.mandatoryTires) {
    if (!actualNames.has(mand)) return false;
  }
  if (actualNames.size < inp.minCompounds) return false;
  return true;
}

function rebalanceResult(originalResult, inp) {
  const stintEvents = originalResult.events.filter(e => e.kind === 'stint');
  if (stintEvents.length < 2) return originalResult;
  const newStints = stintEvents.map(e => ({ tire: e.tire, laps: e.laps }));
  let changed = false;
  let i = 0;
  while (i < newStints.length) {
    let j = i;
    while (j < newStints.length && newStints[j].tire.name === newStints[i].tire.name) j++;
    const runLen = j - i;
    if (runLen > 1) {
      const totalLaps = newStints.slice(i, j).reduce((s, x) => s + x.laps, 0);
      const life      = newStints[i].tire.life;
      const base      = Math.floor(totalLaps / runLen);
      const rem       = totalLaps % runLen;
      const newLaps   = Array.from({length: runLen}, (_, k) => Math.min(life, k < rem ? base + 1 : base));
      const same      = newLaps.every((l, k) => l === newStints[i + k].laps);
      if (!same) {
        for (let k = i; k < j; k++) newStints[k].laps = newLaps[k - i];
        changed = true;
      }
    }
    i = j;
  }
  if (!changed) return originalResult;
  const rebalResult = simulate(newStints, inp);
  if (!rebalResult || rebalResult.lapsDone < 1) return originalResult;
  return isBetter(rebalResult, originalResult, inp) || rebalResult.lapsDone === originalResult.lapsDone
    ? rebalResult
    : originalResult;
}

function calculateStrategies(inp) {
  const maxStints = getMaxStints(inp);
  const seqs      = genSequences(inp.tires, maxStints);
  const byKey     = new Map();

  for (const tireSeq of seqs) {

    // ── Apply rules filter ──
    if (!passesRules(tireSeq, inp)) continue;

    const maxCapacity = tireSeq.reduce((s, t) => s + t.life, 0);
    let targetLaps;
    if (inp.raceMode === 'laps') {
      targetLaps = inp.raceLaps;
    } else {
      const n         = tireSeq.length;
      const pitBudget = (n - 1) * inp.pitTime;
      const minLap    = Math.min(...tireSeq.map(t => t.lap));
      targetLaps      = Math.min(maxCapacity, Math.ceil((inp.raceLimitSecs - pitBudget) / minLap) + n + 2);
    }

    const allocs = [
      allocateGreedy(tireSeq, targetLaps),
      allocateLastFull(tireSeq, targetLaps),
      allocateFuelAligned(tireSeq, targetLaps, inp),
    ].filter(Boolean);

    const seen = new Set();
    for (const alloc of allocs) {
      const sig = alloc.join(",");
      if (seen.has(sig)) continue;
      seen.add(sig);
      const plan   = tireSeq.map((t, i) => ({ tire: t, laps: alloc[i] }));
      const result = simulate(plan, inp);
      if (!result || result.lapsDone < 1) continue;
      // In TIME mode the race may end before all planned stints are reached,
      // so re-check rules against actual compounds used, not just the plan.
      if (inp.raceMode === 'time' && !resultPassesRules(result, inp)) continue;
      const key      = tireSeq.map(t => t.name).join("→");
      const existing = byKey.get(key);
      if (!existing || isBetter(result, existing, inp)) {
        byKey.set(key, result);
      }
    }
  }

  for (const [key, result] of byKey) {
    const rebalanced = rebalanceResult(result, inp);
    // Rebalance re-simulates; in TIME mode verify rules still hold on actual result
    if (inp.raceMode === 'time' && !resultPassesRules(rebalanced, inp)) {
      byKey.delete(key);
    } else {
      byKey.set(key, rebalanced);
    }
  }

  for (const [key, result] of byKey) {
    const stints = result.events.filter(e => e.kind === 'stint');
    if (stints.length < 2) continue;
    const allSame = stints.every(s => s.tire.name === stints[0].tire.name);
    if (!allSame) continue;
    const life = stints[0].tire.life;
    const totalLaps = stints.reduce((s, e) => s + e.laps, 0);
    if (totalLaps > life) continue;
    byKey.delete(key);
  }

  return [...byKey.values()]
    .sort((a, b) => {
      if (inp.raceMode === 'time' && a.lapsDone !== b.lapsDone) return b.lapsDone - a.lapsDone;
      if (a.time !== b.time) return a.time - b.time;
      const lastA = a.events.filter(e => e.kind === 'stint').at(-1);
      const lastB = b.events.filter(e => e.kind === 'stint').at(-1);
      return (lastA?.tire.lap ?? 0) - (lastB?.tire.lap ?? 0);
    })
    .slice(0, 3);
}

function isBetter(a, b, inp) {
  if (inp.raceMode === 'time' && a.lapsDone !== b.lapsDone) return a.lapsDone > b.lapsDone;
  return a.time < b.time;
}

// ── Format helpers ────────────────────────────────────
function fmtTime(s) {
  const m  = Math.floor(s / 60);
  const ss = (s % 60).toFixed(1).padStart(4, "0");
  return m > 0 ? `${m}m ${ss}s` : `${ss}s`;
}

// ── Render events ─────────────────────────────────────
function renderEvents(events) {
  const items = [];

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];

    if (ev.kind === 'fuelstop') {
      items.push({
        html: `<div class="pit-fuel-only">fuel only +${Math.round(ev.fuelAdded)}L</div>`
      });
    } else if (ev.kind === 'stint') {
      const prev = i > 0 ? events[i - 1] : null;
      const fuelTag = prev?.kind === 'tirechange' && prev.fuelAdded > 0
        ? `<span class="stint-fuel"> fuel +${Math.round(prev.fuelAdded)}L</span>`
        : '';
      const isHard   = ev.tire.color === '#ffffff';
      const dotStyle = `background:${ev.tire.color};${isHard ? 'border:1px solid rgba(255,255,255,0.4);' : ''}`;
      items.push({
        html: `<div class="stint-pill">
          <div class="stint-dot" style="${dotStyle}"></div>
          ${ev.tire.name} ×${ev.laps}${fuelTag}
        </div>`
      });
    }
  }

  return items.map((item, i) => {
    const arrow = i > 0 ? `<span class="seq-arrow">›</span>` : '';
    return arrow + item.html;
  }).join('');
}

// ── Render results ────────────────────────────────────
function render(results, inp) {
  resultsBox.innerHTML = "";

  if (!results.length) {
    const hasRules = inp.mandatoryTires.length > 0 || inp.minCompounds > 1;
    const hint = hasRules
      ? " Your mandatory tire or minimum compound rules may be filtering out all valid strategies — try relaxing them."
      : " Check your tire data.";
    resultsBox.innerHTML = `<div class="result-message error">No valid strategies found.${hint}</div>`;
    return;
  }

  results.forEach((r, i) => {
    const card = document.createElement("div");
    card.className = "result-card" + (i === 0 ? " best" : "");

    const rankLabel = i === 0 ? "Fastest Strategy" : `Strategy ${i + 1}`;
    const parts     = [];
    if (r.tirePits > 0) parts.push(`${r.tirePits} tire stop${r.tirePits > 1 ? "s" : ""}`);
    if (r.fuelPits  > 0) parts.push(`${r.fuelPits} fuel stop${r.fuelPits > 1 ? "s" : ""}`);
    const stopsLabel = (r.tirePits + r.fuelPits) === 0 ? "No pit stops" : parts.join(" · ");
    const lapsLabel  = inp.raceMode === "time" ? ` · ${r.lapsDone} laps` : "";

    card.innerHTML = `
      <div class="result-rank">${rankLabel}</div>
      <div class="result-time">${fmtTime(r.time)}</div>
      <div class="result-meta">${stopsLabel}${lapsLabel}</div>
      <div class="result-sequence">${renderEvents(r.events)}</div>
    `;

    resultsBox.appendChild(card);
  });
}

// ── Calculate ─────────────────────────────────────────
calcBtn.addEventListener("click", () => {
  document.querySelectorAll(".strategy-panel input[type='number']").forEach(inp => validate(inp));

  if (document.querySelectorAll(".field.has-error").length > 0) {
    resultsBox.innerHTML = `<div class="result-message error">Fix the errors above before calculating.</div>`;
    return;
  }

  const inp = getInputs();

  if (!inp.raceLaps && !inp.raceLimitSecs) {
    resultsBox.innerHTML = `<div class="result-message error">Enter a race length.</div>`;
    return;
  }
  if (!inp.tires.length) {
    resultsBox.innerHTML = `<div class="result-message error">Enter data for at least one tire compound.</div>`;
    return;
  }

  // Validate mandatory tires have data entered
  for (const mand of inp.mandatoryTires) {
    if (!inp.tires.find(t => t.name === mand)) {
      resultsBox.innerHTML = `<div class="result-message error">You've marked ${mand} as mandatory but haven't entered ${mand} tire data above.</div>`;
      return;
    }
  }

  calcBtn.textContent = "Calculating…";
  calcBtn.disabled    = true;
  resultsBox.innerHTML = `<div class="result-message">Calculating…</div>`;

  setTimeout(() => {
    try {
      render(calculateStrategies(inp), inp);
    } catch (e) {
      console.error(e);
      resultsBox.innerHTML = `<div class="result-message error">Something went wrong.</div>`;
    } finally {
      calcBtn.textContent = "Calculate";
      calcBtn.disabled    = false;
    }
  }, 20);
});

// ── Clear ─────────────────────────────────────────────
clearBtn.addEventListener("click", () => {
  document.querySelectorAll(".strategy-panel input[type='number']").forEach(i => i.value = "");
  document.querySelectorAll(".field").forEach(f => f.classList.remove("has-error"));
  document.querySelectorAll(".error-msg").forEach(e => e.textContent = "");
  // Reset mandatory buttons
  mandActive.clear();
  mandBtns.forEach(b => { b.classList.remove("active"); b.setAttribute("aria-pressed","false"); });
  updateSlider(1);
  resultsBox.innerHTML = `<div class="results-placeholder"><div class="placeholder-label">Results appear here</div></div>`;
  raceMode = "laps";
  raceLengthInput.placeholder = "Total laps";
  raceButtons.forEach(b => b.classList.remove("active"));
  raceButtons[0].classList.add("active");
});