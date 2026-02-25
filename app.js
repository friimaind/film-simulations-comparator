const imagesBasePath = "images";

const subjectSelect = document.getElementById("subjectSelect");
const baseSelect = document.getElementById("baseSelect");
const compareSelect = document.getElementById("compareSelect");
const beforeAfterFullWidthToggle = document.getElementById("beforeAfterFullWidthToggle");
const magnifierZoomSelect = document.getElementById("magnifierZoomSelect");
const magnifierZoomField = document.getElementById("magnifierZoomField");
const splitRange = document.getElementById("splitRange");
const compareMask = document.getElementById("compareMask");
const handle = document.getElementById("handle");
const baseImage = document.getElementById("baseImage");
const compareImage = document.getElementById("compareImage");
const sideBaseImage = document.getElementById("sideBaseImage");
const sideCompareImage = document.getElementById("sideCompareImage");
const sideBaseStage = document.getElementById("sideBaseStage");
const sideCompareStage = document.getElementById("sideCompareStage");
const sideBaseMagnifier = document.getElementById("sideBaseMagnifier");
const sideCompareMagnifier = document.getElementById("sideCompareMagnifier");
const baseBadgeTop = document.getElementById("baseBadgeTop");
const compareBadgeTop = document.getElementById("compareBadgeTop");
const baseBadge = document.getElementById("baseBadge");
const compareBadge = document.getElementById("compareBadge");
const sideBaseLabel = document.getElementById("sideBaseLabel");
const sideCompareLabel = document.getElementById("sideCompareLabel");
const viewToggle = document.getElementById("viewToggle");
const beforeAfterView = document.getElementById("beforeAfterView");
const sideBySideView = document.getElementById("sideBySideView");
const imageStage = document.getElementById("imageStage");

let imagesBySubject = new Map();
let parsedImages = [];
let isSideBySide = false;
const SIDE_MAGNIFIER_SIZE = 170;
let sideMagnifierZoom = 2;
let beforeAfterFullWidthPreference = false;

function prettyName(value) {
  return value
    .replace(/^eternabb$/, "eterna-bb")
    .split("-")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function parseImage(fileName) {
  const base = fileName.replace(/\.jpg$/i, "");
  const parts = base.split("_");

  if (parts.length < 3 || parts[0] !== "simulation") {
    return null;
  }

  return {
    fileName,
    subject: parts[1],
    simulation: parts.slice(2).join("_"),
  };
}

function buildMap(files) {
  parsedImages = files.map(parseImage).filter(Boolean);

  const map = new Map();

  for (const image of parsedImages) {
    if (!map.has(image.subject)) {
      map.set(image.subject, []);
    }
    map.get(image.subject).push(image);
  }

  for (const [subject, items] of map) {
    items.sort((a, b) => a.simulation.localeCompare(b.simulation));
    map.set(subject, items);
  }

  imagesBySubject = map;
}

function fillSelect(selectEl, items, selectedValue) {
  selectEl.innerHTML = "";

  for (const item of items) {
    const option = document.createElement("option");
    option.value = item.fileName;
    option.textContent = prettyName(item.simulation);

    if (item.fileName === selectedValue) {
      option.selected = true;
    }

    selectEl.append(option);
  }
}

function setComparisonPosition(percent) {
  const safePercent = Math.max(0, Math.min(100, Number(percent)));
  compareMask.style.clipPath = `inset(0 0 0 ${safePercent}%)`;
  handle.style.left = `${safePercent}%`;
}

function hideSideMagnifiers() {
  sideBaseMagnifier.classList.add("hidden");
  sideCompareMagnifier.classList.add("hidden");
}

function syncLensZoomControlState() {
  magnifierZoomSelect.disabled = !isSideBySide;
  magnifierZoomField.dataset.disabled = String(!isSideBySide);
}

function syncBeforeAfterWidthMode() {
  const isFullWidth = beforeAfterFullWidthToggle.checked;
  beforeAfterView.classList.toggle("before-after-full", isFullWidth);
  beforeAfterView.classList.toggle("before-after-boxed", !isFullWidth);
}

function syncFullWidthControlState() {
  beforeAfterFullWidthToggle.disabled = isSideBySide;
}

function renderSideMagnifier(stageEl, lensEl, imageEl, ratioX, ratioY) {
  const width = stageEl.clientWidth;
  const height = stageEl.clientHeight;
  if (!width || !height || !imageEl?.src) {
    lensEl.classList.add("hidden");
    return;
  }

  const focusX = ratioX * width;
  const focusY = ratioY * height;
  const lensLeft = Math.max(0, Math.min(width - SIDE_MAGNIFIER_SIZE, focusX - SIDE_MAGNIFIER_SIZE / 2));
  const lensTop = Math.max(0, Math.min(height - SIDE_MAGNIFIER_SIZE, focusY - SIDE_MAGNIFIER_SIZE / 2));
  const bgX = -focusX * sideMagnifierZoom + SIDE_MAGNIFIER_SIZE / 2;
  const bgY = -focusY * sideMagnifierZoom + SIDE_MAGNIFIER_SIZE / 2;

  lensEl.style.left = `${lensLeft}px`;
  lensEl.style.top = `${lensTop}px`;
  lensEl.style.backgroundImage = `url("${imageEl.src}")`;
  lensEl.style.backgroundSize = `${width * sideMagnifierZoom}px ${height * sideMagnifierZoom}px`;
  lensEl.style.backgroundPosition = `${bgX}px ${bgY}px`;
  lensEl.classList.remove("hidden");
}

function syncSideMagnifiers(event, sourceStage) {
  if (!isSideBySide) {
    hideSideMagnifiers();
    return;
  }

  const bounds = sourceStage.getBoundingClientRect();
  if (!bounds.width || !bounds.height) {
    hideSideMagnifiers();
    return;
  }

  const ratioX = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
  const ratioY = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));

  renderSideMagnifier(sideBaseStage, sideBaseMagnifier, sideBaseImage, ratioX, ratioY);
  renderSideMagnifier(sideCompareStage, sideCompareMagnifier, sideCompareImage, ratioX, ratioY);
}

function syncStageRatioFromImage(imageEl) {
  if (!imageEl || !imageEl.naturalWidth || !imageEl.naturalHeight) {
    return;
  }

  imageStage.style.setProperty("--stage-ratio", `${imageEl.naturalWidth} / ${imageEl.naturalHeight}`);
}

function updateImages() {
  hideSideMagnifiers();

  const baseFile = baseSelect.value;
  const compareFile = compareSelect.value;
  const basePath = `${imagesBasePath}/${baseFile}`;
  const comparePath = `${imagesBasePath}/${compareFile}`;

  baseImage.onload = () => syncStageRatioFromImage(baseImage);
  compareImage.onload = () => syncStageRatioFromImage(compareImage);
  baseImage.src = basePath;
  compareImage.src = comparePath;
  sideBaseImage.src = basePath;
  sideCompareImage.src = comparePath;

  if (baseImage.complete) {
    syncStageRatioFromImage(baseImage);
  }
  if (compareImage.complete) {
    syncStageRatioFromImage(compareImage);
  }

  const baseText = prettyName(parseImage(baseFile).simulation);
  const compareText = prettyName(parseImage(compareFile).simulation);

  baseBadgeTop.textContent = `BASE - ${baseText}`;
  compareBadgeTop.textContent = `COMPARISON - ${compareText}`;
  baseBadge.textContent = `BASE - ${baseText}`;
  compareBadge.textContent = `COMPARISON - ${compareText}`;
  sideBaseLabel.textContent = `BASE - ${baseText}`;
  sideCompareLabel.textContent = `COMPARISON - ${compareText}`;
}

function populateSimulationSelects(subject) {
  const subjectImages = imagesBySubject.get(subject) || [];

  if (!subjectImages.length) {
    return;
  }

  const baseCurrent = subjectImages.find((i) => i.fileName === baseSelect.value)
    ? baseSelect.value
    : subjectImages[0].fileName;

  let compareCurrent = subjectImages.find((i) => i.fileName === compareSelect.value)
    ? compareSelect.value
    : subjectImages[1]?.fileName || subjectImages[0].fileName;

  if (compareCurrent === baseCurrent && subjectImages.length > 1) {
    compareCurrent = subjectImages.find((i) => i.fileName !== baseCurrent).fileName;
  }

  fillSelect(baseSelect, subjectImages, baseCurrent);
  fillSelect(compareSelect, subjectImages, compareCurrent);

  updateImages();
}

function populateSubjects() {
  subjectSelect.innerHTML = "";

  const subjects = Array.from(imagesBySubject.keys()).sort((a, b) => a.localeCompare(b));

  for (const subject of subjects) {
    const option = document.createElement("option");
    option.value = subject;
    option.textContent = subject.replace(/-/g, " ");
    subjectSelect.append(option);
  }

  if (subjects.length) {
    subjectSelect.value = subjects[0];
    populateSimulationSelects(subjects[0]);
  }
}

function enforceDifferentSelections(changedSelect, otherSelect) {
  if (changedSelect.value !== otherSelect.value) {
    return;
  }

  const options = Array.from(otherSelect.options).map((opt) => opt.value);
  const alternative = options.find((value) => value !== changedSelect.value);

  if (alternative) {
    otherSelect.value = alternative;
  }
}

function toggleView() {
  isSideBySide = !isSideBySide;
  hideSideMagnifiers();
  syncLensZoomControlState();
  syncFullWidthControlState();

  if (isSideBySide) {
    beforeAfterFullWidthPreference = beforeAfterFullWidthToggle.checked;
    beforeAfterFullWidthToggle.checked = true;
    syncBeforeAfterWidthMode();
  } else {
    beforeAfterFullWidthToggle.checked = beforeAfterFullWidthPreference;
    syncBeforeAfterWidthMode();
  }

  beforeAfterView.classList.toggle("hidden", isSideBySide);
  sideBySideView.classList.toggle("hidden", !isSideBySide);

  viewToggle.setAttribute("aria-pressed", String(isSideBySide));
  viewToggle.textContent = isSideBySide
    ? "Switch to: Before / After"
    : "Switch to: Side by side";
}

function wireEvents() {
  subjectSelect.addEventListener("change", () => {
    populateSimulationSelects(subjectSelect.value);
  });

  baseSelect.addEventListener("change", () => {
    enforceDifferentSelections(baseSelect, compareSelect);
    updateImages();
  });

  compareSelect.addEventListener("change", () => {
    enforceDifferentSelections(compareSelect, baseSelect);
    updateImages();
  });

  magnifierZoomSelect.addEventListener("change", () => {
    const nextZoom = Number(magnifierZoomSelect.value);
    if (!Number.isFinite(nextZoom) || nextZoom <= 0) {
      return;
    }
    sideMagnifierZoom = nextZoom;
    hideSideMagnifiers();
  });

  beforeAfterFullWidthToggle.addEventListener("change", syncBeforeAfterWidthMode);

  splitRange.addEventListener("input", (event) => {
    setComparisonPosition(event.target.value);
  });

  sideBaseStage.addEventListener("pointermove", (event) => syncSideMagnifiers(event, sideBaseStage));
  sideCompareStage.addEventListener("pointermove", (event) => syncSideMagnifiers(event, sideCompareStage));
  sideBaseStage.addEventListener("pointerleave", hideSideMagnifiers);
  sideCompareStage.addEventListener("pointerleave", hideSideMagnifiers);

  // Allow drag directly on the stage for faster desktop/mobile interaction.
  imageStage.addEventListener("pointerdown", (event) => {
    const bounds = imageStage.getBoundingClientRect();

    const setFromPointer = (clientX) => {
      const raw = ((clientX - bounds.left) / bounds.width) * 100;
      const percent = Math.max(0, Math.min(100, raw));
      splitRange.value = percent.toFixed(2);
      setComparisonPosition(percent);
    };

    setFromPointer(event.clientX);

    const onMove = (moveEvent) => setFromPointer(moveEvent.clientX);
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  });

  viewToggle.addEventListener("click", toggleView);
}

function init() {
  const files = window.IMAGES_MANIFEST;
  if (!Array.isArray(files)) {
    throw new Error("Image manifest not available");
  }

  sideMagnifierZoom = Number(magnifierZoomSelect.value) || 2;
  beforeAfterFullWidthToggle.checked = false;
  beforeAfterFullWidthPreference = false;
  buildMap(files);
  populateSubjects();
  setComparisonPosition(Number(splitRange.value));
  hideSideMagnifiers();
  syncLensZoomControlState();
  syncFullWidthControlState();
  syncBeforeAfterWidthMode();
  wireEvents();
}

try {
  init();
} catch (error) {
  console.error(error);
  viewToggle.disabled = true;
  subjectSelect.disabled = true;
  baseSelect.disabled = true;
  compareSelect.disabled = true;
  beforeAfterView.innerHTML = '<p style="padding: 1rem;">Error loading image manifest.</p>';
}
