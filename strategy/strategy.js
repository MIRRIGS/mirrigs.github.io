// =====================================================
// MIR RIGS — GT7 Race Strategy Calculator
// Fresh rewrite
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

// ── Race mode ────────────────────────────────────────
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

// ── Mandatory tire buttons ───────────────────────────
const mandBtns = document.querySelectorAll(".mand-btn");
const mandActive = new Set();

function getMandatoryCount() {
  return mandActive.size;
}

function onMandChange() {
  const floor = getMandatoryCount();
  if (minCompounds < floor) updateSlider(floor);
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

// ── Compounds required slider ────────────────────────
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

  if (val === 1) creqFill.style.width = "0px";
  if (val === 2) creqFill.style.width = "calc(50% - 32px)";
  if (val === 3) creqFill.style.width = "calc(100% - 64px)";

  updateSliderLocks();
}

function updateSliderLocks() {
  const floor = getMandatoryCount();
  creqNodes.forEach(n => {
    const nVal = Number(n.dataset.val);
    const isLocked = nVal < floor;
    const isActive = nVal === minCompounds;
    n.classList.toggle("locked", isLocked && !isActive);
    n.disabled = isLocked && !isActive;
  });
}

creqNodes.forEach(node => {
  node.addEventListener("click", () => {
    const val = Number(node.dataset.val);
    if (val < getMandatoryCount()) return;
    updateSlider(val);
  });
});

// Drag support
(function () {
  const slider = document.getElementById("creqSlider");
  let dragging = false;

  function valFromX(clientX) {
    const rect = slider.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(pct * 2) + 1;
  }

  slider.addEventListener("mousedown", e => {
    dragging = true;
    const v = valFromX(e.clientX);
    if (v >= getMandatoryCount()) updateSlider(v);
  });

  slider.addEventListener("touchstart", e => {
    dragging = true;
    const v = valFromX(e.touches[0].clientX);
    if (v >= getMandatoryCount()) updateSlider(v);
  }, { passive: true });

  document.addEventListener("mousemove", e => {
    if (!dragging) return;
    const v = valFromX(e.clientX);
    if (v >= getMandatoryCount()) updateSlider(v);
  });

  document.addEventListener("touchmove", e => {
    if (!dragging) return;
    const v = valFromX(e.touches[0].clientX);
    if (v >= getMandatoryCount()) updateSlider(v);
  }, { passive: true });

  document.addEventListener("mouseup", () => dragging = false);
  document.addEventListener("touchend", () => dragging = false);
})();

updateSlider(1);

// ── Validation ───────────────────────────────────────
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
  if (input.value === "") {
    clearErr(input);
    return;
  }

  const v = Number(input.value);

  if (input === raceLengthInput) {
    if (raceMode === "laps") {
      (!Number.isInteger(v) || v < 1 || v > 300) ? setErr(input, "1–300 whole laps") : clearErr(input);
    } else {
      (v < 1 || v > 1440) ? setErr(input, "1–1440 mins") : clearErr(input);
    }
  } else if (input === pitTimeInput) {
    v < 0 ? setErr(input, "min 0s") : clearErr(input);
  } else if (input === fuelPerLapInput) {
    (v < 0 || v > 100) ? setErr(input, "0–100 L") : clearErr(input);
  } else if (input === startingFuelInput) {
    (v < 0 || v > 100) ? setErr(input, "0–100 L") : clearErr(input);
  } else if (input === refuelRateInput) {
    (v < 0 || v > 100) ? setErr(input, "0–100 L/s") : clearErr(input);
  } else if ([softLapI, medLapI, hardLapI].includes(input)) {
    v < 1 ? setErr(input, "≥ 1 sec") : clearErr(input);
  } else if ([softLifeI, medLifeI, hardLifeI].includes(input)) {
    v < 1 ? setErr(input, "≥ 1 lap") : clearErr(input);
  }
}

document.querySelectorAll(".strategy-panel input[type='number']").forEach(inp => {
  inp.addEventListener("input", () => validate(inp));
  inp.addEventListener("blur", () => validate(inp));
});

// ── Inputs ───────────────────────────────────────────
function getInputs() {
  return {
    raceMode,
    raceLaps: raceMode === "laps" ? Number(raceLengthInput.value) : null,
    raceLimitSecs: raceMode === "time" ? Number(raceLengthInput.value) * 60 : null,
    pitTime: Number(pitTimeInput.value) || 0,
    fuelPerLap: Number(fuelPerLapInput.value) || 0,
    startingFuel: Number(startingFuelInput.value) || 100,
    refuelRate: Number(refuelRateInput.value) || 0,
    tires: [
      { name: "Soft", color: "#ff3333", lap: Number(softLapI.value), life: Number(softLifeI.value) },
      { name: "Medium", color: "#f5c400", lap: Number(medLapI.value), life: Number(medLifeI.value) },
      { name: "Hard", color: "#ffffff", lap: Number(hardLapI.value), life: Number(hardLifeI.value) }
    ].filter(t => t.lap > 0 && t.life > 0),
    mandatoryTires: [...mandActive],
    minCompounds
  };
}

// =====================================================
// HELPERS
// =====================================================

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const ss = (s % 60).toFixed(1).padStart(4, "0");
  return m > 0 ? `${m}m ${ss}s` : `${ss}s`;
}

function tireMask(name) {
  if (name === "Soft") return 1;
  if (name === "Medium") return 2;
  if (name === "Hard") return 4;
  return 0;
}

function countBits(n) {
  let c = 0;
  while (n) {
    c += n & 1;
    n >>= 1;
  }
  return c;
}

function splitEvenly(total, parts) {
  const base = Math.floor(total / parts);
  const extra = total % parts;
  return Array.from({ length: parts }, (_, i) => i < extra ? base + 1 : base);
}

function uniqueCompoundsInPlan(plan) {
  return new Set(plan.map(x => x.tire.name)).size;
}

function planMask(plan) {
  return plan.reduce((m, s) => m | tireMask(s.tire.name), 0);
}

function passesRulesOnPlan(plan, inp) {
  const mask = planMask(plan);
  for (const mand of inp.mandatoryTires) {
    if (!(mask & tireMask(mand))) return false;
  }
  return countBits(mask) >= inp.minCompounds;
}

function getMaxStints(inp) {
  if (!inp.tires.length) return 4;

  const fastestLap = Math.min(...inp.tires.map(t => t.lap));
  const shortestLife = Math.min(...inp.tires.map(t => t.life));
  const fuelLimited = inp.fuelPerLap > 0 ? Math.max(1, Math.floor(100 / inp.fuelPerLap)) : 999;

  if (inp.raceMode === "laps") {
    const rough = Math.ceil(inp.raceLaps / Math.max(1, Math.min(shortestLife, fuelLimited)));
    return Math.min(6, Math.max(2, rough + 1));
  }

  const roughLaps = Math.ceil(inp.raceLimitSecs / fastestLap) + 2;
  const rough = Math.ceil(roughLaps / Math.max(1, Math.min(shortestLife, fuelLimited)));
  return Math.min(6, Math.max(2, rough + 1));
}

// =====================================================
// PLAN GENERATION
// =====================================================

function generatePatterns(tires, maxStints) {
  const out = [];

  function dfs(seq, usedMask) {
    if (seq.length > 0) out.push([...seq]);
    if (seq.length >= maxStints) return;

    for (const tire of tires) {
      const next = [...seq, tire];
      dfs(next, usedMask | tireMask(tire.name));
    }
  }

  dfs([], 0);
  return out;
}

function normalizeSameTireRuns(plan) {
  const out = plan.map(x => ({ ...x }));
  let i = 0;

  while (i < out.length) {
    let j = i;
    while (j < out.length && out[j].tire.name === out[i].tire.name) j++;

    const runLen = j - i;
    if (runLen > 1) {
      const total = out.slice(i, j).reduce((s, x) => s + x.laps, 0);
      const split = splitEvenly(total, runLen);

      for (let k = 0; k < runLen; k++) {
        if (split[k] > out[i + k].tire.life || split[k] < 1) return null;
        out[i + k].laps = split[k];
      }
    }

    i = j;
  }

  return out;
}

function makeCandidatePlans(pattern, inp) {
  const totalLaps = inp.raceMode === "laps"
    ? inp.raceLaps
    : estimateTargetLapsForTimed(pattern, inp);

  const n = pattern.length;
  if (n > totalLaps && inp.raceMode === "laps") return [];

  const candidates = [];
  const seen = new Set();

  function pushPlan(lapsArr) {
    if (!lapsArr || lapsArr.length !== n) return;
    if (lapsArr.some((laps, i) => laps < 1 || laps > pattern[i].life)) return;
    if (inp.raceMode === "laps" && lapsArr.reduce((a, b) => a + b, 0) !== totalLaps) return;

    let plan = pattern.map((t, i) => ({ tire: t, laps: lapsArr[i] }));
    plan = normalizeSameTireRuns(plan);
    if (!plan) return;

    const sig = plan.map(p => `${p.tire.name}:${p.laps}`).join("|");
    if (seen.has(sig)) return;
    seen.add(sig);

    if (!passesRulesOnPlan(plan, inp)) return;
    candidates.push(plan);
  }

  // timed mode doesn't need exact total laps in plan — just enough runway
  const target = totalLaps;

  // 1) minimum legal
  if (target >= n) {
    const arr = new Array(n).fill(1);
    if (inp.raceMode === "laps") {
      let rem = target - n;
      const order = [...Array(n).keys()].sort((a, b) => pattern[a].lap - pattern[b].lap);
      for (const i of order) {
        const add = Math.min(rem, pattern[i].life - arr[i]);
        arr[i] += add;
        rem -= add;
        if (rem <= 0) break;
      }
      pushPlan(arr);
    } else {
      const arrTimed = pattern.map(t => Math.max(1, Math.min(t.life, Math.ceil(target / n))));
      pushPlan(arrTimed);
    }
  }

  // 2) all-softest-first style
  if (inp.raceMode === "laps") {
    const arr = new Array(n).fill(1);
    let rem = target - n;
    const order = [...Array(n).keys()].sort((a, b) => pattern[a].lap - pattern[b].lap);
    for (const i of order) {
      const add = Math.min(rem, pattern[i].life - arr[i]);
      arr[i] += add;
      rem -= add;
      if (rem <= 0) break;
    }
    pushPlan(arr);
  }

  // 3) all-last-full style
  if (inp.raceMode === "laps") {
    const arr = new Array(n).fill(1);
    let rem = target - n;
    for (let i = n - 1; i >= 0; i--) {
      const add = Math.min(rem, pattern[i].life - arr[i]);
      arr[i] += add;
      rem -= add;
      if (rem <= 0) break;
    }
    pushPlan(arr);
  }

  // 4) each stint emphasized
  if (inp.raceMode === "laps") {
    for (let focus = 0; focus < n; focus++) {
      const arr = new Array(n).fill(1);
      let rem = target - n;

      const primary = [focus];
      const secondary = [...Array(n).keys()]
        .filter(i => i !== focus)
        .sort((a, b) => pattern[a].lap - pattern[b].lap);

      for (const i of [...primary, ...secondary]) {
        const add = Math.min(rem, pattern[i].life - arr[i]);
        arr[i] += add;
        rem -= add;
        if (rem <= 0) break;
      }

      pushPlan(arr);
    }
  }

  // 5) fuel-aligned candidate
  if (inp.raceMode === "laps" && inp.fuelPerLap > 0) {
    const tankLaps = Math.max(1, Math.floor(100 / inp.fuelPerLap));
    const arr = new Array(n).fill(1);
    let rem = target - n;

    for (let i = 0; i < n; i++) {
      const cap = Math.min(pattern[i].life, tankLaps);
      const add = Math.min(rem, cap - 1);
      arr[i] += add;
      rem -= add;
    }

    if (rem > 0) {
      const order = [...Array(n).keys()].sort((a, b) => pattern[a].lap - pattern[b].lap);
      for (const i of order) {
        const add = Math.min(rem, pattern[i].life - arr[i]);
        arr[i] += add;
        rem -= add;
        if (rem <= 0) break;
      }
    }

    pushPlan(arr);
  }

  // 6) timed mode candidates
  if (inp.raceMode === "time") {
    const avg = Math.max(1, Math.floor(target / n));

    pushPlan(pattern.map(t => Math.min(t.life, Math.max(1, avg))));
    pushPlan(pattern.map((t, i) => Math.min(t.life, Math.max(1, i === 0 ? avg + 2 : avg))));
    pushPlan(pattern.map((t, i) => Math.min(t.life, Math.max(1, i === n - 1 ? avg + 2 : avg))));
    pushPlan(pattern.map(t => Math.min(t.life, Math.max(1, t.life))));
  }

  return candidates;
}

function estimateTargetLapsForTimed(pattern, inp) {
  const fastestLap = Math.min(...inp.tires.map(t => t.lap));
  const roughBase = Math.ceil(inp.raceLimitSecs / fastestLap) + 3;
  const pitPenaltyLaps = Math.ceil((Math.max(0, pattern.length - 1) * inp.pitTime) / fastestLap);
  return Math.max(pattern.length, roughBase - pitPenaltyLaps + 4);
}

// =====================================================
// SIMULATION
// =====================================================

function simulate(plan, inp) {
  let time = 0;
  let fuel = Math.max(0, Math.min(100, inp.startingFuel));
  let lapsDone = 0;
  let tirePits = 0;
  let fuelPits = 0;
  const events = [];

  for (let si = 0; si < plan.length; si++) {
    const { tire, laps: plannedLaps } = plan[si];
    let stintLapsDone = 0;

    for (let lap = 0; lap < plannedLaps; lap++) {
      // fuel-only stop if needed before this lap
      if (inp.fuelPerLap > 0 && fuel + 1e-9 < inp.fuelPerLap) {
        if (stintLapsDone > 0) {
          events.push({ kind: "stint", tire, laps: stintLapsDone });
          stintLapsDone = 0;
        }

        fuelPits++;

        const lapsRemainingThisStint = plannedLaps - lap;
        const fuelNeeded = lapsRemainingThisStint * inp.fuelPerLap;
        const fuelAdded = Math.max(0, Math.min(100 - fuel, fuelNeeded - fuel));
        const refuelTime = inp.refuelRate > 0 ? fuelAdded / inp.refuelRate : 0;
        const stopBase = Math.max(0, inp.pitTime - 3);
        const stopTime = stopBase + refuelTime;

        events.push({ kind: "fuelstop", fuelAdded, stopTime });
        time += stopTime;
        fuel += fuelAdded;
      }

      // do lap
      time += tire.lap;
      fuel = Math.max(0, fuel - inp.fuelPerLap);
      lapsDone++;
      stintLapsDone++;

      if (inp.raceMode === "laps" && lapsDone >= inp.raceLaps) {
        if (stintLapsDone > 0) events.push({ kind: "stint", tire, laps: stintLapsDone });
        return { events, time, lapsDone, tirePits, fuelPits };
      }

      if (inp.raceMode === "time" && time >= inp.raceLimitSecs) {
        if (stintLapsDone > 0) events.push({ kind: "stint", tire, laps: stintLapsDone });
        return { events, time, lapsDone, tirePits, fuelPits };
      }
    }

    if (stintLapsDone > 0) {
      events.push({ kind: "stint", tire, laps: stintLapsDone });
    }

    // planned tire stop
    if (si < plan.length - 1) {
      tirePits++;

      const next = plan[si + 1];
      let fuelAdded = 0;
      let stopTime = inp.pitTime;

      if (inp.fuelPerLap > 0) {
        let lapsToFuelFor = next.laps;

        if (inp.raceMode === "time") {
          const timeAfterStop = time + inp.pitTime;
          const drivingTimeLeft = Math.max(0, inp.raceLimitSecs - timeAfterStop);
          const estLaps = Math.max(1, Math.ceil(drivingTimeLeft / next.tire.lap));
          lapsToFuelFor = Math.min(next.laps, estLaps);
        }

        const needed = lapsToFuelFor * inp.fuelPerLap;
        fuelAdded = Math.max(0, Math.min(100 - fuel, needed - fuel));

        if (fuelAdded > 0 && inp.refuelRate > 0) {
          stopTime += fuelAdded / inp.refuelRate;
        }

        fuel += fuelAdded;
      }

      events.push({ kind: "tirechange", fuelAdded, stopTime });
      time += stopTime;
    }
  }

  // timed mode fallback: keep looping last tire if plan ended too early
  if (inp.raceMode === "time" && plan.length > 0) {
    const last = plan[plan.length - 1];
    let carry = 0;

    while (time < inp.raceLimitSecs) {
      if (carry >= last.tire.life) {
        if (carry > 0) {
          events.push({ kind: "stint", tire: last.tire, laps: carry });
          carry = 0;
        }

        tirePits++;
        let stopTime = inp.pitTime;
        let fuelAdded = 0;

        if (inp.fuelPerLap > 0) {
          const drivingTimeLeft = Math.max(0, inp.raceLimitSecs - (time + inp.pitTime));
          const estLaps = Math.max(1, Math.ceil(drivingTimeLeft / last.tire.lap));
          const needed = estLaps * inp.fuelPerLap;
          fuelAdded = Math.max(0, Math.min(100 - fuel, needed - fuel));
          if (fuelAdded > 0 && inp.refuelRate > 0) stopTime += fuelAdded / inp.refuelRate;
          fuel += fuelAdded;
        }

        events.push({ kind: "tirechange", fuelAdded, stopTime });
        time += stopTime;
      }

      if (inp.fuelPerLap > 0 && fuel + 1e-9 < inp.fuelPerLap) {
        if (carry > 0) {
          events.push({ kind: "stint", tire: last.tire, laps: carry });
          carry = 0;
        }

        fuelPits++;
        const fuelAdded = Math.max(0, 100 - fuel);
        const refuelTime = inp.refuelRate > 0 ? fuelAdded / inp.refuelRate : 0;
        const stopBase = Math.max(0, inp.pitTime - 3);
        const stopTime = stopBase + refuelTime;

        events.push({ kind: "fuelstop", fuelAdded, stopTime });
        time += stopTime;
        fuel += fuelAdded;
      }

      time += last.tire.lap;
      fuel = Math.max(0, fuel - inp.fuelPerLap);
      lapsDone++;
      carry++;

      if (time >= inp.raceLimitSecs) {
        if (carry > 0) events.push({ kind: "stint", tire: last.tire, laps: carry });
        return { events, time, lapsDone, tirePits, fuelPits };
      }
    }
  }

  return { events, time, lapsDone, tirePits, fuelPits };
}

function resultMask(result) {
  return result.events
    .filter(e => e.kind === "stint")
    .reduce((m, e) => m | tireMask(e.tire.name), 0);
}

function resultPassesRules(result, inp) {
  const mask = resultMask(result);
  for (const mand of inp.mandatoryTires) {
    if (!(mask & tireMask(mand))) return false;
  }
  return countBits(mask) >= inp.minCompounds;
}

// =====================================================
// RANKING
// =====================================================

function isBetter(a, b, inp) {
  if (!b) return true;

  if (inp.raceMode === "time") {
    if (a.lapsDone !== b.lapsDone) return a.lapsDone > b.lapsDone;
    if (a.time !== b.time) return a.time < b.time;
    return (a.tirePits + a.fuelPits) < (b.tirePits + b.fuelPits);
  }

  if (a.time !== b.time) return a.time < b.time;
  return (a.tirePits + a.fuelPits) < (b.tirePits + b.fuelPits);
}

function strategySignature(result) {
  return result.events
    .filter(e => e.kind === "stint")
    .map(e => `${e.tire.name}:${e.laps}`)
    .join("|");
}
function compoundRank(name) {
  if (name === "Hard") return 0;
  if (name === "Medium") return 1;
  if (name === "Soft") return 2;
  return 99;
}

function canonicalizeResult(result, inp) {
  const stintEvents = result.events.filter(e => e.kind === "stint");
  if (!stintEvents.length) return result;

  // rebuild pure stint plan
  let plan = stintEvents.map(e => ({
    tire: e.tire,
    laps: e.laps
  }));

  // sort hardest -> softest
  plan.sort((a, b) => {
    const rankDiff = compoundRank(a.tire.name) - compoundRank(b.tire.name);
    if (rankDiff !== 0) return rankDiff;
    return 0;
  });

  // rebalance repeated same-tire runs after sorting
  plan = normalizeSameTireRuns(plan);
  if (!plan) return result;

  // resimulate with canonical order
  const canonical = simulate(plan, inp);
  if (!canonical || canonical.lapsDone < 1) return result;
  if (!resultPassesRules(canonical, inp)) return result;

  return canonical;
}
// =====================================================
// SOLVER
// =====================================================

function calculateStrategies(inp) {
  const maxStints = getMaxStints(inp);
  const patterns = generatePatterns(inp.tires, maxStints);
  const bestBySig = new Map();

  for (const pattern of patterns) {
    if (!passesRulesOnPlan(pattern.map(t => ({ tire: t, laps: 1 })), {
      ...inp,
      minCompounds: Math.min(inp.minCompounds, pattern.length)
    })) {
      continue;
    }

    const plans = makeCandidatePlans(pattern, inp);

    for (const plan of plans) {
   let result = simulate(plan, inp);
if (!result || result.lapsDone < 1) continue;
if (!resultPassesRules(result, inp)) continue;

// canonicalize final displayed order
result = canonicalizeResult(result, inp);

const sig = strategySignature(result);
const existing = bestBySig.get(sig);

if (isBetter(result, existing, inp)) {
  bestBySig.set(sig, result);
}
    }
  }

  return [...bestBySig.values()]
    .sort((a, b) => {
      if (inp.raceMode === "time" && a.lapsDone !== b.lapsDone) {
        return b.lapsDone - a.lapsDone;
      }
      if (a.time !== b.time) return a.time - b.time;
      return (a.tirePits + a.fuelPits) - (b.tirePits + b.fuelPits);
    })
    .slice(0, 3);
}

// =====================================================
// RENDER
// =====================================================

function renderEvents(events) {
  const items = [];

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];

    if (ev.kind === "fuelstop") {
      items.push({
        html: `<div class="pit-fuel-only">fuel only +${Math.round(ev.fuelAdded)}L</div>`
      });
    }

    if (ev.kind === "stint") {
      const prev = i > 0 ? events[i - 1] : null;
      const fuelTag = prev?.kind === "tirechange" && prev.fuelAdded > 0
        ? `<span class="stint-fuel"> fuel +${Math.round(prev.fuelAdded)}L</span>`
        : "";

      const isHard = ev.tire.color === "#ffffff";
      const dotStyle = `background:${ev.tire.color};${isHard ? "border:1px solid rgba(255,255,255,0.4);" : ""}`;

      items.push({
        html: `<div class="stint-pill">
          <div class="stint-dot" style="${dotStyle}"></div>
          ${ev.tire.name} ×${ev.laps}${fuelTag}
        </div>`
      });
    }
  }

  return items.map((item, i) => {
    const arrow = i > 0 ? `<span class="seq-arrow">›</span>` : "";
    return arrow + item.html;
  }).join("");
}

function render(results, inp) {
  resultsBox.innerHTML = "";

  if (!results.length) {
    const hasRules = inp.mandatoryTires.length > 0 || inp.minCompounds > 1;
    const hint = hasRules
      ? " Your mandatory tire or compound rules are probably strangling every valid strategy."
      : " Check your tire/fuel inputs.";
    resultsBox.innerHTML = `<div class="result-message error">No valid strategies found.${hint}</div>`;
    return;
  }

  results.forEach((r, i) => {
    const card = document.createElement("div");
    card.className = "result-card" + (i === 0 ? " best" : "");

    const rankLabel = i === 0 ? "Fastest Strategy" : `Strategy ${i + 1}`;
    const parts = [];

    if (r.tirePits > 0) parts.push(`${r.tirePits} tire stop${r.tirePits > 1 ? "s" : ""}`);
    if (r.fuelPits > 0) parts.push(`${r.fuelPits} fuel stop${r.fuelPits > 1 ? "s" : ""}`);

    const stopsLabel = (r.tirePits + r.fuelPits) === 0 ? "No pit stops" : parts.join(" · ");
    const lapsLabel = inp.raceMode === "time" ? ` · ${r.lapsDone} laps` : "";

    card.innerHTML = `
      <div class="result-rank">${rankLabel}</div>
      <div class="result-time">${fmtTime(r.time)}</div>
      <div class="result-meta">${stopsLabel}${lapsLabel}</div>
      <div class="result-sequence">${renderEvents(r.events)}</div>
    `;

    resultsBox.appendChild(card);
  });
}

// =====================================================
// ACTIONS
// =====================================================

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
    resultsBox.innerHTML = `<div class="result-message error">Enter at least one tire compound.</div>`;
    return;
  }

  for (const mand of inp.mandatoryTires) {
    if (!inp.tires.find(t => t.name === mand)) {
      resultsBox.innerHTML = `<div class="result-message error">You made ${mand} mandatory but didn’t enter its data. Genius.</div>`;
      return;
    }
  }

  calcBtn.textContent = "Calculating…";
  calcBtn.disabled = true;
  resultsBox.innerHTML = `<div class="result-message">Calculating…</div>`;

  setTimeout(() => {
    try {
      const results = calculateStrategies(inp);
      render(results, inp);
    } catch (e) {
      console.error(e);
      resultsBox.innerHTML = `<div class="result-message error">Something exploded. Check console.</div>`;
    } finally {
      calcBtn.textContent = "Calculate";
      calcBtn.disabled = false;
    }
  }, 20);
});

clearBtn.addEventListener("click", () => {
  document.querySelectorAll(".strategy-panel input[type='number']").forEach(i => i.value = "");
  document.querySelectorAll(".field").forEach(f => f.classList.remove("has-error"));
  document.querySelectorAll(".error-msg").forEach(e => e.textContent = "");

  mandActive.clear();
  mandBtns.forEach(b => {
    b.classList.remove("active");
    b.setAttribute("aria-pressed", "false");
  });

  updateSlider(1);

  resultsBox.innerHTML = `
    <div class="results-placeholder">
      <div class="placeholder-label">Results appear here</div>
    </div>
  `;

  raceMode = "laps";
  raceLengthInput.placeholder = "Total laps";
  raceButtons.forEach(b => b.classList.remove("active"));
  raceButtons[0].classList.add("active");
});