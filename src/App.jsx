import { useMemo, useState } from "react";
import { geoCentroid } from "d3-geo";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";
const STORAGE_KEY = "visited-us-states";
const DEFAULT_VISITED = ["Texas", "New Jersey"];
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

const ABBR_TO_STATE = Object.fromEntries(
  Object.entries(STATE_ABBR).map(([state, abbr]) => [abbr, state])
);

function normalizeVisited(states) {
  const cleaned = Array.isArray(states)
    ? states.filter((state) => US_STATES.includes(state))
    : [];
  return [...new Set(cleaned)];
}

function getVisitedFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("visited")) return { hasParam: false, states: [] };
    const shared = params.get("visited") ?? "";

    const states = shared
      .split(",")
      .map((abbr) => ABBR_TO_STATE[abbr.trim().toUpperCase()])
      .filter(Boolean);

    return { hasParam: true, states: normalizeVisited(states) };
  } catch {
    return { hasParam: false, states: [] };
  }
}

function getInitialVisited() {
  const visitedFromUrl = getVisitedFromUrl();
  if (visitedFromUrl.hasParam) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visitedFromUrl.states));
    return visitedFromUrl.states;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_VISITED;
    const parsed = JSON.parse(raw);
    const normalized = normalizeVisited(parsed);
    return normalized.length > 0 ? normalized : DEFAULT_VISITED;
  } catch {
    return DEFAULT_VISITED;
  }
}

export default function App() {
  const [visited, setVisited] = useState(getInitialVisited);
  const [shareMessage, setShareMessage] = useState("");
  const visitedSet = useMemo(() => new Set(visited), [visited]);
  const visitedPercentage = Math.round((visited.length / US_STATES.length) * 100);

  const toggleState = (stateName) => {
    if (!stateName || !US_STATES.includes(stateName)) return;

    setVisited((current) => {
      const next = current.includes(stateName)
        ? current.filter((name) => name !== stateName)
        : [...current, stateName];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleShare = async () => {
    const visitedParam = visited
      .map((state) => STATE_ABBR[state])
      .filter(Boolean)
      .sort()
      .join(",");
    const shareUrl = `${window.location.origin}${window.location.pathname}?visited=${visitedParam}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage("已複製分享網址！");
    } catch {
      setShareMessage(`請手動複製：${shareUrl}`);
    }
  };

  const handleClearAll = () => {
    setVisited([]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    setShareMessage("");
  };

  return (
    <div className="page">
      <main className="layout">
        <section className="map-panel">
          <h1>US Visited States Map</h1>
          <p>Click a state on the map, or check from the list.</p>
          <div className="share-row">
            <button type="button" className="share-button" onClick={handleShare}>
              分享我的足跡
            </button>
            {shareMessage ? <span className="share-message">{shareMessage}</span> : null}
          </div>

          <ComposableMap projection="geoAlbersUsa" className="us-map">
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const stateName = geo.properties.name;
                  const isVisited = visitedSet.has(stateName);
                  const abbreviation = STATE_ABBR[stateName];
                  const centroid = geoCentroid(geo);
                  const region = REGION_BY_STATE[stateName] ?? "Northeast";
                  const palette = REGION_COLORS[region];

                  return (
                    <g key={geo.rsmKey}>
                      <Geography
                        geography={geo}
                        onClick={() => toggleState(stateName)}
                        style={{
                          default: {
                            fill: isVisited ? palette.visited : palette.default,
                            stroke: "#ffffff",
                            strokeWidth: 0.5,
                            outline: "none",
                            cursor: "pointer",
                          },
                          hover: {
                            fill: isVisited ? palette.hoverVisited : palette.hoverDefault,
                            stroke: "#ffffff",
                            strokeWidth: 0.5,
                            outline: "none",
                            cursor: "pointer",
                          },
                          pressed: {
                            fill: isVisited ? palette.hoverVisited : palette.hoverDefault,
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
          <h2>Visited States</h2>
          <p className="count">
            {visited.length}/{US_STATES.length} - {visitedPercentage}%
          </p>
          <div className="progress-track" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${visitedPercentage}%` }} />
          </div>
          <button type="button" className="clear-button" onClick={handleClearAll}>
            全部清除
          </button>
          <div className="state-list">
            {US_STATES.map((state) => (
              <label key={state} className="state-item">
                <input
                  type="checkbox"
                  checked={visitedSet.has(state)}
                  onChange={() => toggleState(state)}
                />
                <span>{state}</span>
              </label>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
}
