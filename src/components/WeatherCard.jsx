// WeatherCard.jsx
// Displays weather data for on city

function WeatherCard({ data, darkMode }) {
//                     ^ data is a prop - the weather object from App.jsx

  // If no data yet, don't render anything
  if (!data) return null

  return (
    <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}
    rounded-2xl shadow-lg p-8 w-full max-w-md mt-6`}>

        <img
           src={`https://openweathermap.org/img/wn/${data.icon}@2x.png`}
           alt={data.description}
           className="w-20 h-20 -mb-2"
        />

        {/* City name and country */}
        <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {data.city}
        </h2>

        {/* Weather condition description */}
        <p className={`capitalize mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{data.description}</p>

        {/* Big temperature display */}
        <p className={`text-7xl font-light mt-4 mb-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            {data.temp}°F
        </p>

        {/* Details row */}
        <div className={`flex justify-between border-t pt-4 ${darkMode ? 'text-gray-300 border-gray-600' : 'text-gray-600'}`}>
            <div className="text-center">
                <p className="text-sm text-gray-400">Humidity</p>
                <p className="font-semibold">{data.humidity}%</p>
            </div>

            <div className="text-center">
                <p className="text-sm text-gray-400">Wind</p>
                <p className="font-semibold">{data.wind} mph</p>
            </div>

            <div className="text-center">
                <p className="text-sm text-gray-400">Feels Like</p>
                <p className="font-semibold">{data.feelsLike}°F</p>
            </div>
        </div>
    </div>
  )
}

export default WeatherCard