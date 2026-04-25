function Forecast({ forecast, darkMode }) {
  if (!forecast || forecast.length === 0) return null

  return (
    <div className="w-full mt-6">
      <h3 className={`text-base sm:text-lg font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
        5-Day Forecast
      </h3>
      <div className="grid grid-cols-5 gap-1 sm:gap-2">
        {forecast.map(function(day, index) {
          return (
            <div key={index} className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}
            rounded-xl shadow p-2 sm:p-3 flex flex-col items-center`}>
              <p className={`text-xs font-medium text-center leading-tight ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                {/* Show shorter date on mobile */}
                <span className="hidden sm:inline">{day.date}</span>
                <span className="sm:hidden">{day.date.split(",")[0]}</span>
              </p>
              <img
                src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                alt={day.description}
                className="w-8 h-8 sm:w-10 sm:h-10"
              />
              <p className={`text-xs sm:text-sm font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                {day.high}°
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                {day.low}°
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Forecast