// Weather Information Dashboard: Fetch API + async/await + ES6+.

// Step 4: paste your OpenWeatherMap API key between the quotes.
// Get a free key at https://openweathermap.org/api (new keys can take a little while to activate).
const API_KEY = "YOUR_API_KEY_HERE";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

const els = {
  form: document.getElementById("searchForm"),
  input: document.getElementById("cityInput"),
  button: document.getElementById("searchBtn"),
  status: document.getElementById("status"),
  recent: document.getElementById("recent"),
  panel: document.getElementById("weather"),
  place: document.getElementById("place"),
  updated: document.getElementById("updated"),
  description: document.getElementById("description"),
  icon: document.getElementById("icon"),
  temp: document.getElementById("temp"),
  unitLabel: document.getElementById("unitLabel"),
  feels: document.getElementById("feels"),
  humidity: document.getElementById("humidity"),
  wind: document.getElementById("wind"),
  pressure: document.getElementById("pressure"),
  unitButtons: document.querySelectorAll(".unit-toggle button")
};

let current = null;      // last weather result, kept so the unit toggle can re-render
let unit = "metric";     // "metric" = °C, "imperial" = °F

// ---------- Step 5 and 6: fetch and parse ----------
const fetchWeather = async (city) => {
  const url = `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error("Could not reach the weather service. Check your internet connection and try again.");
  }

  if (!response.ok) {
    if (response.status === 404) throw new Error(`City "${city}" was not found. Check the spelling and try again.`);
    if (response.status === 401) throw new Error("The API key is invalid or not active yet. Check API_KEY in script.js.");
    if (response.status === 429) throw new Error("Too many requests. Wait a minute and try again.");
    throw new Error(`The weather service returned an error (${response.status}). Try again later.`);
  }

  const data = await response.json();

  // Destructure only what the dashboard needs.
  const { name, sys: { country }, main: { temp, feels_like, humidity, pressure }, wind: { speed }, weather: [{ description, icon }], dt, timezone } = data;
  return { name, country, temp, feelsLike: feels_like, humidity, pressure, windMs: speed, description, icon, dt, timezone };
};

// ---------- Step 7: display ----------
const toDisplayTemp = (celsius) => Math.round(unit === "metric" ? celsius : celsius * 9 / 5 + 32);

const render = () => {
  if (!current) return;
  const { name, country, temp, feelsLike, humidity, pressure, windMs, description, icon, dt, timezone } = current;
  const symbol = unit === "metric" ? "°C" : "°F";

  els.place.textContent = `${name}, ${country}`;
  els.description.textContent = description;
  els.icon.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
  els.icon.alt = description;
  els.temp.textContent = toDisplayTemp(temp);
  els.unitLabel.textContent = symbol;
  els.feels.textContent = `${toDisplayTemp(feelsLike)}${symbol}`;
  els.humidity.textContent = `${humidity}%`;
  els.wind.textContent = unit === "metric" ? `${(windMs * 3.6).toFixed(1)} km/h` : `${(windMs * 2.23694).toFixed(1)} mph`;
  els.pressure.textContent = `${pressure} hPa`;

  // dt is UTC seconds; shifting by the city's offset and reading it as UTC gives local time there.
  const local = new Date((dt + timezone) * 1000);
  els.updated.textContent = `Updated ${local.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} local time`;

  els.panel.hidden = false;
};

// ---------- Step 8: status and error handling ----------
const showStatus = (message, isError = false) => {
  els.status.textContent = message;
  els.status.classList.toggle("error", isError);
  els.status.hidden = false;
};
const hideStatus = () => { els.status.hidden = true; };

// ---------- Recent searches (saved in the browser) ----------
const loadRecent = () => {
  try { return JSON.parse(localStorage.getItem("recentCities")) ?? []; } catch { return []; }
};
const saveRecent = (city) => {
  const list = [city, ...loadRecent().filter(c => c.toLowerCase() !== city.toLowerCase())].slice(0, 5);
  try { localStorage.setItem("recentCities", JSON.stringify(list)); } catch { /* storage unavailable */ }
  renderRecent();
};
const renderRecent = () => {
  els.recent.replaceChildren(...loadRecent().map(city => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = city;
    b.addEventListener("click", () => { els.input.value = city; search(city); });
    return b;
  }));
};

// ---------- Main flow ----------
const search = async (rawCity) => {
  const city = rawCity.trim();
  if (!city) {
    showStatus("Enter a city name to search.", true);
    return;
  }
  if (API_KEY === "YOUR_API_KEY_HERE") {
    showStatus("Add your OpenWeatherMap API key to script.js first (see the API_KEY line at the top).", true);
    return;
  }

  els.button.disabled = true;
  els.panel.hidden = true;
  showStatus(`Loading weather for ${city}...`);

  try {
    current = await fetchWeather(city);
    render();
    hideStatus();
    saveRecent(current.name);
  } catch (error) {
    current = null;
    showStatus(error.message, true);
  } finally {
    els.button.disabled = false;
  }
};

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  search(els.input.value);
});

els.unitButtons.forEach(btn => btn.addEventListener("click", () => {
  unit = btn.dataset.unit;
  els.unitButtons.forEach(b => {
    const active = b === btn;
    b.classList.toggle("active", active);
    b.setAttribute("aria-pressed", String(active));
  });
  render();
}));

renderRecent();
