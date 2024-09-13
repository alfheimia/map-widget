import jsVectorMap from "jsvectormap";
import "jsvectormap/dist/maps/world.js";

// Get the DOM elements
const form = document.getElementById("color-input-form");
const colorInput = document.getElementById("base-color-input");
const root = document.documentElement;
const toggleButton = document.getElementById("toggle-dark-mode");
const mapContainer = document.getElementById("map");
const clearButton = document.getElementById("clear-btn");

let isDarkMode = false;
let map, baseColor, plainColor, mapBgColor;

// Object to keep track of click counts for each region
let clickCounts = JSON.parse(localStorage.getItem("clickCounts")) || {};
console.log(clickCounts);

// Initialize the map on page load
document.addEventListener("DOMContentLoaded", () => {
  map = initiateMap();
  restoreMap();
});

// Form submission to update base color
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const colorCode = colorInput.value.trim();
  const isValidHex = /^#[0-9A-F]{6}$/i.test(colorCode);

  if (isValidHex) {
    // Update the CSS variable with the new base color
    root.style.setProperty("--MAPBASECOLOR", colorCode);
    baseColor = colorCode;
  } else if (colorCode === "") {
    console.log("Using default color");
  } else {
    alert("Please enter a valid hex color code.");
    return;
  }

  // Re-initialize the map with the new base color
  resetMap();
});

// Dark mode toggle button
toggleButton.addEventListener("click", () => {
  root.classList.toggle("dark-mode");
  isDarkMode = root.classList.contains("dark-mode");

  // Update plainColor and background color on dark mode toggle
  plainColor = getComputedStyle(root)
    .getPropertyValue("--MAPPLAINCOLOR")
    .trim();
  mapBgColor = getComputedStyle(root).getPropertyValue("--MAPBGCOLOR").trim();

  map.setBackgroundColor(mapBgColor);
});

// Reset the map and clear inputs
clearButton.addEventListener("click", () => {
  map.reset();
  colorInput.value = ""; // Clear the color input field
  Object.keys(clickCounts).forEach((code) => (clickCounts[code] = -0.99)); // Reset click counts
  localStorage.removeItem("clickCounts"); // Clear localStorage
});

// Initialize the map
function initiateMap() {
  // Get the CSS variables for map colors
  baseColor = getComputedStyle(root).getPropertyValue("--MAPBASECOLOR").trim();
  plainColor = getComputedStyle(root)
    .getPropertyValue("--MAPPLAINCOLOR")
    .trim();
  mapBgColor = getComputedStyle(root).getPropertyValue("--MAPBGCOLOR").trim();
  isDarkMode = root.classList.contains("dark-mode");

  // Create and configure the map
  return new jsVectorMap({
    map: "world",
    selector: "#map",
    regionsSelectable: true,
    regionStyle: {
      initial: {
        fill: plainColor,
      },
      selected: {
        fill: baseColor,
      },
    },
    onLoaded(map) {
      window.addEventListener("resize", () => {
        map.updateSize();
      });
    },
    zoomOnScroll: false,
    draggable: true,
    showTooltip: true,
    onRegionClick: handleRegionClick,
  });
}

// Handle region click events
function handleRegionClick(event, code) {
  const maxClicks = 5;

  if (!clickCounts[code]) {
    clickCounts[code] = -0.99;
  }

  clickCounts[code] += 1;
  const newColor = darkenColor(baseColor, clickCounts[code], isDarkMode);

  // Update the region color based on clicks
  if (clickCounts[code] <= maxClicks) {
    map.regions[code].element.select(true);
    map.regions[code].element.shape.style.selected = { fill: newColor };
  } else {
    clickCounts[code] = -0.99;
    map.regions[code].element.select(false);
    map.regions[code].element.shape.style.selected = { fill: plainColor };
  }

  console.log(clickCounts);
  // Save click counts to localStorage
  localStorage.setItem("clickCounts", JSON.stringify(clickCounts));
}

// Function to darken or lighten color
function darkenColor(baseColor, clicks, isDarkMode) {
  const factor = Math.max(0, 1 - clicks * 0.15);
  const color = baseColor.replace(/^#/, "");
  const rgb = parseInt(color, 16);

  let r = (rgb >> 16) & 255;
  let g = (rgb >> 8) & 255;
  let b = rgb & 255;

  if (isDarkMode) {
    r = Math.min(255, r + (255 - r) * (1 - factor));
    g = Math.min(255, g + (255 - g) * (1 - factor));
    b = Math.min(255, b + (255 - b) * (1 - factor));
  } else {
    r = Math.floor(r * factor);
    g = Math.floor(g * factor);
    b = Math.floor(b * factor);
  }

  return `rgb(${r}, ${g}, ${b})`;
}

// Function to reset and re-initialize the map
function resetMap() {
  if (map) {
    map.destroy();
    mapContainer.innerHTML = ""; // Clear the map container
  }

  // Reinitialize the map
  map = initiateMap();
}

function restoreMap() {
  if (clickCounts) {
    Object.keys(clickCounts).forEach((code) => {
      if (clickCounts[code] > -0.99) {
        console.log(code + clickCounts[code]);

        const color = darkenColor(baseColor, clickCounts[code], isDarkMode);
        map.regions[code].element.select(true);
        map.regions[code].element.shape.style.selected = { fill: color };
        map.regions[code].element.shape.updateStyle();
        console.log(map.regions[code].element.shape.isSelected);
      }
    });
  }
}

function getRegionCentralCoordinates(map, code) {
  const bbox = map.regions[code].element.shape.getBBox();

  let x = bbox.x + bbox.width / 2;
  let y = bbox.y + bbox.height / 2;

  x = x * map.scale;
  y = y * map.scale;

  const inset = map._mapData.insets;
  const bboxInset = inset[0].bbox;
  const projectionType = map._mapData.projection.type;
  const c = map._mapData.projection.centralMeridian;

  const degRad = 180 / Math.PI;
  const radDeg = Math.PI / 180;
  const radius = 6381372;

  // Inverse the scale and translation
  /*  x = (x - inset[0].left * map.scale) / map.scale;
  y = (y - inset[0].top * map.scale) / map.scale;
 */
  // Inverse normalizes
  x =
    (x / (inset[0].width * map.scale)) * (bboxInset[1].x - bboxInset[0].x) +
    bboxInset[0].x;
  y =
    (y / (inset[0].height * map.scale)) * (bboxInset[1].y - bboxInset[0].y) +
    bboxInset[0].y;

  switch (projectionType) {
    case "mill":
      let lat =
        -(2.5 * Math.atan(Math.exp((0.8 * y) / radius)) - (5 * Math.PI) / 8) *
        degRad;
      let lng = (c * radDeg + x / radius) * degRad;
      return { lat, lng };
    case "merc":
      lat =
        (2.5 * Math.atan(Math.exp((0.8 * y) / radius)) - (5 * Math.PI) / 8) *
        degRad;
      lng = (c * radDeg + x / radius) * degRad;
      return { lat, lng };
    case "aea":
      x = x / radius;
      y = y / radius;
      fi0 = 0;
      lambda0 = c * radDeg;
      fi1 = 29.5 * radDeg;
      fi2 = 45.5 * radDeg;
      n = (Math.sin(fi1) + Math.sin(fi2)) / 2;
      let C = Math.cos(fi1) * Math.cos(fi1) + 2 * n * Math.sin(fi1);
      ro0 = Math.sqrt(C - 2 * n * Math.sin(fi0)) / n;
      ro = Math.sqrt(x * x + (ro0 - y) * (ro0 - y));
      theta = Math.atan(x / (ro0 - y));
      lat = Math.asin((C - ro * ro * n * n) / (2 * n)) * degRad;
      lng = (lambda0 + theta / n) * degRad;
      return { lat, lng };
    case "lcc":
      x = x / radius;
      y = y / radius;
      fi0 = 0;
      lambda0 = c * radDeg;
      fi1 = 33 * radDeg;
      fi2 = 45 * radDeg;
      n =
        Math.log(Math.cos(fi1) * (1 / Math.cos(fi2))) /
        Math.log(
          Math.tan(Math.PI / 4 + fi2 / 2) *
            (1 / Math.tan(Math.PI / 4 + fi1 / 2))
        );
      F = (Math.cos(fi1) * Math.pow(Math.tan(Math.PI / 4 + fi1 / 2), n)) / n;
      ro0 = F * Math.pow(1 / Math.tan(Math.PI / 4 + fi0 / 2), n);
      ro = Math.sgn(n) * Math.sqrt(x * x + (ro0 - y) * (ro0 - y));
      theta = Math.atan(x / (ro0 - y));
      lat = (2 * Math.atan(Math.pow(F / ro, 1 / n)) - Math.PI / 2) * degRad;
      lng = (lambda0 + theta / n) * degRad;
      return { lat, lng };
  }
}
