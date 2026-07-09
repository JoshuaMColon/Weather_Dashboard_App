function WeatherCard({ data, darkMode }) {
  if (!data) return null;

  return (
    <div
      className={`mt-6 w-full overflow-hidden rounded-[28px] border p-4 shadow-lg sm:p-7 ${darkMode ? "border-slate-700/70 bg-slate-800/80 text-white" : "border-slate-200 bg-white text-slate-800"} shrink-0`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p
            className={`text-xs font-semibold uppercase tracking-[0.3em] ${darkMode ? "text-slate-400" : "text-slate-500"}`}
          >
            Current weather
          </p>
          <h2
            className={`mt-2 text-2xl font-semibold sm:text-3xl ${darkMode ? "text-white" : "text-slate-900"}`}
          >
            {data.city}
          </h2>
          <p
            className={`mt-1 capitalize ${darkMode ? "text-slate-300" : "text-slate-600"}`}
          >
            {data.description}
          </p>
        </div>
        <div
          className={`rounded-2xl p-2 ${darkMode ? "bg-slate-700/70" : "bg-sky-50"}`}
        >
          <img
            src={`https://openweathermap.org/img/wn/${data.icon}@2x.png`}
            alt={data.description}
            className="h-16 w-16 sm:h-20 sm:w-20"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p
            className={`text-5xl font-semibold sm:text-7xl ${darkMode ? "text-sky-300" : "text-sky-600"}`}
          >
            {data.temp}°F
          </p>
          <p
            className={`mt-2 text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}
          >
            Feels like {data.feelsLike}°F
          </p>
        </div>
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${darkMode ? "bg-slate-700/70 text-slate-200" : "bg-slate-100 text-slate-700"}`}
        >
          <p className="font-semibold">Today’s outlook</p>
          <p className="mt-1">Bright skies and comfortable temperatures.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 grid-cols-1 sm:grid-cols-3">
        <div
          className={`rounded-2xl p-3 ${darkMode ? "bg-slate-700/70" : "bg-slate-100"}`}
        >
          <p
            className={`text-xs uppercase tracking-[0.2em] ${darkMode ? "text-slate-400" : "text-slate-500"}`}
          >
            Humidity
          </p>
          <p className="mt-1 text-lg font-semibold">{data.humidity}%</p>
        </div>
        <div
          className={`rounded-2xl p-3 ${darkMode ? "bg-slate-700/70" : "bg-slate-100"}`}
        >
          <p
            className={`text-xs uppercase tracking-[0.2em] ${darkMode ? "text-slate-400" : "text-slate-500"}`}
          >
            Wind
          </p>
          <p className="mt-1 text-lg font-semibold">{data.wind} mph</p>
        </div>
        <div
          className={`rounded-2xl p-3 ${darkMode ? "bg-slate-700/70" : "bg-slate-100"}`}
        >
          <p
            className={`text-xs uppercase tracking-[0.2em] ${darkMode ? "text-slate-400" : "text-slate-500"}`}
          >
            Feels like
          </p>
          <p className="mt-1 text-lg font-semibold">{data.feelsLike}°F</p>
        </div>
      </div>
    </div>
  );
}

export default WeatherCard;
