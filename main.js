import jsVectorMap from "jsvectormap";
import "jsvectormap/dist/maps/world.js";

const baseColor = "#bee3db";
const clickCounts = {};

// Object to keep track of click counts for each regiom

let worldMap = new jsVectorMap({
  map: "world",
  selector: "#map",
  regionsSelectable: true,
  regionsSelectableOne: false,
  regionStyle: {
    initial: {
      fill: "#C0C0C0",
      fontFamily: "PT Sans",
      fillOpacity: 1,
    },
    selected: {
      fill: baseColor,
    },
  },
  markers: [{ name: "Egypt", coords: [26.8206, 30.8025] }],
  draggable: true,
  showTooltip: true,
  onLoaded(map) {
    window.addEventListener("resize", () => {
      map.updateSize();
    });
  },
  onRegionClick(event, code) {
    const maxClicks = 5;

    if (!clickCounts[code]) {
      clickCounts[code] = 0;
    }

    clickCounts[code] += 1;

    const newColor = darkenColor(baseColor, clickCounts[code]);

    // Reset after max number of clicks
    if (clickCounts[code] <= maxClicks) {
      worldMap.regions[code].element.select(true);
      worldMap.regions[code].element.shape.style.selected = { fill: newColor };
    } else {
      clickCounts[code] = 0;

      worldMap.regions[code].element.select(false);
      worldMap.regions[code].element.shape.style.selected = { fill: "#C0C0C0" };
      worldMap.removeMarkers();
    }
  },
});

document.querySelector("#clear-btn").addEventListener("click", () => {
  worldMap.reset();
});

function darkenColor(baseColor, clicks) {
  const factor = Math.max(0.6, 1 - clicks * 0.08); // Decrease brightness with each click
  const color = baseColor.replace(/^#/, ""); // Remove the # sign from the hex
  const rgb = parseInt(color, 16);
  const r = Math.floor(((rgb >> 16) & 255) * factor);
  const g = Math.floor(((rgb >> 8) & 255) * factor);
  const b = Math.floor((rgb & 255) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}
