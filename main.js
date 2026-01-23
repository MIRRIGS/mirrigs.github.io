import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/* ================== PRICING RULES ================== */
// Base prices
const BASE_GT_SILVER = 20000;
const BASE_KART_SILVER = 15000;
const BLACK_UPCHARGE = 2000;

// Black-only extra charges
const BLACK_SINGLE_SCREEN_EXTRA = 600;
const BLACK_TRIPLE_SCREEN_EXTRA = 1000;
const BLACK_BIG_SHIFTER_EXTRA = 800;

/* ================== STATE ================== */
let cockpitColor = "silver";
let currentSpec = "gt"; // gt = GT-Spec, kart = Kart-Spec
const selected = {
  screen: null,
  shifter: null,
  wheels: null,
  addons: new Set()
};
function resolveModelFile(file) {
  if (currentSpec === "kart" && file.startsWith("GT_")) {
    return file.replace("GT_", "KART_");
  }
  return file;
}
function verticalSupportsBlocked() {
  return (
    currentSpec === "kart" &&
    (
      selected.screen?.includes("Integrated") ||
      selected.addons.has("KART_PS5_Holder.glb") ||
      selected.addons.has("KART_Legs.glb") ||
      selected.wheels !== null
    )
  );
}
/* ================== PART PRICES ================== */
const prices = {
 screens: {
  // GT
  "GT_Monitor_Single_Standalone.glb": 8000,
  "GT_Monitor_Single_Integrated.glb": 6500,
  "GT_Monitor_Triple_Standalone.glb": 13000,
  "GT_Monitor_Triple_Integrated.glb": 10000,

  // KART (SAME PRICES)
  "KART_Monitor_Single_Standalone.glb": 8000,
  "KART_Monitor_Single_Integrated.glb": 6500,
  "KART_Monitor_Triple_Standalone.glb": 13000,
  "KART_Monitor_Triple_Integrated.glb": 10000
},
shifter: {
  // GT
  "GT_Shifter_Big.glb": 6500,
  "GT_Shifter_Small.glb": 3000,

  // KART (same price as small shifter)
  "KART_Shifter_Small.glb": 3000
},
  wheels: {
  // GT
  "GT_Wheels_4.glb": 4000,
  "GT_Wheels_6.glb": 6000,

  // KART (SAME PRICES)
  "KART_Wheels_4.glb": 4000,
  "KART_Wheels_6.glb": 6000
},
 addons: {
  // GT
  "GT_Cupholder.glb": 1000,
  "GT_Headphone_Mount.glb": 1000,
  "GT_PS5_Holder.glb": 1500,
  "GT_Upgraded_Brackets.glb": 2400,

  // KART
  "KART_Verticle.glb": 0,
  "KART_Legs.glb": 1500,
  "KART_Cupholder.glb": 1000,
  "KART_Headphone_Mount.glb": 1000,
  "KART_PS5_Holder.glb": 1500
}
};

/* ================== SCENE ================== */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf2f2f2);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.01,
  5000
);
camera.position.set(84, 38, 104);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const UI_WIDTH = 260; // must match #ui width in CSS
const UI_MARGIN = 20; // left offset
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = window.innerWidth > 900;
controls.enableDamping = true;
controls.enablePan = false;
controls.minPolarAngle = Math.PI / 4.8;
controls.maxPolarAngle = Math.PI / 1.6;
function updateSceneCenter() {
  const availableWidth = window.innerWidth - (UI_WIDTH + UI_MARGIN);
  const offsetX = (UI_WIDTH + UI_MARGIN) - window.innerWidth / 2;

  controls.addEventListener("start", () => {
  const hint = document.getElementById("orbitHint");
  if (hint) hint.style.opacity = 0;
});

controls.target.set(0, 20, 0);
  camera.position.x = offsetX * 0.15 + 90;
}updateSceneCenter();

/* ================== LIGHTS ================== */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff,0.9);
keyLight.position.set(500, 1000, 500);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.45);
fillLight.position.set(-400, 300, 300);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.35);
rimLight.position.set(0, 400, -600);
scene.add(rimLight);

/* ================== MODELS ================== */
const loader = new GLTFLoader();
const models = {};
const KART_FILES = [
  "KART_Cockpit_Base.glb",
  "KART_Cupholder.glb",
  "KART_Monitor_Single_Integrated.glb",
  "KART_Monitor_Single_Standalone.glb",
  "KART_Monitor_Triple_Integrated.glb",
  "KART_Monitor_Triple_Standalone.glb",
  "KART_PS5_Holder.glb",
  "KART_Legs.glb",
  "KART_Shifter_Small.glb",
  "KART_Verticle.glb",
  "KART_Wheels_4.glb",
  "KART_Wheels_6.glb"
];

const files = [
  "GT_Cockpit_Base.glb",
  "KART_Cockpit_Base.glb",

  // GT screens
  ...Object.keys(prices.screens),

  // KART screens
  "KART_Monitor_Single_Standalone.glb",
  "KART_Monitor_Single_Integrated.glb",
  "KART_Monitor_Triple_Standalone.glb",
  "KART_Monitor_Triple_Integrated.glb",

  // KART wheels
  "KART_Wheels_4.glb",
  "KART_Wheels_6.glb",

  // KART shifter
  "KART_Shifter_Small.glb",

  // KART addons
  "KART_Cupholder.glb",
  "KART_Headphone_Mount.glb",
  "KART_PS5_Holder.glb",

  // GT shifter / wheels / addons
  ...Object.keys(prices.shifter),
  ...Object.keys(prices.wheels),
  ...Object.keys(prices.addons)
];

files.forEach(file => {
  loader.load(`${file}`, gltf => {
    const obj = gltf.scene;
    if (file.startsWith("GT_")) {
  obj.visible = file === "GT_Cockpit_Base.glb";
} else if (file.startsWith("KART_")) {
  obj.visible = false;
}
    scene.add(obj);
    models[file] = obj;

  // do nothing — let the base use authored materials
  
  });
});

/* ================== PRICE CALCULATION ================== */
function calculateTotal() {
 let total =
  currentSpec === "kart"
    ? BASE_KART_SILVER
    : BASE_GT_SILVER;

  // Black cockpit base
  if (cockpitColor === "black") {
    total += BLACK_UPCHARGE;
  }

  // Screen price
  if (selected.screen) {
    total += prices.screens[selected.screen];

    if (cockpitColor === "black") {
      if (selected.screen.includes("Single")) {
        total += BLACK_SINGLE_SCREEN_EXTRA;
      }
      if (selected.screen.includes("Triple")) {
        total += BLACK_TRIPLE_SCREEN_EXTRA;
      }
    }
  }

  // Shifter price
  if (selected.shifter) {
    total += prices.shifter[selected.shifter];

    if (
      cockpitColor === "black" &&
      selected.shifter === "GT_Shifter_Big.glb"
    ) {
      total += BLACK_BIG_SHIFTER_EXTRA;
    }
  }

  // Wheels
  if (selected.wheels) {
    total += prices.wheels[selected.wheels];
  }

  // Addons
  selected.addons.forEach(a => {
    total += prices.addons[a];
  });

  document.getElementById("totalPrice").innerText =
    `₹${total.toLocaleString()}`;
}

/* ================== HELPERS ================== */
function clearActive(selector) {
  document.querySelectorAll(selector).forEach(b =>
    b.classList.remove("active")
  );
}

/* ================== COLOR ================== */
window.setCockpitColor = (mode, btn) => {
  cockpitColor = mode;
  clearActive(".color");
  btn.classList.add("active");

  if (mode === "black") {
    scene.background.set(0xf2f2f2);
    ambientLight.intensity = 0.2;
    keyLight.intensity = 1;
  } else {
  // SILVER cockpit → DARK background + STRONG lighting
  scene.background.set(0x1f1f1f);

  ambientLight.intensity = 0.6;   // ← THIS is the main fix
  keyLight.intensity = 14;        // ← THIS is the shine
}
  calculateTotal();
};

/* ================== SCREENS ================== */
window.selectScreen = (file, btn) => {
  // 🔴 KILL ALL SCREENS FIRST
  Object.keys(models).forEach(k => {
    if (k.includes("Monitor")) {
      models[k].visible = false;
    }
  });

  clearActive("[onclick^='selectScreen']");

  // 🔁 TOGGLE OFF
  if (selected.screen === resolveModelFile(file)) {
    selected.screen = null;
    calculateTotal();
    return;
  }

  // 🟢 TURN ON NEW SCREEN
  const resolvedFile = resolveModelFile(file);
  if (!models[resolvedFile]) return;

  models[resolvedFile].visible = true;
  btn.classList.add("active");
  selected.screen = resolvedFile;

// Integrated screens kill PS5 (GT + KART)
if (resolvedFile.includes("Integrated")) {

  ["GT_PS5_Holder.glb", "KART_PS5_Holder.glb"].forEach(ps5 => {
    selected.addons.delete(ps5);

    if (models[ps5]) {
      models[ps5].visible = false;
    }
  });
  // 🔴 Integrated screens ALSO kill Vertical Supports (KART)
const vs = "KART_Verticle.glb";

if (selected.addons.has(vs)) {
  selected.addons.delete(vs);
  if (models[vs]) models[vs].visible = false;

  const vsBtn = document.querySelector(
    ".kart-only button[onclick*='KART_Verticle']"
  );
  vsBtn?.classList.remove("active");
}

  // UI sync (same button for both specs)
  document
    .querySelectorAll("button[onclick^='togglePS5']")
    .forEach(b => b.classList.remove("active"));
}
  calculateTotal();
};
/* ================== SHIFTERS ================== */
window.selectShifter = (file, btn) => {
  // 🔴 HIDE ALL SHIFTERS (GT + KART)
  Object.keys(models).forEach(k => {
    if (k.includes("Shifter")) {
      models[k].visible = false;
    }
  });

  clearActive("[onclick^='selectShifter']");

  const resolvedFile = resolveModelFile(file);

  // 🔁 TOGGLE OFF
  if (selected.shifter === resolvedFile) {
    selected.shifter = null;
    calculateTotal();
    return;
  }

  // 🟢 TURN ON
  if (!models[resolvedFile]) return;

  models[resolvedFile].visible = true;
  btn.classList.add("active");
  selected.shifter = resolvedFile;

  calculateTotal();
};

/* ================== WHEELS ================== */
window.selectWheels = (file, btn) => {
  Object.keys(models).forEach(k => {
  if (
    k.includes("Wheels") &&
    models[k]
  ) {
    models[k].visible = false;
  }
});
  clearActive("[onclick^='selectWheels']");
const resolvedFile = resolveModelFile(file);

if (selected.wheels === resolvedFile) {
  selected.wheels = null;
  // 🔴 Wheels kill Vertical Supports (KART)
const vs = "KART_Verticle.glb";

if (selected.addons.has(vs)) {
  selected.addons.delete(vs);
  if (models[vs]) models[vs].visible = false;

  const vsBtn = document.querySelector(
    ".kart-only button[onclick*='KART_Verticle']"
  );
  vsBtn?.classList.remove("active");
}
  calculateTotal();
  return;
} else {
  const resolvedFile = resolveModelFile(file);
  if (!models[resolvedFile]) return;

  // 🟢 TURN ON WHEELS
  models[resolvedFile].visible = true;
  btn.classList.add("active");
  selected.wheels = resolvedFile;

  // 🔴 Wheels kill Vertical Supports immediately (KART)
  if (currentSpec === "kart") {
    const vs = "KART_Verticle.glb";

    if (selected.addons.has(vs)) {
      selected.addons.delete(vs);
      if (models[vs]) models[vs].visible = false;

      const vsBtn = document.querySelector(
        ".kart-only button[onclick*='KART_Verticle']"
      );
      vsBtn?.classList.remove("active");
    }
  }
}

  calculateTotal();
};

/* ================== ADDONS ================== */
window.toggleAddon = (file, btn) => {
  const resolvedFile = resolveModelFile(file);
  if (!models[resolvedFile]) return;

  // 🚫 Vertical Supports behave EXACTLY like PS5
  if (
    resolvedFile === "KART_Verticle.glb" &&
    verticalSupportsBlocked()
  ) {
    return; // silent no-op
  }
// 🔴 Legs kill Vertical Supports immediately
if (resolvedFile === "KART_Legs.glb") {
  const vs = "KART_Verticle.glb";

  if (selected.addons.has(vs)) {
    selected.addons.delete(vs);
    if (models[vs]) models[vs].visible = false;

    const vsBtn = document.querySelector(
      ".kart-only button[onclick*='KART_Verticle']"
    );
    vsBtn?.classList.remove("active");
  }
}
  const on = selected.addons.has(resolvedFile);

  selected.addons[on ? "delete" : "add"](resolvedFile);
  models[resolvedFile].visible = !on;
  btn.classList.toggle("active");

  calculateTotal();
};

window.togglePS5 = btn => {
 // Integrated screens block PS5 (GT + KART)
if (selected.screen?.includes("Integrated")) {
  return; // silent no-op, identical behaviour
}

  const baseFile = "GT_PS5_Holder.glb";
  const resolvedFile = resolveModelFile(baseFile);

  if (!models[resolvedFile]) return;

  const isOn = selected.addons.has(resolvedFile);

  if (isOn) {
    selected.addons.delete(resolvedFile);
    models[resolvedFile].visible = false;
    btn.classList.remove("active");
 } else {
  selected.addons.add(resolvedFile);
  models[resolvedFile].visible = true;
  btn.classList.add("active");

  // 🔴 PS5 kills Vertical Supports (KART)
  if (currentSpec === "kart") {
    const vs = "KART_Verticle.glb";

    if (selected.addons.has(vs)) {
      selected.addons.delete(vs);
      if (models[vs]) models[vs].visible = false;

      const vsBtn = document.querySelector(
        ".kart-only button[onclick*='KART_Verticle']"
      );
      vsBtn?.classList.remove("active");
    }
  }
}

  calculateTotal();
};

/* ================== LOOP ================== */
function animate() {
  requestAnimationFrame(animate);

  updateCameraOffset(); // ← THIS is what you were missing

  controls.update();
  renderer.render(scene, camera);
}

function updateCameraOffset() {
  const ui = document.getElementById("ui");
  if (!ui) return;

  const uiRect = ui.getBoundingClientRect();

  const fullW = window.innerWidth;
  const fullH = window.innerHeight;

  const leftOffset = Math.round(uiRect.right);
  const renderWidth = fullW - leftOffset;

  if (renderWidth <= 0) return;

  renderer.setScissorTest(true);
  renderer.setScissor(leftOffset, 0, renderWidth, fullH);
  renderer.setViewport(leftOffset, 0, renderWidth, fullH);

  camera.aspect = renderWidth / fullH;
  camera.updateProjectionMatrix();
}

animate();
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  updateSceneCenter();
});

/* ================== DEFAULT ================== */
setCockpitColor("silver", document.querySelector(".color.silver"));
calculateTotal();

/* ---------- TOOLTIP SYSTEM (DESKTOP + MOBILE) ---------- */

const tooltip = document.getElementById("tooltip");
let mobileTooltipTimer = null;
let isTouchDevice = false;

/* Detect touch once */
window.addEventListener("touchstart", () => {
  isTouchDevice = true;
}, { once: true });

function positionTooltipFromButton(btn) {
  const rect = document.getElementById("ui").getBoundingClientRect();
  const btnRect = btn.getBoundingClientRect();

  tooltip.style.left = `${rect.right + 12}px`;
  tooltip.style.top = `${btnRect.top + btnRect.height / 2 - tooltip.offsetHeight / 2}px`;

  // Clamp vertically
  const padding = 10;
  const maxTop = window.innerHeight - tooltip.offsetHeight - padding;
  const minTop = padding;

  const currentTop = parseFloat(tooltip.style.top);
  tooltip.style.top = `${Math.max(minTop, Math.min(maxTop, currentTop))}px`;
}

/* Desktop behavior (UNCHANGED) */
document.querySelectorAll("[data-tooltip]").forEach(btn => {
  btn.addEventListener("mouseenter", () => {
 const text = btn.dataset.tooltipText || btn.getAttribute("data-tooltip");
tooltip.innerText = text;

tooltip.classList.toggle(
  "spec-tooltip",
  btn.dataset.tooltipType === "spec"
);
    tooltip.classList.add("show");
  });

  btn.addEventListener("mouseleave", () => {
    tooltip.classList.remove("show");
  });

  btn.addEventListener("mousemove", () => {
    if (isTouchDevice) return;
    positionTooltipFromButton(btn);
  });
});

/* Mobile behavior (TOUCH ONLY, SAME POSITION) */
document.querySelectorAll("[data-tooltip]").forEach(btn => {
  btn.addEventListener("touchstart", e => {
  e.stopPropagation();

    tooltip.classList.remove("show");
    if (mobileTooltipTimer) clearTimeout(mobileTooltipTimer);

    const text = btn.dataset.tooltipText || btn.getAttribute("data-tooltip");
tooltip.innerText = text;

tooltip.classList.toggle(
  "spec-tooltip",
  btn.dataset.tooltipType === "spec"
);

    // 🔑 WAIT ONE FRAME so height is known (NO JUMP)
    requestAnimationFrame(() => {
      positionTooltipFromButton(btn);
      tooltip.classList.add("show");
    });

    mobileTooltipTimer = setTimeout(() => {
      tooltip.classList.remove("show");
    }, 3000);
  });
});

/* Tap anywhere else = kill tooltip */
document.addEventListener("touchstart", () => {
  tooltip.classList.remove("show");
  if (mobileTooltipTimer) clearTimeout(mobileTooltipTimer);
});



window.setCockpitColor = (mode, btn) => {
  cockpitColor = mode;
  clearActive(".color");
  btn.classList.add("active");

  if (mode === "black") {
    scene.background.set(0xf2f2f2);

    document.documentElement.style.backgroundColor = "#f2f2f2";
    document.body.style.backgroundColor = "#f2f2f2";

    ambientLight.intensity = 0.2;
    keyLight.intensity = 1;
  } else {
    scene.background.set(0x1f1f1f);

    document.documentElement.style.backgroundColor = "#1f1f1f";
    document.body.style.backgroundColor = "#1f1f1f";

    ambientLight.intensity = 0.6;
    keyLight.intensity = 14;
  }

  // 🔴 THIS IS THE WHOLE POINT
  updateDisplayedPrices(mode);

  calculateTotal();
};

function updateDisplayedPrices(color) {
  const isBlack = color === "black";

  document.querySelectorAll("[data-price-display]").forEach(btn => {
    const basePrice = Number(btn.dataset.basePrice);
    const blackExtra = Number(btn.dataset.blackExtra || 0);

    const displayPrice = isBlack
      ? basePrice + blackExtra
      : basePrice;

    btn.innerText = `(₹${displayPrice.toLocaleString()})`;
  });
}

/* ================= ORIENTATION CHECK ONLY ================= */

const rotateOverlay = document.getElementById("rotateOverlay");

function checkOrientation() {
  const isPortrait = window.innerHeight > window.innerWidth;

  if (isPortrait) {
    rotateOverlay.classList.add("show");
    document.body.classList.add("loading");
  } else {
    rotateOverlay.classList.remove("show");
    document.body.classList.remove("loading");
  }
}

// Run once
checkOrientation();

// Update on resize / rotate
window.addEventListener("resize", checkOrientation);
window.addEventListener("orientationchange", checkOrientation);

function buildSummaryText() {
  const parts = [];

  // Cockpit
  parts.push(
  currentSpec === "kart"
    ? cockpitColor === "black"
      ? "Kart-Spec – Black"
      : "Kart-Spec – Silver"
    : cockpitColor === "black"
      ? "GT-Spec – Black"
      : "GT-Spec – Silver"
);

  // Screen mount
  if (selected.screen) {
    if (selected.screen.includes("Single") && selected.screen.includes("Integrated"))
      parts.push("Screen Mount – Single Integrated");
    if (selected.screen.includes("Single") && selected.screen.includes("Standalone"))
      parts.push("Screen Mount – Single Standalone");
    if (selected.screen.includes("Triple") && selected.screen.includes("Integrated"))
      parts.push("Screen Mount – Triple Integrated");
    if (selected.screen.includes("Triple") && selected.screen.includes("Standalone"))
      parts.push("Screen Mount – Triple Standalone");
  }

  // Shifter
  if (selected.shifter === "GT_Shifter_Big.glb")
    parts.push("Shifter – Big");
  if (selected.shifter === "GT_Shifter_Small.glb")
    parts.push("Shifter – Small");

  // Wheels
  if (selected.wheels === "GT_Wheels_4.glb")
    parts.push("Castor Wheels – 4");
  if (selected.wheels === "GT_Wheels_6.glb")
    parts.push("Castor Wheels – 6");

  // Add-ons
 selected.addons.forEach(a => {
  // GT
  if (a === "GT_Cupholder.glb") parts.push("Cup Holder");
  if (a === "GT_Headphone_Mount.glb") parts.push("Headset Mount");
  if (a === "GT_PS5_Holder.glb") parts.push("PS5 Holder");
  if (a === "GT_Upgraded_Brackets.glb") parts.push("Upgraded Brackets");

  // KART
  if (a === "KART_Verticle.glb") parts.push("Vertical Supports");
  if (a === "KART_Legs.glb") parts.push("Legs");
  if (a === "KART_Cupholder.glb") parts.push("Cup Holder");
  if (a === "KART_Headphone_Mount.glb") parts.push("Headset Mount");
  if (a === "KART_PS5_Holder.glb") parts.push("PS5 Holder");
});

  return parts;
}
const finalizeBtn = document.getElementById("finalizeBtn");
const overlay = document.getElementById("overlay");
const buildSummary = document.getElementById("buildSummary");
const overlayPrice = document.getElementById("overlayPrice");

finalizeBtn.addEventListener("click", () => {
  // Fill summary
  buildSummary.innerHTML = buildSummaryText()
    .map(p => `• ${p}`)
    .join("<br>");

  // Copy total price
  overlayPrice.innerText =
    document.getElementById("totalPrice").innerText;

  // Show overlay
  overlay.classList.add("show");
});

document.querySelector(".close-overlay")
  .addEventListener("click", () => {
    overlay.classList.remove("show");
  });

  overlay.addEventListener("click", e => {
  if (e.target === overlay) {
    overlay.classList.remove("show");
  }
});
window.switchSpec = (spec, btn) => {
  if (currentSpec === spec) return;

  // GT base
  if (models["GT_Cockpit_Base.glb"]) {
    models["GT_Cockpit_Base.glb"].visible = spec === "gt";
  }

  // KART base
  if (models["KART_Cockpit_Base.glb"]) {
    models["KART_Cockpit_Base.glb"].visible = spec === "kart";
  }
  
// Hide ALL GT parts when entering kart
if (spec === "kart") {

  // 🔴 CLEAR GT SCREEN SELECTION
  if (selected.screen) {
    if (models[selected.screen]) {
      models[selected.screen].visible = false;
    }
    selected.screen = null;
  }

  // 🔴 FORCE HIDE ALL GT MODELS
  Object.keys(models).forEach(k => {
    if (k.startsWith("GT_") && k !== "GT_Cockpit_Base.glb") {
      models[k].visible = false;
    }
  });
}
  // Hide ALL Kart parts when leaving kart
  if (spec === "gt") {
    Object.keys(models).forEach(k => {
      if (k.startsWith("KART_")) {
        models[k].visible = false;
      }
    });
  }

  // Button UI only
  document.querySelectorAll(".spec-btn").forEach(b =>
    b.classList.remove("active")
  );
  btn.classList.add("active");

  currentSpec = spec;
// 🔴 RESET ACTIVE BUTTONS (VISUAL ONLY) — FIRST
clearActive("[onclick^='selectScreen']");
clearActive("[onclick^='selectShifter']");
clearActive("[onclick^='selectWheels']");
clearActive("[onclick^='toggleAddon']");
clearActive("[onclick^='togglePS5']");

// 🔴 RESET SELECTION STATE
selected.screen = null;
selected.shifter = null;
selected.wheels = null;
selected.addons.clear();

document.body.classList.toggle("kart-spec", spec === "kart");

// ✅ KART DEFAULT: Vertical Supports ON (AFTER RESET)
if (spec === "kart") {
  const vs = "KART_Verticle.glb";

  if (models[vs]) {
    models[vs].visible = true;
    selected.addons.add(vs);

    const btn = document.querySelector(
      ".kart-only button[onclick*='KART_Verticle']"
    );
    btn?.classList.add("active"); // 👈 NOW IT STICKS
  }
}
// 🔴 RECALCULATE PRICE
calculateTotal();

// 🔴 FORCE UI TO SCROLL TO TOP
document.getElementById("ui").scrollTop = 0;
};
