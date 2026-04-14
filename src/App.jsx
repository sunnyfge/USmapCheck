import { useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { geoCentroid } from "d3-geo";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

const US_GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";
const EUROPE_GEO_URL =
  "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";
const LATIN_AMERICA_GEO_URL =
  "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";
const STORAGE_KEY_US = "visited-us-states";
const STORAGE_KEY_EUROPE = "visited-europe-countries";
const STORAGE_KEY_LATAM = "visited-latin-america-countries";
const DEFAULT_VISITED_US = ["Texas", "New Jersey"];
const DEFAULT_VISITED_EUROPE = [];
const DEFAULT_VISITED_LATAM = [];
const VISITED_COLOR = "#10B981";
const HOVER_VISITED_COLOR = "#059669";
const TAB_US = "us";
const TAB_EUROPE = "europe";
const TAB_LATAM = "latam";

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

const VISA_LABEL = {
  schengen: "申根",
  visaFree: "非申根免簽",
  visaRequired: "需簽證/電子簽",
};

const EUROPE_CATEGORY_COLORS = {
  schengen: { default: "#dbeafe", hover: "#bfdbfe" }, // 淡藍
  visaFree: { default: "#ede9fe", hover: "#ddd6fe" }, // 淡紫
  visaRequired: { default: "#e5e7eb", hover: "#d1d5db" }, // 淡灰
};

const LATAM_CATEGORY_COLORS = {
  diplomatic: { default: "#fbcfe8", hover: "#f9a8d4" }, // 淡粉紅
  visaFree: { default: "#fef3c7", hover: "#fde68a" }, // 淡黃
  visaRequired: { default: "#e5e7eb", hover: "#d1d5db" }, // 淡灰
};

const EUROPE_COUNTRY_META = {
  Albania: { zh: "阿爾巴尼亞", flag: "🇦🇱", visaType: "visaFree" },
  Andorra: { zh: "安道爾", flag: "🇦🇩", visaType: "schengen" },
  Austria: { zh: "奧地利", flag: "🇦🇹", visaType: "schengen" },
  Azerbaijan: { zh: "亞塞拜然", flag: "🇦🇿", visaType: "visaRequired" },
  Belarus: { zh: "白俄羅斯", flag: "🇧🇾", visaType: "visaRequired" },
  Belgium: { zh: "比利時", flag: "🇧🇪", visaType: "schengen" },
  "Bosnia and Herzegovina": { zh: "波士尼亞與赫塞哥維納", flag: "🇧🇦", visaType: "visaFree" },
  Bulgaria: { zh: "保加利亞", flag: "🇧🇬", visaType: "schengen" },
  Croatia: { zh: "克羅埃西亞", flag: "🇭🇷", visaType: "schengen" },
  Cyprus: { zh: "賽普勒斯", flag: "🇨🇾", visaType: "visaFree" },
  "Czech Republic": { zh: "捷克", flag: "🇨🇿", visaType: "schengen" },
  Denmark: { zh: "丹麥", flag: "🇩🇰", visaType: "schengen" },
  Estonia: { zh: "愛沙尼亞", flag: "🇪🇪", visaType: "schengen" },
  Finland: { zh: "芬蘭", flag: "🇫🇮", visaType: "schengen" },
  France: { zh: "法國", flag: "🇫🇷", visaType: "schengen" },
  Georgia: { zh: "喬治亞", flag: "🇬🇪", visaType: "visaFree" },
  Germany: { zh: "德國", flag: "🇩🇪", visaType: "schengen" },
  Greece: { zh: "希臘", flag: "🇬🇷", visaType: "schengen" },
  Hungary: { zh: "匈牙利", flag: "🇭🇺", visaType: "schengen" },
  Iceland: { zh: "冰島", flag: "🇮🇸", visaType: "schengen" },
  Ireland: { zh: "愛爾蘭", flag: "🇮🇪", visaType: "visaFree" },
  Italy: { zh: "義大利", flag: "🇮🇹", visaType: "schengen" },
  Kosovo: { zh: "科索沃", flag: "🇽🇰", visaType: "visaFree" },
  Latvia: { zh: "拉脫維亞", flag: "🇱🇻", visaType: "schengen" },
  Liechtenstein: { zh: "列支敦斯登", flag: "🇱🇮", visaType: "schengen" },
  Lithuania: { zh: "立陶宛", flag: "🇱🇹", visaType: "schengen" },
  Luxembourg: { zh: "盧森堡", flag: "🇱🇺", visaType: "schengen" },
  Malta: { zh: "馬爾他", flag: "🇲🇹", visaType: "schengen" },
  Moldova: { zh: "摩爾多瓦", flag: "🇲🇩", visaType: "visaFree" },
  Monaco: { zh: "摩納哥", flag: "🇲🇨", visaType: "schengen" },
  Montenegro: { zh: "蒙特內哥羅", flag: "🇲🇪", visaType: "visaFree" },
  Netherlands: { zh: "荷蘭", flag: "🇳🇱", visaType: "schengen" },
  "North Macedonia": { zh: "北馬其頓", flag: "🇲🇰", visaType: "visaFree" },
  Norway: { zh: "挪威", flag: "🇳🇴", visaType: "schengen" },
  Poland: { zh: "波蘭", flag: "🇵🇱", visaType: "schengen" },
  Portugal: { zh: "葡萄牙", flag: "🇵🇹", visaType: "schengen" },
  Romania: { zh: "羅馬尼亞", flag: "🇷🇴", visaType: "schengen" },
  Serbia: { zh: "塞爾維亞", flag: "🇷🇸", visaType: "visaFree" },
  Slovakia: { zh: "斯洛伐克", flag: "🇸🇰", visaType: "schengen" },
  Slovenia: { zh: "斯洛維尼亞", flag: "🇸🇮", visaType: "schengen" },
  Spain: { zh: "西班牙", flag: "🇪🇸", visaType: "schengen" },
  Sweden: { zh: "瑞典", flag: "🇸🇪", visaType: "schengen" },
  Switzerland: { zh: "瑞士", flag: "🇨🇭", visaType: "schengen" },
  Turkey: { zh: "土耳其", flag: "🇹🇷", visaType: "visaRequired" },
  Ukraine: { zh: "烏克蘭", flag: "🇺🇦", visaType: "visaFree" },
  "United Kingdom": { zh: "英國", flag: "🇬🇧", visaType: "visaFree" },
  Vatican: { zh: "梵蒂岡", flag: "🇻🇦", visaType: "schengen" },
};

const EUROPE_COUNTRIES = Object.keys(EUROPE_COUNTRY_META).sort((a, b) => a.localeCompare(b));

const EUROPE_NAME_ALIASES = {
  "Czechia": "Czech Republic",
  "Bosnia and Herz.": "Bosnia and Herzegovina",
  "Macedonia": "North Macedonia",
  "Republic of Moldova": "Moldova",
  "Russian Federation": "Russia",
  "Türkiye": "Turkey",
  "United Kingdom of Great Britain and Northern Ireland": "United Kingdom",
};

const LATAM_STATUS_LABEL = {
  diplomatic: "免簽/邦交",
  visaFree: "免簽",
  visaRequired: "電子簽/需簽證",
};

const LATAM_COUNTRY_META = {
  Mexico: {
    zh: "墨西哥",
    flag: "🇲🇽",
    subregion: "central",
    visaType: "visaRequired",
    visaLabel: "加美簽條件",
    note: "通常需符合特定條件（如持有效美簽）才較容易入境，請出發前再確認官方規定。",
  },
  Belize: { zh: "貝里斯", flag: "🇧🇿", subregion: "central", visaType: "diplomatic" },
  Guatemala: { zh: "瓜地馬拉", flag: "🇬🇹", subregion: "central", visaType: "diplomatic" },
  Honduras: { zh: "宏都拉斯", flag: "🇭🇳", subregion: "central", visaType: "visaRequired", visaLabel: "需簽證" },
  Nicaragua: { zh: "尼加拉瓜", flag: "🇳🇮", subregion: "central", visaType: "visaRequired", visaLabel: "落地簽" },
  "Costa Rica": { zh: "哥斯大黎加", flag: "🇨🇷", subregion: "central", visaType: "visaFree" },
  Panama: { zh: "巴拿馬", flag: "🇵🇦", subregion: "central", visaType: "visaFree" },
  Colombia: { zh: "哥倫比亞", flag: "🇨🇴", subregion: "south", visaType: "visaFree" },
  Venezuela: {
    zh: "委內瑞拉",
    flag: "🇻🇪",
    subregion: "south",
    visaType: "visaRequired",
    visaLabel: "入境困難",
    note: "即使有簽證也可能面臨較高入境不確定性，建議以最新外交與航空公告為準。",
  },
  Guyana: {
    zh: "蓋亞那",
    flag: "🇬🇾",
    subregion: "south",
    visaType: "visaRequired",
    visaLabel: "需簽證",
  },
  Suriname: { zh: "蘇利南", flag: "🇸🇷", subregion: "south", visaType: "visaRequired" },
  Ecuador: { zh: "厄瓜多", flag: "🇪🇨", subregion: "south", visaType: "visaFree" },
  Peru: { zh: "秘魯", flag: "🇵🇪", subregion: "south", visaType: "visaFree" },
  Bolivia: {
    zh: "玻利維亞",
    flag: "🇧🇴",
    subregion: "south",
    visaType: "visaRequired",
    visaLabel: "落地簽",
  },
  Paraguay: { zh: "巴拉圭", flag: "🇵🇾", subregion: "south", visaType: "diplomatic" },
  Chile: { zh: "智利", flag: "🇨🇱", subregion: "south", visaType: "visaFree" },
  Argentina: { zh: "阿根廷", flag: "🇦🇷", subregion: "south", visaType: "visaFree" },
  Uruguay: { zh: "烏拉圭", flag: "🇺🇾", subregion: "south", visaType: "visaFree" },
  Brazil: { zh: "巴西", flag: "🇧🇷", subregion: "south", visaType: "visaRequired" },
};

const LATAM_COUNTRIES = Object.keys(LATAM_COUNTRY_META).sort((a, b) => a.localeCompare(b));
const EUROPE_ABBR = {
  Albania: "AL",
  Andorra: "AD",
  Austria: "AT",
  Azerbaijan: "AZ",
  Belarus: "BY",
  Belgium: "BE",
  "Bosnia and Herzegovina": "BA",
  Bulgaria: "BG",
  Croatia: "HR",
  Cyprus: "CY",
  "Czech Republic": "CZ",
  Denmark: "DK",
  Estonia: "EE",
  Finland: "FI",
  France: "FR",
  Georgia: "GE",
  Germany: "DE",
  Greece: "GR",
  Hungary: "HU",
  Iceland: "IS",
  Ireland: "IE",
  Italy: "IT",
  Kosovo: "XK",
  Latvia: "LV",
  Liechtenstein: "LI",
  Lithuania: "LT",
  Luxembourg: "LU",
  Malta: "MT",
  Moldova: "MD",
  Monaco: "MC",
  Montenegro: "ME",
  Netherlands: "NL",
  "North Macedonia": "MK",
  Norway: "NO",
  Poland: "PL",
  Portugal: "PT",
  Romania: "RO",
  Serbia: "RS",
  Slovakia: "SK",
  Slovenia: "SI",
  Spain: "ES",
  Sweden: "SE",
  Switzerland: "CH",
  Turkey: "TR",
  Ukraine: "UA",
  "United Kingdom": "GB",
  Vatican: "VA",
};

const LATAM_ABBR = {
  Argentina: "AR",
  Belize: "BZ",
  Bolivia: "BO",
  Brazil: "BR",
  Chile: "CL",
  Colombia: "CO",
  "Costa Rica": "CR",
  Ecuador: "EC",
  Guatemala: "GT",
  Guyana: "GY",
  Honduras: "HN",
  Mexico: "MX",
  Nicaragua: "NI",
  Panama: "PA",
  Paraguay: "PY",
  Peru: "PE",
  Suriname: "SR",
  Uruguay: "UY",
  Venezuela: "VE",
};

const SMALL_LABEL_COUNTRIES = new Set([
  "Luxembourg",
  "Vatican",
  "Monaco",
  "Malta",
  "Andorra",
  "Liechtenstein",
  "Belize",
  "Costa Rica",
  "Panama",
  "El Salvador",
  "Guatemala",
]);

function getGeoName(geo) {
  const raw =
    geo?.properties?.name ||
    geo?.properties?.NAME ||
    geo?.properties?.NAME_EN ||
    geo?.properties?.ADMIN ||
    geo?.properties?.admin ||
    "";
  return EUROPE_NAME_ALIASES[raw] || raw;
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
    getInitialVisited(STORAGE_KEY_US, DEFAULT_VISITED_US, US_STATES)
  );
  const [visitedEurope, setVisitedEurope] = useState(() =>
    getInitialVisited(STORAGE_KEY_EUROPE, DEFAULT_VISITED_EUROPE, EUROPE_COUNTRIES)
  );
  const [visitedLatAm, setVisitedLatAm] = useState(() =>
    getInitialVisited(STORAGE_KEY_LATAM, DEFAULT_VISITED_LATAM, LATAM_COUNTRIES)
  );
  const [selectedCountry, setSelectedCountry] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const isUS = activeTab === TAB_US;
  const isEurope = activeTab === TAB_EUROPE;
  const isLatAm = activeTab === TAB_LATAM;
  const currentItems = isUS ? US_STATES : isEurope ? EUROPE_COUNTRIES : LATAM_COUNTRIES;
  const currentVisited = isUS ? visitedUS : isEurope ? visitedEurope : visitedLatAm;
  const currentVisitedSet = useMemo(() => new Set(currentVisited), [currentVisited]);
  const schengenVisitedCount = useMemo(
    () =>
      visitedEurope.filter((country) => EUROPE_COUNTRY_META[country]?.visaType === "schengen")
        .length,
    [visitedEurope]
  );

  const europeGroupedList = useMemo(() => {
    const grouped = {
      schengen: [],
      visaFree: [],
      visaRequired: [],
    };
    for (const country of EUROPE_COUNTRIES) {
      const type = EUROPE_COUNTRY_META[country]?.visaType || "visaRequired";
      grouped[type].push(country);
    }
    return grouped;
  }, []);
  const latAmGroupedList = useMemo(() => {
    const grouped = {
      central: [],
      south: [],
    };
    for (const country of LATAM_COUNTRIES) {
      const region = LATAM_COUNTRY_META[country]?.subregion || "south";
      grouped[region].push(country);
    }
    return grouped;
  }, []);

  const visitedPercentage = Math.round((currentVisited.length / currentItems.length) * 100);
  const achievementText = useMemo(() => {
    if (isUS) {
      const noun = currentVisited.length === 1 ? "state" : "states";
      return `United States: Congratulations, you've visited ${currentVisited.length} ${noun}!`;
    }
    if (isEurope) {
      const noun = currentVisited.length === 1 ? "country" : "countries";
      return `Europe: Congratulations, you've visited ${currentVisited.length} ${noun}!`;
    }
    const noun = currentVisited.length === 1 ? "country" : "countries";
    return `Latin America: Congratulations, you've visited ${currentVisited.length} ${noun}!`;
  }, [isUS, isEurope, currentVisited.length]);
  const visitedParam = currentVisited
    .map((item) => encodeURIComponent(item))
    .sort()
    .join(",");
  const shareUrl = `${window.location.origin}${window.location.pathname}?map=${activeTab}&visited=${visitedParam}`;

  const toggleItem = (itemName) => {
    if (!itemName || !currentItems.includes(itemName)) return;
    if (!isUS) setSelectedCountry(itemName);

    const setter = isUS ? setVisitedUS : isEurope ? setVisitedEurope : setVisitedLatAm;
    const storageKey = isUS
      ? STORAGE_KEY_US
      : isEurope
        ? STORAGE_KEY_EUROPE
        : STORAGE_KEY_LATAM;
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
          title: isUS ? "My US Travel Map" : isEurope ? "My Europe Travel Map" : "My Latin America Travel Map",
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
        backgroundColor: "#070b14",
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
    } else if (isEurope) {
      setVisitedEurope([]);
      localStorage.setItem(STORAGE_KEY_EUROPE, JSON.stringify([]));
    } else {
      setVisitedLatAm([]);
      localStorage.setItem(STORAGE_KEY_LATAM, JSON.stringify([]));
    }
    setShareMessage("");
  };

  const selectedMeta = isEurope
    ? EUROPE_COUNTRY_META[selectedCountry]
    : isLatAm
      ? LATAM_COUNTRY_META[selectedCountry]
      : null;

  const selectedVisaLabel = isEurope
    ? selectedMeta?.visaType
      ? VISA_LABEL[selectedMeta.visaType]
      : ""
    : isLatAm
      ? selectedMeta?.visaLabel || (selectedMeta?.visaType ? LATAM_STATUS_LABEL[selectedMeta.visaType] : "")
      : "";

  return (
    <div className="page">
      <main className="layout capture-area" ref={mapCaptureRef}>
        <section className="map-panel">
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
              className={`tab-button ${isEurope ? "active" : ""}`}
              onClick={() => setActiveTab(TAB_EUROPE)}
            >
              歐洲地圖
            </button>
            <button
              type="button"
              className={`tab-button ${isLatAm ? "active" : ""}`}
              onClick={() => setActiveTab(TAB_LATAM)}
            >
              中南美洲
            </button>
          </div>
          <h1>
            {isUS
              ? "US Visited States Map"
              : isEurope
                ? "Europe Visited Countries Map"
                : "Latin America Visited Countries Map"}
          </h1>
          <p>
            {isUS
              ? "Click a state on the map, or check from the list."
              : "Click a country on the map, or check from the list."}
          </p>
          <p className="achievement-text">{achievementText}</p>
          <div className="share-row">
            <button type="button" className="share-button" onClick={handleShare}>
              分享我的足跡
            </button>
            <button type="button" className="share-button secondary" onClick={handleDownloadImage}>
              下載圖片
            </button>
            {shareMessage ? <span className="share-message">{shareMessage}</span> : null}
          </div>
          {!isUS ? (
            <div className="legend-row">
              {(isEurope
                ? [
                    ["schengen", "申根免簽區"],
                    ["visaFree", "非申根免簽"],
                    ["visaRequired", "需簽證/電子簽"],
                  ]
                : [
                    ["diplomatic", "邦交國"],
                    ["visaFree", "免簽證區"],
                    ["visaRequired", "需簽證/電子簽"],
                  ]
              ).map(([key, label]) => {
                const palette = isEurope ? EUROPE_CATEGORY_COLORS[key] : LATAM_CATEGORY_COLORS[key];
                return (
                  <span key={key} className="legend-item">
                    <i className="legend-swatch" style={{ background: palette.default }} />
                    {label}
                  </span>
                );
              })}
            </div>
          ) : null}

          <ComposableMap
            projection={isUS ? "geoAlbersUsa" : isEurope ? "geoConicConformal" : "geoMercator"}
            projectionConfig={
              isUS
                ? undefined
                : isEurope
                  ? { scale: 800, center: [10, 52] }
                  : { scale: 320, center: [-75, -15] }
            }
            className="us-map"
          >
            <Geographies
              geography={isUS ? US_GEO_URL : isEurope ? EUROPE_GEO_URL : LATIN_AMERICA_GEO_URL}
            >
              {({ geographies }) =>
                geographies.map((geo) => {
                  const geoName = getGeoName(geo);
                  if (!geoName) return null;
                  if (isEurope && !EUROPE_COUNTRIES.includes(geoName)) return null;
                  if (isLatAm && !LATAM_COUNTRIES.includes(geoName)) return null;
                  const isVisited = currentVisitedSet.has(geoName);
                  const abbreviation = isUS
                    ? STATE_ABBR[geoName]
                    : isEurope
                      ? EUROPE_ABBR[geoName]
                      : LATAM_ABBR[geoName];
                  const centroid = geoCentroid(geo);
                  const region = REGION_BY_STATE[geoName] ?? "Northeast";
                  const palette = REGION_COLORS[region];
                  const europeType = EUROPE_COUNTRY_META[geoName]?.visaType || "visaRequired";
                  const europePalette = EUROPE_CATEGORY_COLORS[europeType];
                  const latAmType = LATAM_COUNTRY_META[geoName]?.visaType || "visaRequired";
                  const latAmPalette = LATAM_CATEGORY_COLORS[latAmType];
                  const defaultFill = isUS
                    ? palette.default
                    : isEurope
                      ? europePalette.default
                      : latAmPalette.default;
                  const hoverDefault = isUS
                    ? palette.hoverDefault
                    : isEurope
                      ? europePalette.hover
                      : latAmPalette.hover;
                  const borderColor = isUS ? "#ffffff" : "rgba(255,255,255,0.92)";
                  const borderWidth = isUS ? 0.5 : 0.85;
                  const hoverBorderWidth = isUS ? 0.5 : 1.4;

                  return (
                    <g key={geo.rsmKey}>
                      <Geography
                        geography={geo}
                        onClick={() => toggleItem(geoName)}
                        style={{
                          default: {
                            fill: isVisited ? VISITED_COLOR : defaultFill,
                            stroke: borderColor,
                            strokeWidth: borderWidth,
                            outline: "none",
                            cursor: "pointer",
                            filter: "none",
                          },
                          hover: {
                            fill: isVisited ? HOVER_VISITED_COLOR : hoverDefault,
                            stroke: "#f8fafc",
                            strokeWidth: hoverBorderWidth,
                            outline: "none",
                            cursor: "pointer",
                            filter: isUS ? "none" : "drop-shadow(0 0 2px rgba(248,250,252,0.7))",
                          },
                          pressed: {
                            fill: isVisited ? HOVER_VISITED_COLOR : hoverDefault,
                            stroke: "#f8fafc",
                            strokeWidth: hoverBorderWidth,
                            outline: "none",
                            cursor: "pointer",
                            filter: isUS ? "none" : "drop-shadow(0 0 2px rgba(248,250,252,0.7))",
                          },
                        }}
                      >
                        <title>{geoName}</title>
                      </Geography>
                      {abbreviation && Number.isFinite(centroid[0]) && Number.isFinite(centroid[1]) ? (
                        <Marker coordinates={centroid}>
                          <text
                            textAnchor="middle"
                            y={3}
                            fontSize={SMALL_LABEL_COUNTRIES.has(geoName) ? 5.5 : isUS ? 7 : 6.2}
                            fontWeight={700}
                            fill={isVisited ? "#14532d" : "rgba(241, 245, 249, 0.82)"}
                            fontFamily="Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
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
          {isEurope ? <p className="schengen-note">台灣護照於申根區每 180 天內可停留 90 天。</p> : null}
          {!isUS ? (
            <div className="visa-info-card">
              <strong>點擊國家簽證資訊</strong>
              {selectedCountry && selectedMeta ? (
                <p>
                  {selectedMeta.zh} {selectedMeta.flag} - {selectedVisaLabel}
                  {selectedMeta.note ? `；${selectedMeta.note}` : ""}
                </p>
              ) : (
                <p>請先點擊地圖上的國家，這裡會顯示簽證重點。</p>
              )}
            </div>
          ) : null}
        </section>

        <aside className="list-panel">
          <h2>{isUS ? "Visited States" : "Visited Countries"}</h2>
          <p className="achievement-inline">{achievementText}</p>
          <p className="count">
            {currentVisited.length}/{currentItems.length} - {visitedPercentage}%
          </p>
          <div className="progress-track" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${visitedPercentage}%` }} />
          </div>
          <button type="button" className="clear-button" onClick={handleClearAll}>
            全部清除
          </button>
          {isEurope ? <p className="schengen-counter">已點亮申根國：{schengenVisitedCount}</p> : null}
          {isUS ? (
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
          ) : isEurope ? (
            <div className="grouped-list">
              {["schengen", "visaFree", "visaRequired"].map((groupKey) => (
                <section key={groupKey} className="group-block">
                  <h3>{VISA_LABEL[groupKey]}</h3>
                  <div className="state-list">
                    {europeGroupedList[groupKey].map((country) => {
                      const meta = EUROPE_COUNTRY_META[country];
                      return (
                        <label key={country} className="state-item">
                          <input
                            type="checkbox"
                            checked={currentVisitedSet.has(country)}
                            onChange={() => toggleItem(country)}
                          />
                          <span>
                            {meta.zh} {meta.flag} ({VISA_LABEL[meta.visaType]})
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="grouped-list">
              {[
                ["central", "中美洲 (Central America)"],
                ["south", "南美洲 (South America)"],
              ].map(([groupKey, title]) => (
                <section key={groupKey} className="group-block">
                  <h3>{title}</h3>
                  <div className="state-list">
                    {latAmGroupedList[groupKey].map((country) => {
                      const meta = LATAM_COUNTRY_META[country];
                      return (
                        <label key={country} className="state-item">
                          <input
                            type="checkbox"
                            checked={currentVisitedSet.has(country)}
                            onChange={() => toggleItem(country)}
                          />
                          <span>
                            {meta.zh} {meta.flag} ({meta.visaLabel || LATAM_STATUS_LABEL[meta.visaType]})
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </aside>
      </main>
      <footer className="site-footer">
        <div>Made by sunnyfge</div>
        <div className="disclaimer-note">
          *簽證資訊變動快，出發前請務必再次確認外交部領事事務局官網。
        </div>
      </footer>
    </div>
  );
}
