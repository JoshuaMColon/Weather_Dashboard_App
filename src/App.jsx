import { useState } from "react";
import ErrorMessage from "./components/ErrorMessage";
import Forecast from "./components/Forecast";
import HourlyForecast from "./components/HourlyForecast";
import ParticleEffect from "./components/ParticleEffect";
import SearchBar from "./components/SearchBar";
import WeatherCard from "./components/WeatherCard";
import "./index.css";

// PASTE API KEY HERE -from openweathermap.org
const API_KEY = "67e4d35f91b2b4fd1bc7aba12df35444";

export default function App() {
  const [weather, setWeather] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState([]);
  const [showForecast, setShowForecast] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [hourly, setHourly] = useState([]);

  async function handleSearch(city) {
    setError("");
    setWeather(null);
    setForecast([]);
    setShowForecast(false);
    setLoading(true);
    setHourly([]);

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=imperial`;
      const response = await fetch(url);

      if (!response.ok) {
        setError("City not found. Check the spelling and try again.");
        return;
      }

      const data = await response.json();

      setWeather({
        city: data.name,
        temp: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        wind: Math.round(data.wind.speed),
        description: data.weather[0].description,
        icon: data.weather[0].icon,
      });

      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=imperial`;
      const forecastRes = await fetch(forecastUrl);
      const forecastData = await forecastRes.json();

      const daily = forecastData.list.filter((item) =>
        item.dt_txt.includes("12:00:00"),
      );

      setForecast(
        daily.map((day) => ({
          date: new Date(day.dt_txt).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          }),
          high: Math.round(day.main.temp_max),
          low: Math.round(day.main.temp_min),
          description: day.weather[0].description,
          icon: day.weather[0].icon,
        })),
      );

      const next24 = forecastData.list.slice(0, 8);

      setHourly(
        next24.map((hour) => ({
          time: new Date(hour.dt_txt).toLocaleTimeString("en-US", {
            hour: "numeric",
            hour12: true,
          }),
          temp: Math.round(hour.main.temp),
          description: hour.weather[0].description,
          icon: hour.weather[0].icon,
        })),
      );
    } catch (err) {
      console.log("Error: ", err);
      setError("Something went wrong. Check your internet connection.");
    } finally {
      setLoading(false);
    }
  }

  const bgColor = darkMode
    ? "from-slate-950 via-slate-900 to-slate-800"
    : !weather
      ? "from-sky-100 via-cyan-100 to-blue-100"
      : weather.temp >= 80
        ? "from-amber-100 via-orange-100 to-rose-100"
        : weather.temp >= 60
          ? "from-amber-50 via-yellow-100 to-orange-100"
          : "from-sky-100 via-blue-100 to-indigo-100";

  return (
    <div
      className={`relative min-h-screen overflow-x-hidden bg-linear-to-br ${bgColor} transition-colors duration-500`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.75),transparent_45%)]" />
      <ParticleEffect
        description={weather ? weather.description : ""}
        icon={weather ? weather.icon : ""}
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-3 py-4 sm:px-6 lg:px-8">
        <header
          className={`mb-6 flex w-full flex-wrap items-center justify-between gap-3 rounded-full border px-4 py-3 shadow-lg backdrop-blur-xl sm:px-6 ${darkMode ? "border-slate-700/70 bg-slate-900/70" : "border-white/70 bg-white/70"}`}
        >
          <div>
            <p
              className={`text-[10px] font-semibold uppercase tracking-[0.35em] ${darkMode ? "text-slate-400" : "text-slate-500"}`}
            >
              Live forecast
            </p>
            <h1
              className={`text-xl font-semibold sm:text-2xl ${darkMode ? "text-white" : "text-slate-900"}`}
            >
              Weather Dashboard
            </h1>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`rounded-full px-3 py-2 text-sm font-semibold transition-all duration-300 ${darkMode ? "bg-amber-400 text-slate-950 hover:bg-amber-300" : "bg-slate-900 text-white hover:bg-slate-700"}`}
          >
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </header>

        <div className="grid w-full min-w-0 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <section
            className={`w-full min-w-0 rounded-4xl border p-4 shadow-2xl backdrop-blur-xl sm:p-6 ${darkMode ? "border-slate-700/70 bg-slate-900/70" : "border-white/70 bg-white/70"}`}
          >
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p
                  className={`text-sm font-semibold ${darkMode ? "text-slate-300" : "text-slate-600"}`}
                >
                  Search any city in the world
                </p>
                <h2
                  className={`text-lg font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}
                >
                  Plan your day with a polished forecast view
                </h2>
              </div>
              <div
                className={`rounded-full px-3 py-1 text-xs font-medium ${darkMode ? "bg-slate-800 text-slate-300" : "bg-sky-100 text-sky-700"}`}
              >
                {weather ? "Live conditions" : "Start exploring"}
              </div>
            </div>

            <SearchBar onSearch={handleSearch} />

            {loading && (
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-sky-500" />
                Loading live weather...
              </div>
            )}

            <div className="mt-4">
              <ErrorMessage message={error} />
              <WeatherCard data={weather} darkMode={darkMode} />
            </div>
          </section>

          <aside className="w-full min-w-0 space-y-6">
            <div
              className={`w-full rounded-4xl border p-4 shadow-2xl backdrop-blur-xl sm:p-5 ${darkMode ? "border-slate-700/70 bg-slate-900/70" : "border-white/70 bg-white/70"}`}
            >
              <HourlyForecast hourly={hourly} darkMode={darkMode} />
            </div>

            <div
              className={`rounded-4xl border p-4 shadow-2xl backdrop-blur-xl sm:p-5 ${darkMode ? "border-slate-700/70 bg-slate-900/70" : "border-white/70 bg-white/70"}`}
            >
              {forecast.length > 0 && (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3
                        className={`text-lg font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}
                      >
                        5-Day outlook
                      </h3>
                      <p
                        className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}
                      >
                        Tap to reveal the weekly snapshot
                      </p>
                    </div>
                    <button
                      onClick={() => setShowForecast(!showForecast)}
                      className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
                    >
                      {showForecast ? "Hide" : "Show"}
                    </button>
                  </div>
                  {showForecast && (
                    <Forecast forecast={forecast} darkMode={darkMode} />
                  )}
                </>
              )}

              {forecast.length === 0 && !loading && (
                <div
                  className={`rounded-2xl border border-dashed p-4 text-sm ${darkMode ? "border-slate-700 text-slate-400" : "border-slate-200 text-slate-500"}`}
                >
                  Your daily forecast will appear here after a city search.
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
