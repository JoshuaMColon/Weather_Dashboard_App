function WeatherCard({ data, darkMode }) {
  if (!data) return null

  return (
    <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}
    rounded-2xl shadow-lg p-6 sm:p-8 w-full mt-6`}>

      <img
        src={`https://openweathermap.org/img/wn/${data.icon}@2x.png`}
        alt={data.description}
        className="w-16 h-16 sm:w-20 sm:h-20 -mb-2"
      />

      <h2 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        {data.city}
      </h2>

      <p className={`capitalize mt-1 text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
        {data.description}
      </p>

      <p className={`text-6xl sm:text-7xl font-light mt-4 mb-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
        {data.temp}°F
      </p>

      <div className={`flex justify-between border-t pt-4 ${darkMode ? 'text-gray-300 border-gray-600' : 'text-gray-600'}`}>
        <div className="text-center">
          <p className="text-xs sm:text-sm text-gray-400">Humidity</p>
          <p className="font-semibold text-sm sm:text-base">{data.humidity}%</p>
        </div>
        <div className="text-center">
          <p className="text-xs sm:text-sm text-gray-400">Wind</p>
          <p className="font-semibold text-sm sm:text-base">{data.wind} mph</p>
        </div>
        <div className="text-center">
          <p className="text-xs sm:text-sm text-gray-400">Feels Like</p>
          <p className="font-semibold text-sm sm:text-base">{data.feelsLike}°F</p>
        </div>
      </div>
    </div>
  )
}

export default WeatherCard