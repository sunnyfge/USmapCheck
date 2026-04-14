import { useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { geoCentroid } from "d3-geo";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

const US_GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";
const EUROPE_GEO_URL =
  "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";
const STORAGE_KEY_US = "visited-us-states";
const STORAGE_KEY_EUROPE = "visited-europe-countries";
const DEFAULT_VISITED = ["Texas", "New Jersey"];
const DEFAULT_VISITED_EUROPE = [];
const VISITED_COLOR = "#10B981";
const HOVER_VISITED_COLOR = "#059669";
const TAB_US = "us";
const TAB_EUROPE = "europe";
const REGION_BY_STATE = {
  Connecticut: "Northeast",
  Maine: "Northeast",
  Massachusetts: "Northeast",
  "New Hampshire": "Northeast",
  "Rhode Island": "Northeast",
  Vermont: "Northeast",
  "New Jersey": "Northeast",
  "New York": "Northeast",
  Pennsylvania: "Northeast",
  Illinois: "Midwest",
  Indiana: "Midwest",
  Michigan: "Midwest",
  Ohio: "Midwest",
  Wisconsin: "Midwest",
  Iowa: "Midwest",
  Kansas: "Midwest",
  Minnesota: "Midwest",
  Missouri: "Midwest",
  Nebraska: "Midwest",
  "North Dakota": "Midwest",
  "South Dakota": "Midwest",
  Delaware: "South",
  Florida: "South",
  Georgia: "South",
  Maryland: "South",
  "North Carolina": "South",
  "South Carolina": "South",
  Virginia: "South",
  "West Virginia": "South",
  Alabama: "South",
  Kentucky: "South",
  Mississippi: "South",
  Tennessee: "South",
  Arkansas: "South",
  Louisiana: "South",
  Oklahoma: "South",
  Texas: "South",
  Arizona: "West",
  Colorado: "West",
  Idaho: "West",
  Montana: "West",
  Nevada: "West",
  "New Mexico": "West",
  Utah: "West",
  Wyoming: "West",
  Alaska: "West",
  California: "West",
  Hawaii: "West",
  Oregon: "West",
  Washington: "West",
};
const REGION_COLORS = {
  Northeast: { default: "#d9e6ff", visited: "#4a90ff", hoverDefault: "#c7dbff", hoverVisited: "#3a7be0" }, // powder blue
  Midwest: { default: "#d9f3df", visited: "#36b36a", hoverDefault: "#c7ebcf", hoverVisited: "#2f9a5b" }, // powder green
  South: { default: "#fff1bd", visited: "#f2b705", hoverDefault: "#ffe79a", hoverVisited: "#d89f00" }, // powder yellow
  West: { default: "#ffd8eb", visited: "#f06292", hoverDefault: "#ffc4df", hoverVisited: "#db4d7f" }, // powder pink
};
const STATE_ABBR = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
};

const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];

const EUROPE_COUNTRIES = [
  "Albania",
  "Andorra",
  "Austria",
  "Belarus",
  "Belgium",
  "Bosnia and Herzegovina",
  "Bulgaria",
  "Croatia",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Estonia",
  "Finland",
  "United Kingdom",
  "France",
  "Germany",
  "Spain",
  "Italy",
  "Switzerland",
  "Portugal",
  "Netherlands",
  "Poland",
  "Ireland",
  "Norway",
  "Sweden",
  "Greece",
  "Romania",
  "Hungary",
  "Iceland",
  "Kosovo",
  "Latvia",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Malta",
  "Moldova",
  "Monaco",
  "Montenegro",
  "North Macedonia",
  "San Marino",
  "Serbia",
  "Slovakia",
  "Slovenia",
  "Ukraine",
  "Vatican",
];

function getGeoName(geo) {
  return (
    geo?.properties?.name ||
    geo?.properties?.NAME ||
    geo?.properties?.NAME_EN ||
    geo?.properties?.ADMIN ||
    geo?.properties?.admin ||
    ""
  );
}

function normalizeVisited(items, allowedList) {
  const cleaned = Array.isArray(items)
    ? items.filter((item) => allowedList.includes(item))
    : [];
  return [...new Set(cleaned)];
}

function getVisitedFromUrl(allowedList) {
  try {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("visited")) return { hasParam: false, items: [] };
    const shared = params.get("visited") ?? "";

    const items = shared.split(",").map((item) => decodeURIComponent(item.trim()));

    return { hasParam: true, items: normalizeVisited(items, allowedList) };
  } catch {
    return { hasParam: false, items: [] };
  }
}

function getInitialVisited(storageKey, defaultList, allowedList) {
  const visitedFromUrl = getVisitedFromUrl(allowedList);
  if (visitedFromUrl.hasParam) {
    localStorage.setItem(storageKey, JSON.stringify(visitedFromUrl.items));
    return visitedFromUrl.items;
  }

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return defaultList;
    const parsed = JSON.parse(raw);
    const normalized = normalizeVisited(parsed, allowedList);
    return normalized.length > 0 ? normalized : defaultList;
  } catch {
    return defaultList;
  }
}

export default function App() {
  const mapCaptureRef = useRef(null);
  const [activeTab, setActiveTab] = useState(TAB_US);
  const [visitedUS, setVisitedUS] = useState(() =>
    getInitialVisited(STORAGE_KEY_US, DEFAULT_VISITED, US_STATES)
  );
  const [visitedEurope, setVisitedEurope] = useState(() =>
    getInitialVisited(STORAGE_KEY_EUROPE, DEFAULT_VISITED_EUROPE, EUROPE_COUNTRIES)
  );
  const [shareMessage, setShareMessage] = useState("");
  const isUS = activeTab === TAB_US;
  const currentItems = isUS ? US_STATES : EUROPE_COUNTRIES;
  const currentVisited = isUS ? visitedUS : visitedEurope;
  const currentVisitedSet = useMemo(() => new Set(currentVisited), [currentVisited]);
  const visitedPercentage = Math.round((currentVisited.length / currentItems.length) * 100);
  const visitedParam = currentVisited
    .map((item) => encodeURIComponent(item))
    .sort()
    .join(",");
  const shareUrl = `${window.location.origin}${window.location.pathname}?map=${activeTab}&visited=${visitedParam}`;

  const toggleItem = (itemName) => {
    if (!itemName || !currentItems.includes(itemName)) return;

    const setter = isUS ? setVisitedUS : setVisitedEurope;
    const storageKey = isUS ? STORAGE_KEY_US : STORAGE_KEY_EUROPE;
    setter((current) => {
      const next = current.includes(itemName)
        ? current.filter((name) => name !== itemName)
        : [...current, itemName];
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: isUS ? "My US Travel Map" : "My Europe Travel Map",
          text: `我已造訪 ${currentVisited.length}/${currentItems.length} ${
            isUS ? "州" : "國家"
          }，來看看我的足跡！`,
          url: shareUrl,
        });
        setShareMessage("已開啟分享面板！");
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setShareMessage("已複製分享網址！");
    } catch {
      setShareMessage(`請手動複製：${shareUrl}`);
    }
  };

  const handleDownloadImage = async () => {
    if (!mapCaptureRef.current) return;

    try {
      const dataUrl = await toPng(mapCaptureRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `${activeTab}-travel-map-${currentVisited.length}.png`;
      link.href = dataUrl;
      link.click();
      setShareMessage("已下載圖片！");
    } catch {
      setShareMessage("下載失敗，請稍後再試。");
    }
  };

  const handleClearAll = () => {
    if (isUS) {
      setVisitedUS([]);
      localStorage.setItem(STORAGE_KEY_US, JSON.stringify([]));
    } else {
      setVisitedEurope([]);
      localStorage.setItem(STORAGE_KEY_EUROPE, JSON.stringify([]));
    }
    setShareMessage("");
  };

  return (
    <div className="page">
      <main className="layout">
        <section className="map-panel" ref={mapCaptureRef}>
          <div className="tab-row">
            <button
              type="button"
              className={`tab-button ${isUS ? "active" : ""}`}
              onClick={() => setActiveTab(TAB_US)}
            >
              美國地圖
            </button>
            <button
              type="button"
              className={`tab-button ${!isUS ? "active" : ""}`}
              onClick={() => setActiveTab(TAB_EUROPE)}
            >
              歐洲地圖
            </button>
          </div>
          <h1>{isUS ? "US Visited States Map" : "Europe Visited Countries Map"}</h1>
          <p>
            {isUS
              ? "Click a state on the map, or check from the list."
              : "Click a country on the map, or check from the list."}
          </p>
          <div className="share-row">
            <button type="button" className="share-button" onClick={handleShare}>
              分享我的足跡
            </button>
            <button type="button" className="share-button secondary" onClick={handleDownloadImage}>
              下載圖片
            </button>
            {shareMessage ? <span className="share-message">{shareMessage}</span> : null}
          </div>

          <ComposableMap
            projection={isUS ? "geoAlbersUsa" : "geoMercator"}
            projectionConfig={isUS ? undefined : { scale: 430, center: [15, 52] }}
            className="us-map"
          >
            <Geographies geography={isUS ? US_GEO_URL : EUROPE_GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const geoName = getGeoName(geo);
                  if (!geoName) return null;
                  if (!isUS && !EUROPE_COUNTRIES.includes(geoName)) return null;
                  const isVisited = currentVisitedSet.has(geoName);
                  const abbreviation = isUS ? STATE_ABBR[geoName] : null;
                  const centroid = geoCentroid(geo);
                  const region = REGION_BY_STATE[geoName] ?? "Northeast";
                  const palette = REGION_COLORS[region];
                  const defaultFill = isUS ? palette.default : "#1f2937";
                  const hoverDefault = isUS ? palette.hoverDefault : "#334155";

                  return (
                    <g key={geo.rsmKey}>
                      <Geography
                        geography={geo}
                        onClick={() => toggleItem(geoName)}
                        style={{
                          default: {
                            fill: isVisited ? VISITED_COLOR : defaultFill,
                            stroke: "#ffffff",
                            strokeWidth: 0.5,
                            outline: "none",
                            cursor: "pointer",
                          },
                          hover: {
                            fill: isVisited ? HOVER_VISITED_COLOR : hoverDefault,
                            stroke: "#ffffff",
                            strokeWidth: 0.5,
                            outline: "none",
                            cursor: "pointer",
                          },
                          pressed: {
                            fill: isVisited ? HOVER_VISITED_COLOR : hoverDefault,
                            stroke: "#ffffff",
                            strokeWidth: 0.5,
                            outline: "none",
                            cursor: "pointer",
                          },
                        }}
                      />
                      {abbreviation && Number.isFinite(centroid[0]) && Number.isFinite(centroid[1]) ? (
                        <Marker coordinates={centroid}>
                          <text
                            textAnchor="middle"
                            y={3}
                            fontSize={7}
                            fontWeight={700}
                            fill={isVisited ? "#ffffff" : "#0f172a"}
                            style={{ pointerEvents: "none", userSelect: "none" }}
                          >
                            {abbreviation}
                          </text>
                        </Marker>
                      ) : null}
                    </g>
                  );
                })
              }
            </Geographies>
          </ComposableMap>
        </section>

        <aside className="list-panel">
          <h2>{isUS ? "Visited States" : "Visited Countries"}</h2>
          <p className="count">
            {currentVisited.length}/{currentItems.length} - {visitedPercentage}%
          </p>
          <div className="progress-track" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${visitedPercentage}%` }} />
          </div>
          <button type="button" className="clear-button" onClick={handleClearAll}>
            全部清除
          </button>
          <div className="state-list">
            {currentItems.map((item) => (
              <label key={item} className="state-item">
                <input
                  type="checkbox"
                  checked={currentVisitedSet.has(item)}
                  onChange={() => toggleItem(item)}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </aside>
      </main>
      <footer className="site-footer">Made by sunnyfge</footer>
    </div>
  );
}
