/* import jsVectorMap from "jsvectormap/dist/jsvectormap.js"; */
import "https://cdn.jsdelivr.net/gh/alfheimia/map-widget@main/maps/china.js";
import "https://cdn.jsdelivr.net/gh/alfheimia/map-widget@main/maps/world.js";
import "https://cdn.jsdelivr.net/gh/alfheimia/map-widget@main/maps/us_mill_en.js";
import "https://cdn.jsdelivr.net/gh/alfheimia/map-widget@main/maps/spain.js";
import "https://cdn.jsdelivr.net/gh/alfheimia/map-widget@main/maps/canada.js";
import "https://cdn.jsdelivr.net/gh/alfheimia/map-widget@main/maps/russia.js";

let mapType = "world";

// Get the DOM elements
const form = document.getElementById("color-input-form");
const colorInput = document.getElementById("base-color-input");
const root = document.documentElement;
const toggleButton = document.getElementById("toggle-dark-mode");
const mapContainer = document.getElementById("map");
const clearButton = document.getElementById("clear-btn");
const resetButton = document.getElementById("destroy-map-btn");
const mapSelector = document.getElementById("map-selector");

let isDarkMode = false;
let map, baseColor, plainColor, mapBgColor;
let clickCounts = {
  world: {},
  cn_merc: {},
  us_mill_en: {},
  spain: {},
  canada: {},
  russia: {},
};

const cookieLength = 3650; // Cookie expiry set to 10 years

// Initialize the map on page load
document.addEventListener("DOMContentLoaded", () => {
  updateMapTypeFromURL();
  // Restore dark mode from cookies
  const savedDarkMode = getCookie("isDarkMode");
  if (savedDarkMode === "true" || savedDarkMode === true) {
    root.classList.add("dark-mode");
    isDarkMode = true;
  }

  // Restore click counts for all maps from cookies
  const savedWorldClickCounts = getCookie("worldClickCounts");
  const savedUSClickCounts = getCookie("us_mill_enClickCounts");
  const savedChinaClickCounts = getCookie("cn_mercClickCounts");
  const savedSpainClickCounts = getCookie("spainClickCounts");
  const savedCanadaClickCounts = getCookie("canadaClickCounts");
  const savedRussiaClickCounts = getCookie("russiaClickCounts");

  if (savedWorldClickCounts) {
    clickCounts.world = savedWorldClickCounts;
  }
  if (savedUSClickCounts) {
    clickCounts.us_mill_en = savedUSClickCounts;
  }
  if (savedChinaClickCounts) {
    clickCounts.cn_merc = savedChinaClickCounts;
  }
  if (savedSpainClickCounts) {
    clickCounts.spain = savedSpainClickCounts;
  }
  if (savedCanadaClickCounts) {
    clickCounts.canada = savedCanadaClickCounts;
  }
  if (savedRussiaClickCounts) {
    clickCounts.russia = savedRussiaClickCounts;
  }

  // Initialize the map
  map = initiateMap();
  restoreMap(baseColor);
  updateURLWithState();
});

// Listen for popstate events (when user navigates back/forward)
window.addEventListener("popstate", () => {
  updateMapTypeFromURL();
  if (map) {
    map.destroy();
    mapContainer.innerHTML = "";
  }
  map = initiateMap();
  restoreMap(baseColor);

  // Update URL with new state
  updateURLWithState();
});

// Handle map type change from the select dropdown
mapSelector.addEventListener("change", (event) => {
  const selectedMapType = event.target.value;
  if (mapType !== selectedMapType) {
    mapType = selectedMapType;
    setCookie("mapType", mapType, cookieLength);

    if (map) {
      map.destroy();
      mapContainer.innerHTML = "";
    }
    map = initiateMap();
    restoreMap(baseColor);

    // Update URL with new state
    updateURLWithState();
  }
});

// Form submission to update the base color
form.addEventListener("submit", (event) => {
  event.preventDefault();
  console.log("Form submitted");

  const colorCode = colorInput.value.trim();
  const isValidHex = /^#[0-9A-F]{6}$/i.test(colorCode);

  if (isValidHex) {
    // Update the CSS variable for the base map color
    root.style.setProperty("--MAPBASECOLOR", colorCode);
    baseColor = colorCode;

    // Update the map region styles
    map.params.regionStyle.selected.fill = baseColor;

    // Save baseColor to cookies
    setCookie("baseColor", baseColor, cookieLength);

    // Reinitialize the map with the new color
    restoreMap(baseColor);

    // Update URL with new state
    updateURLWithState();
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
  setCookie("isDarkMode", isDarkMode, cookieLength);

  // Update map background color based on dark mode
  plainColor = getComputedStyle(root)
    .getPropertyValue("--MAPPLAINCOLOR")
    .trim();
  mapBgColor = getComputedStyle(root).getPropertyValue("--MAPBGCOLOR").trim();

  map.setBackgroundColor(mapBgColor);

  // Update URL with new state
  updateURLWithState();
});

// Reset the map and clear inputs
clearButton.addEventListener("click", () => {
  resetMap();

  // Update URL with new state
  updateURLWithState();
});

resetButton.addEventListener("click", () => {
  // Reset click counts for all map types
  clickCounts = {
    world: {},
    cn_merc: {},
    us_mill_en: {},
    spain: {},
    canada: {},
    russia: {}, // Add this line
  };

  // Clear all related cookies
  deleteCookie("worldClickCounts");
  deleteCookie("cn_mercClickCounts");
  deleteCookie("us_mill_enClickCounts");
  deleteCookie("spainClickCounts");
  deleteCookie("canadaClickCounts");
  deleteCookie("russiaClickCounts");
  deleteCookie("baseColor");
  deleteCookie("mapType");
  deleteCookie("isDarkMode");

  // Reset color input
  colorInput.value = "";

  // Reset base color to default
  baseColor = getComputedStyle(root).getPropertyValue("--MAPBASECOLOR").trim();
  root.style.setProperty("--MAPBASECOLOR", baseColor);

  // Reset dark mode
  isDarkMode = false;
  root.classList.remove("dark-mode");

  // Reset map type to default (world)
  mapType = "world";
  mapSelector.value = "world";

  // Reset and reinitialize the map
  if (map) {
    map.destroy();
    mapContainer.innerHTML = "";
  }
  map = initiateMap();

  console.log("All settings and click counts reset to default");

  // Update URL with new state
  updateURLWithState();
});

// Initialize the map
function initiateMap() {
  // Retrace saved base color
  let savedBaseColor = getCookie("baseColor") || "";

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

  // Update URL with new state
  updateURLWithState();

  return map;
}

// Handle region click events
function handleRegionClick(event, code) {
  const maxClicks = 5;

  if (clickCounts[mapType][code] === undefined) {
    clickCounts[mapType][code] = -0.99;
  }

  clickCounts[mapType][code] += 1;
  const newColor = darkenColor(
    baseColor,
    clickCounts[mapType][code],
    isDarkMode
  );

  // Update the region color based on clicks
  if (clickCounts[mapType][code] <= maxClicks) {
    map.regions[code].element.select(true);
    map.regions[code].element.shape.style.selected = { fill: newColor };
  } else {
    clickCounts[mapType][code] = -0.99;
    map.regions[code].element.select(false);
    map.regions[code].element.shape.style.selected = { fill: plainColor };
  }

  // Save click counts to cookies for the current map type
  setCookie(
    `${mapType}ClickCounts`,
    JSON.stringify(clickCounts[mapType]),
    cookieLength
  );

  updateURLWithState();
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
    clickCounts[mapType] = {};

    colorInput.value = ""; // Clear the color input field

    // Clear the cookie for the current map type
    deleteCookie(`${mapType}ClickCounts`);

    map.destroy();
    mapContainer.innerHTML = ""; // Clear the map container
  }

  // Reinitialize the map
  map = initiateMap();
}

// Function to restore color according to saved clickcount
function restoreMap(baseColor) {
  if (clickCounts && clickCounts[mapType]) {
    Object.keys(clickCounts[mapType]).forEach((code) => {
      if (
        clickCounts[mapType][code] !== undefined &&
        clickCounts[mapType][code] > -0.99
      ) {
        const color = darkenColor(
          baseColor,
          clickCounts[mapType][code],
          isDarkMode
        );
        if (map.regions[code]) {
          map.regions[code].element.select(true);
          map.regions[code].element.shape.style.selected = { fill: color };
          map.regions[code].element.shape.updateStyle();
        }
      }
    });
  }

  // Update URL with new state
  updateURLWithState();
}

// Function to update mapType based on URL parameter
function updateMapTypeFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const encodedState = urlParams.get("state");

  if (encodedState) {
    const state = decodeMapState(encodedState);
    if (state) {
      mapType = state.mapType;
      isDarkMode = state.isDarkMode;
      baseColor = state.baseColor;
      clickCounts[mapType] = state.clickCounts;

      // Apply dark mode
      if (isDarkMode) {
        root.classList.add("dark-mode");
      } else {
        root.classList.remove("dark-mode");
      }

      // Apply base color
      root.style.setProperty("--MAPBASECOLOR", baseColor);

      // Update map selector
      mapSelector.value = mapType;

      return mapType;
    }
  }

  // Fall back to original behavior if no valid state is found
  const urlMapType = urlParams.get("map");
  if (
    urlMapType &&
    mapSelector.querySelector(`option[value="${urlMapType}"]`)
  ) {
    mapType = urlMapType;
  } else {
    mapType = "world";
  }
  mapSelector.value = mapType;
  return mapType;
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
      const value = decodeURIComponent(cookie.substring(nameEQ.length));
      // Parse JSON for click counts
      if (name.endsWith("ClickCounts")) {
        return JSON.parse(value);
      }
      return value;
    }
  }
  return null;
}

function deleteCookie(name) {
  setCookie(name, "", -1); // Set cookie with a past expiration date to delete it
}

function clearAll() {
  deleteCookie("clickCounts");
  deleteCookie("baseColor");
  deleteCookie("mapType");
  deleteCookie("isDarkMode");
}

function encodeMapState() {
  const state = {
    mapType,
    isDarkMode,
    baseColor,
    clickCounts: clickCounts[mapType],
  };
  return btoa(JSON.stringify(state)); // Base64 encode the state
}

function decodeMapState(encodedState) {
  try {
    return JSON.parse(atob(encodedState));
  } catch (error) {
    console.error("Failed to decode map state:", error);
    return null;
  }
}

function updateURLWithState() {
  const encodedState = encodeMapState();
  const url = new URL(window.location);
  url.searchParams.set("state", encodedState);
  window.history.replaceState({}, "", url);
}
