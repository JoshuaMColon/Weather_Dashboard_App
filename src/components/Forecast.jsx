function Forecast({ forecast, darkMode }) {
  if (!forecast || forecast.length === 0) return null;

  return (
    <div className="w-full">
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {forecast.map((day, index) => (
          <div
            key={index}
            className={`flex flex-col items-center rounded-2xl border p-3 text-center shadow-sm ${darkMode ? "border-slate-700/80 bg-slate-800/75 text-white" : "border-slate-200 bg-slate-50 text-slate-800"}`}
          >
            <p
              className={`text-xs font-semibold uppercase tracking-[0.2em] ${darkMode ? "text-slate-400" : "text-slate-500"}`}
            >
              <span className="hidden sm:inline">{day.date}</span>
              <span className="sm:hidden">{day.date.split(",")[0]}</span>
            </p>
            <img
              src={`https://openweathermap.org/img/wn/${day.icon}.png`}
              alt={day.description}
              className="my-2 h-10 w-10 sm:h-12 sm:w-12"
            />
            <p
              className={`text-sm font-semibold ${darkMode ? "text-sky-300" : "text-sky-600"}`}
            >
              {day.high}°
            </p>
            <p
              className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}
            >
              {day.low}°
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Forecast;
