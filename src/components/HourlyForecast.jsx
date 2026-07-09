function HourlyForecast({ hourly, darkMode }) {
  if (!hourly || hourly.length === 0) return null;

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <h3
          className={`text-lg font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}
        >
          Hourly Forecast
        </h3>
        <span
          className={`text-xs font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}
        >
          Next 24 hours
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {hourly.map((hour, index) => (
          <div
            key={index}
            className={`flex min-w-21 shrink-0 flex-col items-center rounded-2xl border p-3 text-center shadow-sm ${darkMode ? "border-slate-700/80 bg-slate-800/80 text-white" : "border-slate-200 bg-slate-50 text-slate-800"}`}
          >
            <p
              className={`text-[11px] font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}
            >
              {hour.time}
            </p>
            <img
              src={`https://openweathermap.org/img/wn/${hour.icon}.png`}
              alt={hour.description}
              className="my-2 h-10 w-10"
            />
            <p
              className={`text-sm font-semibold ${darkMode ? "text-sky-300" : "text-sky-600"}`}
            >
              {hour.temp}°
            </p>
            <p
              className={`mt-1 text-[11px] capitalize ${darkMode ? "text-slate-400" : "text-slate-500"}`}
            >
              {hour.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HourlyForecast;
