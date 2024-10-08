/* import jsVectorMap from "jsvectormap/dist/jsvectormap.js"; */
import "https://cdn.jsdelivr.net/gh/alfheimia/map-widget@main/maps/china.js";
import "https://cdn.jsdelivr.net/gh/alfheimia/map-widget@main/maps/world.js";
import "https://cdn.jsdelivr.net/gh/alfheimia/map-widget@main/maps/us_mill_en.js";

let mapType = "world";

// Get the DOM elements
const form = document.getElementById("color-input-form");
const colorInput = document.getElementById("base-color-input");
const root = document.documentElement;
const toggleButton = document.getElementById("toggle-dark-mode");
const mapContainer = document.getElementById("map");
const clearButton = document.getElementById("clear-btn");
const mapSelector = document.getElementById("map-selector");

let isDarkMode = false;
let map, baseColor, plainColor, mapBgColor;
let clickCounts = {};

// const cookieLength = 3650; // Cookie expiry set to 10 years

// Initialize the map on page load
document.addEventListener("DOMContentLoaded", () => {
  // Restore dark mode from cookies
  // const savedDarkMode = getCookie("isDarkMode");
  const savedDarkMode = getLocalStorageItem("isDarkMode");
  if (savedDarkMode === true) {
    root.classList.add("dark-mode");
    isDarkMode = true;
  }

  // Restore click counts from cookies
  clickCounts = getLocalStorageItem("clickCounts") || {};
  // const savedClickCounts = getCookie("clickCounts");
  /* if (savedClickCounts) {
    clickCounts = JSON.parse(savedClickCounts);
  } */

  // Restore the map selector value from cookies
  const savedMapType = getLocalStorageItem("mapType");
  // const savedMapType = getCookie("mapType");
  if (savedMapType) {
    mapSelector.value = savedMapType;
    mapType = savedMapType;
  }

  // Initialize the map
  map = initiateMap();
  restoreMap(baseColor);
});

// Handle map type change from the select dropdown
mapSelector.addEventListener("change", (event) => {
  const selectedMapType = event.target.value;

  // Only update the map if the selection has changed
  if (mapType !== selectedMapType) {
    mapType = selectedMapType;
    // setCookie("mapType", mapType, cookieLength);
    setLocalStorageItem("mapType", mapType);

    // Reinitialize the map
    resetMap();
    restoreMap(baseColor);
  }
});

// Form submission to update the base color
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const colorCode = colorInput.value.trim();
  const isValidHex = /^#[0-9A-F]{6}$/i.test(colorCode);

  if (isValidHex) {
    // Update the CSS variable for the base map color
    root.style.setProperty("--MAPBASECOLOR", colorCode);
    baseColor = colorCode;

    // Update the map region styles
    map.params.regionStyle.selected.fill = baseColor;

    // Save baseColor to cookies
    // setCookie("baseColor", baseColor, cookieLength);
    setLocalStorageItem("baseColor", baseColor);

    // Reinitialize the map with the new color
    restoreMap(baseColor);
  } else if (colorCode === "") {
    console.log("Using default color");
  } else {
    alert("Please enter a valid hex color code.");
  }
});

// Dark mode toggle button
toggleButton.addEventListener("click", () => {
  root.classList.toggle("dark-mode");
  isDarkMode = root.classList.contains("dark-mode");

  // Save dark mode status to cookies
  // setCookie("isDarkMode", isDarkMode, cookieLength);
  setLocalStorageItem("isDarkMode", isDarkMode);

  // Update map background color based on dark mode
  plainColor = getComputedStyle(root)
    .getPropertyValue("--MAPPLAINCOLOR")
    .trim();
  mapBgColor = getComputedStyle(root).getPropertyValue("--MAPBGCOLOR").trim();

  map.setBackgroundColor(mapBgColor);
});

// Reset the map and clear inputs
clearButton.addEventListener("click", () => {
  clickCounts = {};
  resetMap();
  colorInput.value = ""; // Clear the color input field

  // Clear click counts from cookies
  deleteLocalStorageItem("clickCounts");
  // deleteCookie("clickCounts");
});

// Initialize the map
function initiateMap() {
  // Retrace saved base color
  // let savedBaseColor = getCookie("baseColor") || "";
  let savedBaseColor = getLocalStorageItem("baseColor") || "";
  // let savedBaseColor = localStorage.getItem("baseColor") || "";

  // Retrace mapType
  mapType = getLocalStorageItem("mapType") || "world";
  // mapType = getCookie("mapType") || "world";

  // Change root color if the basecolor exists
  if (savedBaseColor) {
    root.style.setProperty("--MAPBASECOLOR", savedBaseColor);
  }

  // Get the CSS variables for map colors
  baseColor = getComputedStyle(root).getPropertyValue("--MAPBASECOLOR").trim();
  plainColor = getComputedStyle(root)
    .getPropertyValue("--MAPPLAINCOLOR")
    .trim();
  mapBgColor = getComputedStyle(root).getPropertyValue("--MAPBGCOLOR").trim();
  isDarkMode = root.classList.contains("dark-mode");

  // Create and configure the map
  map = new jsVectorMap({
    map: mapType,
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

  restoreMap(baseColor);

  return map;
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

  // Save click counts to localStorage
  // setCookie("clickCounts", JSON.stringify(clickCounts), cookieLength);
  setLocalStorageItem("clickCounts", clickCounts);
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
    clickCounts = {};

    colorInput.value = ""; // Clear the color input field

    // Object.keys(clickCounts).forEach((code) => (clickCounts[code] = -0.99)); // Reset click counts

    // localStorage.removeItem("clickCounts"); // Clear localStorage
    deleteLocalStorageItem("clickCounts");
    // deleteCookie("clickCounts");

    map.destroy();
    mapContainer.innerHTML = ""; // Clear the map container
  }

  // Reinitialize the map
  map = initiateMap();
}

// Function to restore color according to saved clickcount
function restoreMap(baseColor) {
  if (clickCounts) {
    Object.keys(clickCounts).forEach((code) => {
      if (clickCounts[code] > -0.99) {
        const color = darkenColor(baseColor, clickCounts[code], isDarkMode);
        map.regions[code].element.select(true);
        map.regions[code].element.shape.style.selected = { fill: color };
        map.regions[code].element.shape.updateStyle();
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

// Cookie utility functions
function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )};expires=${expires};path=/;SameSite=None;Secure`;
}

function getCookie(name) {
  const nameEQ = name + "=";
  const cookiesArray = document.cookie.split(";");
  for (let cookie of cookiesArray) {
    cookie = cookie.trim();
    if (cookie.startsWith(nameEQ)) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }
  return null;
}

function deleteCookie(name) {
  setCookie(name, "", -1); // Set cookie with a past expiration date to delete it
}

// Local Storage utility functions
function setLocalStorageItem(name, value) {
  // Convert the value to a string and save it in local storage
  const valueToStore =
    typeof value === "object" ? JSON.stringify(value) : value;
  localStorage.setItem(name, valueToStore);
}

function getLocalStorageItem(name) {
  const storedValue = localStorage.getItem(name);

  if (storedValue === null) {
    return null; // Return null if the item does not exist
  }

  // Try to parse the value as JSON
  try {
    return JSON.parse(storedValue);
  } catch (e) {
    // If parsing fails, return the value as a string
    return storedValue;
  }
}

function deleteLocalStorageItem(name) {
  // Remove the item from local storage
  localStorage.removeItem(name);
}

function clearAll() {
  deleteLocalStorageItem("clickCounts");
  deleteLocalStorageItem("baseColor");
  deleteLocalStorageItem("mapType");
  deleteLocalStorageItem("idDarkMode");
  deleteCookie("clickCounts");
  deleteCookie("baseColor");
  deleteCookie("mapType");
  deleteCookie("isDarkMode");
}
