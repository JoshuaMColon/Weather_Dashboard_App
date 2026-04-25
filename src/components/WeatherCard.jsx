// WeatherCard.jsx
// Displays weather data for on city

function WeatherCard({ data }) {
//                     ^ data is a prop - the weather object from App.jsx

  // If no data yet, don't render anything
  if (!data) return null

  return (
    <div className="bg-white rounded-2x1 shadow-lg p-8 w-full max-w-md mt-6">

        {/* City name and country */}
        <h2 className="text-3x1 font-bold text-gray-800">
            {data.city}
        </h2>

        {/* Weather condition description */}
        <p className="text-gray-500 capitalize mt-1">{data.description}</p>

        {/* Big temperature display */}
        <p className="text-7x1 font-light text-blue-600 mt-4 mb-6">
            {data.temp}°F
        </p>

        {/* Details row */}
        <div className="flex justify-between text-gray-600 border-t pt-4">
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