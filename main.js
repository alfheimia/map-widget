import jsVectorMap from "jsvectormap";
import "jsvectormap/dist/maps/world.js";
import getInsetForPoint from "jsvectormap/src/js/core/getInsetForPoint.js";

const baseColor = "#bbdefb";
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
  draggable: true,
  showTooltip: true,
  onLoaded(map) {
    window.addEventListener("resize", () => {
      map.updateSize();
    });
  },
  labels: {
    markers: {
      // Starting from jsvectormap v1.2 the render function receives
      // the marker object as a first parameter and index as the second.
      render(marker, index) {
        return marker.name || marker.labelName || "Not available";
      },
    },
  },
  /* markers: [{ name: "Bangeladesh", coords: [24, 90] }], */
  onRegionClick(event, code) {
    const maxClicks = 5;

    if (!clickCounts[code]) {
      clickCounts[code] = 0;
      /*      const coords = getRegionCentralCoordinates(this, code);
      this.addMarkers({
        name: this.regions[code].config.name,
        coords: [coords.lat, coords.lng],
      }); */
      this.getSelectedMarkers();
    }

    clickCounts[code] += 1;

    const newColor = darkenColor(baseColor, clickCounts[code]);

    // Reset after max number of clicks
    if (clickCounts[code] <= maxClicks) {
      this.regions[code].element.select(true);
      this.regions[code].element.shape.style.selected = { fill: newColor };
    } else {
      clickCounts[code] = 0;

      this.regions[code].element.select(false);
      this.regions[code].element.shape.style.selected = { fill: "#C0C0C0" };
      this.removeMarkers();
    }
  },
});

document.querySelector("#clear-btn").addEventListener("click", () => {
  worldMap.reset();
  Object.keys(clickCounts).forEach((code) => {
    clickCounts[code] = 0;
  });
});

function darkenColor(baseColor, clicks) {
  const factor = Math.max(0, 1 - clicks * 0.12); // Decrease brightness with each click
  const color = baseColor.replace(/^#/, ""); // Remove the # sign from the hex
  const rgb = parseInt(color, 16);
  const r = Math.floor(((rgb >> 16) & 255) * factor);
  const g = Math.floor(((rgb >> 8) & 255) * factor);
  const b = Math.floor((rgb & 255) * factor);
  return `rgb(${r}, ${g}, ${b})`;
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
