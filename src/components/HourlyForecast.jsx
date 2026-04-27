function HourlyForecast({ hourly, darkMode }) {
    if (!hourly || hourly.length === 0) return null

    return (
        <div className="w-full max-w-md mt-4">
            <h3 className={`text-base sm:text-lg font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Hourly Forecast
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
                {hourly.map(function(hour, index) {
                    return (
                        <div
                            key={index}
                            className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}
                            rounded-x1 shadow p-3 flex flex-col items-center min-w-[70px]`}
                        >
                            <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                                {hour.time}
                            </p>
                            <img
                                src={`https://openweathermap.org/img/wn/${hour.icon}.png`}
                                alt={hour.description}
                                className="w-10 h-10"
                            />
                            <p className={`text-sm font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                {hour.temp}°
                            </p>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                                {hour.description}
                            </p>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default HourlyForecast