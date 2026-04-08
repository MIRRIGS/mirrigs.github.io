import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/* ================== PRICING RULES ================== */
const BASE_GT_SILVER = 20000;
const BASE_KART_SILVER = 15000;
const BLACK_UPCHARGE = 2000;
const BLACK_SINGLE_SCREEN_EXTRA = 600;
const BLACK_TRIPLE_SCREEN_EXTRA = 1000;
const BLACK_BIG_SHIFTER_EXTRA = 800;

/* ================== STATE ================== */
let cockpitColor = "silver";
let currentSpec = "gt";
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
    "GT_Monitor_Single_Standalone.glb": 8000,
    "GT_Monitor_Single_Integrated.glb": 6500,
    "GT_Monitor_Triple_Standalone.glb": 13000,
    "GT_Monitor_Triple_Integrated.glb": 10000,
    "KART_Monitor_Single_Standalone.glb": 8000,
    "KART_Monitor_Single_Integrated.glb": 6500,
    "KART_Monitor_Triple_Standalone.glb": 13000,
    "KART_Monitor_Triple_Integrated.glb": 10000
  },
  shifter: {
    "GT_Shifter_Big.glb": 6500,
    "GT_Shifter_Small.glb": 3000,
    "KART_Shifter_Small.glb": 3000
  },
  wheels: {
    "GT_Wheels_4.glb": 4000,
    "GT_Wheels_6.glb": 6000,
    "KART_Wheels_4.glb": 4000,
    "KART_Wheels_6.glb": 6000
  },
  addons: {
    "GT_Cupholder.glb": 1000,
    "GT_Headphone_Mount.glb": 1000,
    "GT_PS5_Holder.glb": 1500,
    "GT_Upgraded_Brackets.glb": 2400,
    "KART_Verticle.glb": 0,
    "KART_Legs.glb": 1500,
    "KART_Cupholder.glb": 1000,
    "KART_Headphone_Mount.glb": 1000,
    "KART_PS5_Holder.glb": 1500
  }
};

/* ================== LAYOUT HELPERS ================== */
const TOPBAR_H = 48;
const BOTTOM_BAR_H = 56;
const UI_WIDTH = 260;
const UI_MARGIN = 20;

function isPortrait() {
  return window.innerHeight > window.innerWidth;
}

function getPortrait3DHeight() {
  return Math.round(window.innerHeight * 0.55) - TOPBAR_H;
}

function applyLayout() {
  if (isPortrait()) {
    const w = window.innerWidth;
    const h = getPortrait3DHeight();
    renderer.setSize(w, h);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, w, h);
    camera.aspect = w / h;
    document.documentElement.style.setProperty("--portrait-3d-h", h + "px");
  } else {
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.documentElement.style.removeProperty("--portrait-3d-h");
  }
  camera.updateProjectionMatrix();
}

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
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

applyLayout();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;
controls.zoomSpeed = 3;
controls.minDistance = 73;
controls.maxDistance = 158;

renderer.domElement.addEventListener('wheel', (e) => {
  controls.zoomSpeed = e.ctrlKey ? 24 : 3;
}, { passive: true, capture: true });
controls.enableDamping = true;
controls.enablePan = false;
controls.minPolarAngle = Math.PI / 4.8;
controls.maxPolarAngle = Math.PI / 1.6;

function updateSceneCenter() {
  controls.addEventListener("start", () => {
    const hint = document.getElementById("orbitHint");
    if (hint) hint.style.opacity = 0;
  });
  controls.target.set(0, 20, 0);
  if (!isPortrait()) {
    camera.position.x = ((UI_WIDTH + UI_MARGIN) - window.innerWidth / 2) * 0.15 + 90;
  } else {
    camera.position.x = 90;
  }
}
updateSceneCenter();

/* ================== LIGHTS ================== */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
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

const files = [
  "GT_Cockpit_Base.glb",
  "KART_Cockpit_Base.glb",
  ...Object.keys(prices.screens),
  ...Object.keys(prices.shifter),
  ...Object.keys(prices.wheels),
  ...Object.keys(prices.addons)
];

const uniqueFiles = [...new Set(files)];

uniqueFiles.forEach(file => {
  loader.load(`models/${file}`, gltf => {
    const obj = gltf.scene;
    if (file.startsWith("GT_")) {
      obj.visible = file === "GT_Cockpit_Base.glb";
    } else if (file.startsWith("KART_")) {
      obj.visible = false;
    }
    scene.add(obj);
    models[file] = obj;
  });
});

/* ================== PRICE CALCULATION ================== */
function calculateTotal() {
  let total = currentSpec === "kart" ? BASE_KART_SILVER : BASE_GT_SILVER;

  if (cockpitColor === "black") total += BLACK_UPCHARGE;

  if (selected.screen) {
    total += prices.screens[selected.screen];
    if (cockpitColor === "black") {
      if (selected.screen.includes("Single")) total += BLACK_SINGLE_SCREEN_EXTRA;
      if (selected.screen.includes("Triple")) total += BLACK_TRIPLE_SCREEN_EXTRA;
    }
  }

  if (selected.shifter) {
    total += prices.shifter[selected.shifter];
    if (cockpitColor === "black" && selected.shifter === "GT_Shifter_Big.glb") {
      total += BLACK_BIG_SHIFTER_EXTRA;
    }
  }

  if (selected.wheels) total += prices.wheels[selected.wheels];

  selected.addons.forEach(a => { total += prices.addons[a]; });

  document.getElementById("totalPrice").innerText = `₹${total.toLocaleString()}`;
}

/* ================== HELPERS ================== */
function clearActive(selector) {
  document.querySelectorAll(selector).forEach(b => b.classList.remove("active"));
}

function killVerticalSupports() {
  const vs = "KART_Verticle.glb";
  if (selected.addons.has(vs)) {
    selected.addons.delete(vs);
    if (models[vs]) models[vs].visible = false;
    document.querySelector(".kart-only button[onclick*='KART_Verticle']")?.classList.remove("active");
  }
}

/* ================== COLOR ================== */
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

  updateDisplayedPrices(mode);
  calculateTotal();
};

function updateDisplayedPrices(color) {
  const isBlack = color === "black";
  document.querySelectorAll("[data-price-display]").forEach(btn => {
    const basePrice = Number(btn.dataset.basePrice);
    const blackExtra = Number(btn.dataset.blackExtra || 0);
    btn.innerText = `(₹${(isBlack ? basePrice + blackExtra : basePrice).toLocaleString()})`;
  });
}

/* ================== SCREENS ================== */
window.selectScreen = (file, btn) => {
  Object.keys(models).forEach(k => {
    if (k.includes("Monitor")) models[k].visible = false;
  });
  clearActive("[onclick^='selectScreen']");

  if (selected.screen === resolveModelFile(file)) {
    selected.screen = null;
    calculateTotal();
    return;
  }

  const resolvedFile = resolveModelFile(file);
  if (!models[resolvedFile]) return;

  models[resolvedFile].visible = true;
  btn.classList.add("active");
  selected.screen = resolvedFile;

  if (resolvedFile.includes("Integrated")) {
    ["GT_PS5_Holder.glb", "KART_PS5_Holder.glb"].forEach(ps5 => {
      selected.addons.delete(ps5);
      if (models[ps5]) models[ps5].visible = false;
    });
    killVerticalSupports();
    document.querySelectorAll("button[onclick^='togglePS5']").forEach(b => b.classList.remove("active"));
  }

  calculateTotal();
};

/* ================== SHIFTERS ================== */
window.selectShifter = (file, btn) => {
  Object.keys(models).forEach(k => {
    if (k.includes("Shifter")) models[k].visible = false;
  });
  clearActive("[onclick^='selectShifter']");

  const resolvedFile = resolveModelFile(file);

  if (selected.shifter === resolvedFile) {
    selected.shifter = null;
    calculateTotal();
    return;
  }

  if (!models[resolvedFile]) return;
  models[resolvedFile].visible = true;
  btn.classList.add("active");
  selected.shifter = resolvedFile;
  calculateTotal();
};

/* ================== WHEELS ================== */
window.selectWheels = (file, btn) => {
  Object.keys(models).forEach(k => {
    if (k.includes("Wheels") && models[k]) models[k].visible = false;
  });
  clearActive("[onclick^='selectWheels']");

  const resolvedFile = resolveModelFile(file);

  if (selected.wheels === resolvedFile) {
    selected.wheels = null;
    killVerticalSupports();
    calculateTotal();
    return;
  }

  if (!models[resolvedFile]) return;
  models[resolvedFile].visible = true;
  btn.classList.add("active");
  selected.wheels = resolvedFile;

  if (currentSpec === "kart") {
    killVerticalSupports();

    const legs = "KART_Legs.glb";
    if (selected.addons.has(legs)) {
      selected.addons.delete(legs);
      if (models[legs]) models[legs].visible = false;
      document.querySelector(".kart-only button[onclick*='KART_Legs']")?.classList.remove("active");
    }
  }

  calculateTotal();
};

/* ================== ADDONS ================== */
window.toggleAddon = (file, btn) => {
  const resolvedFile = resolveModelFile(file);
  if (!models[resolvedFile]) return;

  if (resolvedFile === "KART_Verticle.glb" && verticalSupportsBlocked()) return;

  if (resolvedFile === "KART_Legs.glb") {
    killVerticalSupports();

    if (!selected.addons.has(resolvedFile)) {
      if (selected.wheels) {
        if (models[selected.wheels]) models[selected.wheels].visible = false;
        selected.wheels = null;
        clearActive("[onclick^='selectWheels']");
      }
    }
  }

  const on = selected.addons.has(resolvedFile);
  selected.addons[on ? "delete" : "add"](resolvedFile);
  models[resolvedFile].visible = !on;
  btn.classList.toggle("active");
  calculateTotal();
};

window.togglePS5 = btn => {
  if (selected.screen?.includes("Integrated")) return;

  const resolvedFile = resolveModelFile("GT_PS5_Holder.glb");
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
    if (currentSpec === "kart") killVerticalSupports();
  }

  calculateTotal();
};

/* ================== SPEC SWITCH ================== */
window.switchSpec = (spec, btn) => {
  if (currentSpec === spec) return;

  if (models["GT_Cockpit_Base.glb"]) models["GT_Cockpit_Base.glb"].visible = spec === "gt";
  if (models["KART_Cockpit_Base.glb"]) models["KART_Cockpit_Base.glb"].visible = spec === "kart";

  if (spec === "kart") {
    if (selected.screen && models[selected.screen]) models[selected.screen].visible = false;
    selected.screen = null;
    Object.keys(models).forEach(k => {
      if (k.startsWith("GT_") && k !== "GT_Cockpit_Base.glb") models[k].visible = false;
    });
  }

  if (spec === "gt") {
    Object.keys(models).forEach(k => {
      if (k.startsWith("KART_")) models[k].visible = false;
    });
  }

  document.querySelectorAll(".spec-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  currentSpec = spec;

  clearActive("[onclick^='selectScreen']");
  clearActive("[onclick^='selectShifter']");
  clearActive("[onclick^='selectWheels']");
  clearActive("[onclick^='toggleAddon']");
  clearActive("[onclick^='togglePS5']");

  selected.screen = null;
  selected.shifter = null;
  selected.wheels = null;
  selected.addons.clear();

  document.body.classList.toggle("kart-spec", spec === "kart");

  if (spec === "kart") {
    const vs = "KART_Verticle.glb";
    if (models[vs]) {
      models[vs].visible = true;
      selected.addons.add(vs);
      document.querySelector(".kart-only button[onclick*='KART_Verticle']")?.classList.add("active");
    }
  }

  calculateTotal();
  document.getElementById("ui").scrollTop = 0;
};

/* ================== RENDER LOOP ================== */
function updateCameraOffset() {
  if (isPortrait()) {
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, window.innerWidth, getPortrait3DHeight());
    camera.aspect = window.innerWidth / getPortrait3DHeight();
    camera.updateProjectionMatrix();
    return;
  }

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

function animate() {
  requestAnimationFrame(animate);
  updateCameraOffset();
  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  applyLayout();
  updateSceneCenter();
});

/* ================== DEFAULTS ================== */
setCockpitColor("silver", document.querySelector(".color.silver"));
calculateTotal();

/* ================== TOOLTIP SYSTEM ================== */
const tooltip = document.getElementById("tooltip");
let mobileTooltipTimer = null;
let isTouchDevice = false;

window.addEventListener("touchstart", () => { isTouchDevice = true; }, { once: true });

function positionTooltipFromButton(btn) {
  if (isPortrait()) {
    const uiTop = TOPBAR_H + getPortrait3DHeight();
    const pad = 8;
    const tHeight = tooltip.offsetHeight || 60;
    const tWidth = tooltip.offsetWidth || 200;
    tooltip.style.top = `${uiTop - tHeight - pad}px`;
    tooltip.style.left = `${Math.max(pad, (window.innerWidth - tWidth) / 2)}px`;
    return;
  }

  const rect = document.getElementById("ui").getBoundingClientRect();
  const btnRect = btn.getBoundingClientRect();
  tooltip.style.left = `${rect.right + 12}px`;
  tooltip.style.top = `${btnRect.top + btnRect.height / 2 - tooltip.offsetHeight / 2}px`;

  const padding = 10;
  const maxTop = window.innerHeight - tooltip.offsetHeight - padding;
  const currentTop = parseFloat(tooltip.style.top);
  tooltip.style.top = `${Math.max(padding, Math.min(maxTop, currentTop))}px`;
}

document.querySelectorAll("[data-tooltip]").forEach(btn => {
  btn.addEventListener("mouseenter", () => {
    const text = btn.dataset.tooltipText || btn.getAttribute("data-tooltip");
    tooltip.innerText = text;
    tooltip.classList.toggle("spec-tooltip", btn.dataset.tooltipType === "spec");
    tooltip.classList.add("show");
  });

  btn.addEventListener("mouseleave", () => {
    tooltip.classList.remove("show");
  });

  btn.addEventListener("mousemove", () => {
    if (isTouchDevice) return;
    positionTooltipFromButton(btn);
  });

  btn.addEventListener("touchstart", e => {
    e.stopPropagation();
    tooltip.classList.remove("show");
    if (mobileTooltipTimer) clearTimeout(mobileTooltipTimer);

    const text = btn.dataset.tooltipText || btn.getAttribute("data-tooltip");
    tooltip.innerText = text;
    tooltip.classList.toggle("spec-tooltip", btn.dataset.tooltipType === "spec");

    requestAnimationFrame(() => {
      positionTooltipFromButton(btn);
      tooltip.classList.add("show");
    });

    mobileTooltipTimer = setTimeout(() => {
      tooltip.classList.remove("show");
    }, 3000);
  });
});

document.addEventListener("touchstart", () => {
  tooltip.classList.remove("show");
  if (mobileTooltipTimer) clearTimeout(mobileTooltipTimer);
});

/* ================== FINALIZE OVERLAY ================== */
function buildSummaryText() {
  const parts = [];

  parts.push(
    currentSpec === "kart"
      ? cockpitColor === "black" ? "Kart-Spec – Black" : "Kart-Spec – Silver"
      : cockpitColor === "black" ? "GT-Spec – Black"   : "GT-Spec – Silver"
  );

  if (selected.screen) {
    if (selected.screen.includes("Single") && selected.screen.includes("Integrated"))  parts.push("Screen Mount – Single Integrated");
    if (selected.screen.includes("Single") && selected.screen.includes("Standalone"))  parts.push("Screen Mount – Single Standalone");
    if (selected.screen.includes("Triple") && selected.screen.includes("Integrated"))  parts.push("Screen Mount – Triple Integrated");
    if (selected.screen.includes("Triple") && selected.screen.includes("Standalone"))  parts.push("Screen Mount – Triple Standalone");
  }

  if (selected.shifter === "GT_Shifter_Big.glb")                                       parts.push("Shifter – Pro");
  if (selected.shifter === "GT_Shifter_Small.glb" || selected.shifter === "KART_Shifter_Small.glb") parts.push("Shifter Mount");

  if (selected.wheels?.includes("4")) parts.push("Castor Wheels – 4");
  if (selected.wheels?.includes("6")) parts.push("Castor Wheels – 6");

  selected.addons.forEach(a => {
    if (a === "GT_Cupholder.glb"       || a === "KART_Cupholder.glb")       parts.push("Cup Holder");
    if (a === "GT_Headphone_Mount.glb" || a === "KART_Headphone_Mount.glb") parts.push("Headset Mount");
    if (a === "GT_PS5_Holder.glb"      || a === "KART_PS5_Holder.glb")      parts.push("PS5 Holder");
    if (a === "GT_Upgraded_Brackets.glb")                                   parts.push("Upgraded Brackets");
    if (a === "KART_Verticle.glb")                                          parts.push("Vertical Supports");
    if (a === "KART_Legs.glb")                                              parts.push("Legs");
  });

  return parts;
}

const finalizeBtn = document.getElementById("finalizeBtn");
const overlay     = document.getElementById("overlay");
const buildSummary = document.getElementById("buildSummary");
const overlayPrice = document.getElementById("overlayPrice");

finalizeBtn.addEventListener("click", () => {
  buildSummary.innerHTML = buildSummaryText().map(p => `• ${p}`).join("<br>");
  overlayPrice.innerText = document.getElementById("totalPrice").innerText;
  overlay.classList.add("show");
});

document.querySelector(".close-overlay").addEventListener("click", () => {
  overlay.classList.remove("show");
});

overlay.addEventListener("click", e => {
  if (e.target === overlay) overlay.classList.remove("show");
});

/* ================== DIMENSION BUBBLE ================== */
{
  let _dimSpec   = 'gt';
  let _dimScreen = null; // null | 'single' | 'triple'

  function getDims() {
    const isKart = _dimSpec === 'kart';
    const heightBase       = isKart ? "1'5\""  : "2'1\"";
    const heightWithScreen = isKart ? "3'8\""  : "4'4\"";
    const height = _dimScreen ? heightWithScreen : heightBase;
    const width  = _dimScreen === 'triple' ? "4'5\""
                 : _dimScreen === 'single' ? "2'2\""
                 : "1'11\"";
    return { height, width, length: "4'7\"" };
  }

  const dimBubble = document.createElement('div');
  dimBubble.id = 'dimBubble';
  dimBubble.style.cssText = [
    'position:fixed',
    'right:72px',
    'top:50%',
    'transform:translateY(-50%)',
    'background:rgba(0,0,0,0.55)',
    'border:1.5px solid #1677ff',
    'border-radius:12px',
    'padding:12px 16px',
    'color:#fff',
    'font-family:system-ui,sans-serif',
    'font-size:13px',
    'font-weight:500',
    'line-height:2',
    'white-space:nowrap',
    'pointer-events:none',
    'z-index:10',
    'display:none',
    'backdrop-filter:blur(8px)',
    '-webkit-backdrop-filter:blur(8px)',
    'box-shadow:0 4px 24px rgba(22,119,255,0.15)',
  ].join(';');
  document.body.appendChild(dimBubble);

  function renderBubble() {
    const { height, width, length } = getDims();
    dimBubble.innerHTML =
      `<span style="color:rgba(255,255,255,0.4);font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700">Dimensions</span><br>` +
      `<span style="color:rgba(255,255,255,0.5)">Length</span><span style="color:#fff;font-weight:700;margin-left:8px">${length}</span><br>` +
      `<span style="color:rgba(255,255,255,0.5)">Width &nbsp;</span><span style="color:#fff;font-weight:700;margin-left:8px">${width}</span><br>` +
      `<span style="color:rgba(255,255,255,0.5)">Height</span><span style="color:#fff;font-weight:700;margin-left:8px">${height}</span>`;
  }

  const dimBtn = document.createElement('button');
  dimBtn.id = 'rulerBtn';
  dimBtn.title = 'Toggle dimensions';
  dimBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="10" rx="1.5"/><line x1="6" y1="11" x2="6" y2="14"/><line x1="9" y1="12" x2="9" y2="14"/><line x1="12" y1="11" x2="12" y2="14"/><line x1="15" y1="12" x2="15" y2="14"/><line x1="18" y1="11" x2="18" y2="14"/></svg>`;
  dimBtn.style.cssText = [
    'position:fixed',
    'right:20px',
    'top:50%',
    'transform:translateY(-50%)',
    'width:44px',
    'height:44px',
    'border-radius:50%',
    'background:rgba(20,20,20,0.85)',
    'border:1.5px solid rgba(255,255,255,0.18)',
    'color:rgba(255,255,255,0.6)',
    'cursor:pointer',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'z-index:10',
    'backdrop-filter:blur(6px)',
    '-webkit-backdrop-filter:blur(6px)',
    'transition:border-color 0.2s,color 0.2s,background 0.2s',
  ].join(';');
  document.body.appendChild(dimBtn);

  const dimStyle = document.createElement('style');
  dimStyle.textContent = `
    #rulerBtn:hover  { border-color:rgba(255,255,255,0.45)!important; color:#fff!important; }
    #rulerBtn.active { border-color:#1677ff!important; color:#1677ff!important; background:rgba(22,119,255,0.12)!important; }
    @media (orientation: portrait) {
      #rulerBtn {
        top: calc(48px + (55vh - 48px) * 0.25) !important;
        right: 12px !important;
        transform: none !important;
      }
      #dimBubble {
        top: calc(48px + (55vh - 48px) * 0.25) !important;
        right: 64px !important;
        transform: none !important;
      }
    }
  `;
  document.head.appendChild(dimStyle);

  dimBtn.addEventListener('click', () => {
    const show = dimBubble.style.display === 'none';
    dimBubble.style.display = show ? '' : 'none';
    dimBtn.classList.toggle('active', show);
    if (show) renderBubble();
  });

  const _origSelectScreen = window.selectScreen;
  window.selectScreen = function(file, btn) {
    _origSelectScreen(file, btn);
    const isNowActive = btn.classList.contains('active');
    _dimScreen = isNowActive
      ? (file.includes('Triple') ? 'triple' : 'single')
      : null;
    if (dimBubble.style.display !== 'none') renderBubble();
  };

  const _origSwitchSpec = window.switchSpec;
  window.switchSpec = function(spec, btn) {
    _origSwitchSpec(spec, btn);
    _dimSpec   = spec;
    _dimScreen = null;
    if (dimBubble.style.display !== 'none') renderBubble();
  };
}