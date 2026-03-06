console.log("strategy.js loaded");

// ===================================
// DOM REFERENCES
// ===================================

const calcBtn = document.getElementById("calcBtn");
const clearBtn = document.getElementById("clearBtn");
const resultsBox = document.getElementById("results");

const raceLength = document.getElementById("raceLength");
const raceButtons = document.querySelectorAll(".race-btn");

const pitTimeInput = document.getElementById("pitTime");
const fuelPerLapInput = document.getElementById("fuelPerLap");
const refuelRateInput = document.getElementById("refuelRate");
const startingFuelInput = document.getElementById("startingFuel");

const softLap = document.getElementById("softLap");
const softLife = document.getElementById("softLife");
const medLap = document.getElementById("medLap");
const medLife = document.getElementById("medLife");
const hardLap = document.getElementById("hardLap");
const hardLife = document.getElementById("hardLife");

// ===================================
// ERROR HELPERS
// ===================================

function setError(input, message) {
  const field = input.closest(".field");
  if (!field) return;
  field.classList.add("has-error");
  const msg = field.querySelector(".error-msg");
  if (msg) msg.textContent = message;
}

function clearError(input) {
  const field = input.closest(".field");
  if (!field) return;
  field.classList.remove("has-error");
  const msg = field.querySelector(".error-msg");
  if (msg) msg.textContent = "";
}

function hasErrors() {
  return document.querySelectorAll(".field.has-error").length > 0;
}

// ===================================
// RACE MODE
// ===================================

let raceMode = "laps";

raceButtons.forEach(btn => {
  btn.onclick = () => {
    raceButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    raceMode = btn.dataset.mode;
    raceLength.placeholder =
      raceMode === "laps" ? "Total Laps" : "Race Length In Mins";
    raceLength.dispatchEvent(new Event("input"));
  };
});

// ===================================
// INPUT VALIDATION (MINIMAL BUT REAL)
// ===================================

raceLength.addEventListener("input", () => {
  const v = Number(raceLength.value);
  if (!raceLength.value) {
    setError(raceLength, "Required");
    return;
  }
  if (raceMode === "laps") {
    v < 1 || v > 200
      ? setError(raceLength, "1–200 laps")
      : clearError(raceLength);
  } else {
    v < 1 || v > 1440
      ? setError(raceLength, "1–1440 mins")
      : clearError(raceLength);
  }
});

pitTimeInput.addEventListener("input", () => {
  Number(pitTimeInput.value) < 0
    ? setError(pitTimeInput, "≥ 0")
    : clearError(pitTimeInput);
});

[fuelPerLapInput, startingFuelInput].forEach(input => {
  input.addEventListener("input", () => {
    if (input.value === "") {
      clearError(input);
      return;
    }
    const v = Number(input.value);
    v < 0 || v > 100
      ? setError(input, "0–100")
      : clearError(input);
  });
});

refuelRateInput.addEventListener("input", () => {
  if (refuelRateInput.value === "") {
    clearError(refuelRateInput);
    return;
  }
  const v = Number(refuelRateInput.value);
  v < 1 || v > 100
    ? setError(refuelRateInput, "1–100")
    : clearError(refuelRateInput);
});

[softLap, medLap, hardLap].forEach(input => {
  input.addEventListener("input", () => {
    if (input.value === "") {
      clearError(input);
      return;
    }
    Number(input.value) < 1
      ? setError(input, "≥ 1 sec")
      : clearError(input);
  });
});

[softLife, medLife, hardLife].forEach(input => {
  input.addEventListener("input", () => {
    Number(input.value) < 0
      ? setError(input, "≥ 0")
      : clearError(input);
  });
});

// ===================================
// INPUT COLLECTION
// ===================================

function getInputs() {
  return {
    raceValue: Number(raceLength.value),
    raceMode,
    pitLoss: Number(pitTimeInput.value) || 0,
    fuelPerLap: Number(fuelPerLapInput.value) || 0,
    refuelRate: Number(refuelRateInput.value) || 0,
    startingFuel: Number(startingFuelInput.value) || 0,
    tires: [
      { name: "Soft", lap: Number(softLap.value), life: Number(softLife.value) },
      { name: "Medium", lap: Number(medLap.value), life: Number(medLife.value) },
      { name: "Hard", lap: Number(hardLap.value), life: Number(hardLife.value) }
    ].filter(t => t.lap > 0 && t.life > 0)
  };
}

// ===================================
// FULL STRATEGY ENGINE (MULTI-STINT + FUEL)
// ===================================

function calculateStrategies(inputs) {
  const results = [];
  let bestTimeSoFar = Infinity;

  // generate stint combinations like:
  // [{tire, laps}, {tire, laps}, ...]
  function buildStints(seq, lapsDone, timeDone, depth) {
   if (lapsDone > inputs.raceValue + 10) return;

    // ----- END CONDITIONS -----
    if (inputs.raceMode === "laps" && lapsDone === inputs.raceValue) {
      simulate(seq);
      return;
    }

if (
  inputs.raceMode === "time" &&
  timeDone >= inputs.raceValue * 60 * 1.2
) {
  // allow generator to overshoot ~20%
  simulate(seq);
  return;
}

    for (const tire of inputs.tires) {
      for (let l = 1; l <= tire.life; l++) {
        // prevent lap overflow
        if (
          inputs.raceMode === "laps" &&
          lapsDone + l > inputs.raceValue
        ) continue;

        buildStints(
          [...seq, { tire, laps: l }],
          lapsDone + l,
          timeDone + l * tire.lap,
          depth + 1
        );
      }
    }
  }

  // ===================================
  // STRATEGY SIMULATION
  // ===================================

  function simulate(strategy) {
    let time = 0;
    let fuel = inputs.startingFuel;
    let pits = 0;
    let laps = 0;

    for (let i = 0; i < strategy.length; i++) {
      const stint = strategy[i];

      for (let lap = 0; lap < stint.laps; lap++) {

   // ---- FUEL CHECK BEFORE LAP ----
if (inputs.fuelPerLap > 0 && fuel < inputs.fuelPerLap) {
  // forced pit stop due to fuel
  pits++;

  let pitTime = inputs.pitLoss;

  // add enough fuel to safely continue (2 laps buffer)
  const fuelToAdd = Math.min(
    100 - fuel,
    inputs.fuelPerLap * 2
  );

if (inputs.refuelRate > 0) {
  pitTime += fuelToAdd / inputs.refuelRate;
}
  fuel += fuelToAdd;
  time += pitTime;

  // prune if already slower than best known strategy
  if (time > bestTimeSoFar) return;
}

        // ---- RUN LAP ----
        time += stint.tire.lap;
        fuel -= inputs.fuelPerLap;
        laps++;

        // ---- END CONDITIONS ----
        if (
          inputs.raceMode === "laps" &&
          laps === inputs.raceValue
        ) break;

        if (
          inputs.raceMode === "time" &&
          time >= inputs.raceValue * 60
        ) break;
      }

      // race finished?
      if (
        (inputs.raceMode === "laps" && laps === inputs.raceValue) ||
        (inputs.raceMode === "time" && time >= inputs.raceValue * 60)
      ) break;

      // ---- PIT STOP ----
      if (i < strategy.length - 1) {
        pits++;
        let pitTime = inputs.pitLoss;

        const next = strategy[i + 1];
        const tireChange = stint.tire.name !== next.tire.name;

        if (!tireChange) pitTime -= 3; // same compound rule

        // ---- REFUEL ----
        if (inputs.fuelPerLap > 0) {
    // top up to safe buffer for next stint
const targetFuel =
  Math.min(100, fuel + next.laps * inputs.fuelPerLap * 1.1);

if (fuel < targetFuel) {
  const fuelToAdd = targetFuel - fuel;
if (inputs.refuelRate > 0) {
  pitTime += fuelToAdd / inputs.refuelRate;
}
fuel += fuelToAdd;
}
        }

        time += pitTime;
      }
    }

if (time < bestTimeSoFar) {
  bestTimeSoFar = time;
}

results.push({
  strategy,
  time,
  pits,
  laps
});
  }

  buildStints([], 0, 0, 0);

  return results
    .filter(r => r.laps > 0)
    .sort((a, b) => {
      if (inputs.raceMode === "time" && a.laps !== b.laps)
        return b.laps - a.laps;
      return a.time - b.time;
    })
    .slice(0, 3);
}

// ===================================
// RENDER
// ===================================

function render(strats) {
  resultsBox.innerHTML = "";

  if (!strats.length) {
    resultsBox.innerHTML = "<div>No valid strategies</div>";
    return;
  }

  strats.forEach((s, i) => {
    const div = document.createElement("div");
    div.className = "result-card" + (i === 0 ? " best" : "");
    div.innerHTML = `
      <div class="result-title">#${i + 1}</div>
      <div class="result-meta">
        Time: ${s.time.toFixed(1)}s • Pits: ${s.pits}
      </div>
      <div class="result-strategy">
        ${s.strategy.map(x => `${x.tire.name} ${x.laps}`).join(" → ")}
      </div>
    `;
    resultsBox.appendChild(div);
  });
}

// ===================================
// CALCULATE
// ===================================

calcBtn.onclick = () => {
  console.log("CALCULATE CLICKED");
  resultsBox.innerHTML = "";

  if (hasErrors()) {
    resultsBox.innerHTML = "<div>Fix errors before calculating</div>";
    return;
  }

  const inputs = getInputs();
  if (!inputs.raceValue || !inputs.tires.length) {
    resultsBox.innerHTML = "<div>Enter race length and at least one tire</div>";
    return;
  }

const results = calculateStrategies(inputs);
render(results);
};

// ===================================
// CLEAR
// ===================================

clearBtn.onclick = () => {
  document.querySelectorAll(".strategy-panel input").forEach(i => i.value = "");
  document.querySelectorAll(".field").forEach(f => f.classList.remove("has-error"));
  document.querySelectorAll(".error-msg").forEach(e => e.textContent = "");
  resultsBox.innerHTML = "";
  raceMode = "laps";
  raceLength.placeholder = "Total Laps";
  raceButtons.forEach(b => b.classList.remove("active"));
  raceButtons[0].classList.add("active");
};