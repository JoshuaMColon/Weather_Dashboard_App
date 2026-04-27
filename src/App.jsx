import { useState } from "react"
import SearchBar from "./components/SearchBar"
import WeatherCard from "./components/WeatherCard"
import ErrorMessage from "./components/ErrorMessage"
import Forecast from "./components/Forecast"
import ParticleEffect from "./components/ParticleEffect"
import HourlyForecast from "./components/HourlyForecast"
import "./index.css"

// PASTE API KEY HERE -from openweathermap.org
const API_KEY = "67e4d35f91b2b4fd1bc7aba12df35444"

export default function App() {
  
  // State: weather data object (null = no search yet)
  const [weather, setWeather] = useState("")

  // State: error message string (empty = no error)
  const [error, setError] =useState("")

  // State: true while waiting for API response
  const [loading, setLoading] = useState(false)

  const [forecast, setForecast] = useState([])
  const [showForecast, setShowForecast] = useState(false)

  const [darkMode, setDarkMode] = useState(false)

  const [hourly, setHourly] = useState([])

  // This function runs when the user clicks Search
  // async = this function contsains await (waits for data)
  async function handleSearch(city) {

    setError("")       // clear any previous error
    setWeather(null)  // clear previous weather
    setForecast([])   // clear previous forecast
    setShowForecast(false) // hide forecast until new data loads
    setLoading(true) //show loading state
    setHourly([]) // clear previous hourly forecast

    try {
      // Fetch weather data from OpenWeatherMap
      // Template literal (backtick string) builds the URL dynamically
      const url =
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=imperial`
      const response = await fetch(url)

      // If city not found, the API returns a 404
      if (!response.ok) {
        setError("City not found. Check the spelling and try again.")
        return
      }
      
      // Parse the JSON response into a JavaScript object
      const data = await response.json()

      // Pull out the values we need and save them in state
      setWeather({
        city: data.name,
        temp: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        wind: Math.round(data.wind.speed),
        description: data.weather[0].description,
        // Inside setWeather({...}), add this line:
        icon: data.weather[0].icon,
      })
      console.log("Weather description:", data.weather[0].description)

      // Fetch 5-day forecast
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=imperial`
      const forecastRes = await fetch(forecastUrl)
      const forecastData = await forecastRes.json()

      // Filter to one entry per day at noon
      const daily = forecastData.list.filter(item => item.dt_txt.includes("12:00:00")
    )

    setForecast(daily.map(day => ({
      date: new Date(day.dt_txt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      high: Math.round(day.main.temp_max),
      low: Math.round(day.main.temp_min),
      description: day.weather[0].description,
      icon: day.weather[0].icon,
    })))

    // Hour forecast - next 8 entries (24 hours)
    const next24 = forecastData.list.slice(0, 8)

    setHourly(next24.map(hour => ({
      time: new Date(hour.dt_txt).toLocaleTimeString("en-US", {
        hour: "numeric",
        hour12: true,
      }),
      temp: Math.round(hour.main.temp),
      description: hour.weather[0].description,
      icon: hour.weather[0].icon,
    })))
       
    
    } catch (err) {
      console.log("Error: ", err)
      setError("Something went wrong. Check your internet connection.")

    } finally {
      setLoading(false) // always stop loading, success or fail
    }
  }

  // Dynamic bakcground color based on temperature
  const bgColor = darkMode 
    ? 'from-gray-900 to-gray-800'
    : !weather ? 'from-blue-50 to-blue-100'
    : weather.temp >= 80 ? 'from-orange-50 to-orange-100'
    : weather.temp >= 60 ? 'from-yellow-50 to-yellow-100'
    : 'from-blue-50 to-blue-200'

  return (
    <div className={`relative min-h-screen bg-gradient-to-br ${bgColor} flex flex-col items-center justify-start pt-12 px-4 pb-10`}>

      {/* Dark mode toggle button */}
      <button
        onClick={(() => setDarkMode(!darkMode))}
        className="absolute top-4 right-4 px-3 py-1.5 rounded-lg font-semibold
        text-sm cursor-pointer transition-colors bg-gray-200 text-gray-800 hover:bg-gray-300"
      >
        {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
      </button>

      {/* Weather effects */}
      <ParticleEffect description={weather ? weather.description : ""} />

      {/* App Title */}
      <h1 className={`text-4x1 sm:text-4x1 font-bold mb-2 text-center ${darkMode ? 'text-white' : 'text-blue-900'} mb-2`}>
        Weather Dashboard
      </h1>
      <p className={`text-sm sm:text-base mb-6 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Search any city in the world
      </p>

      {/* Search bar - onSearch prop passes the function down */}
      <SearchBar onSearch={handleSearch} />

      {/* Loading spinnder */}
      {loading && (
        <p className="text-blue-600 mt-6 animate-pulse">Loading...</p>
      )}

      <div className="w-full max-w-md px-2">
        <ErrorMessage message={error} />
        <WeatherCard data={weather} darkMode={darkMode}/>
      </div>

      {/* Hourly forecast - shows automatically after search */}
      <div className="w-full max-w-md px-2">
        <HourlyForecast hourly={hourly} darkMode={darkMode} />
      </div>


      {/* ✅ Toggle button — only shows after a successful search */}
      {forecast.length > 0 && (
        <button
          onClick={() => setShowForecast(!showForecast)}
          className="mt-6 px-6 py-2 bg-blue-600 text-white font-semibold
          rounded-lg hover:bg-blue-700 cursor-pointer transition-colors z-10"
        >
          {showForecast ? "Hide Forecast" : "Show 5-Day Forecast"}
        </button>
      )}

      {/* ✅ Forecast — only shows when button is toggled on */}
      {showForecast && (
        <div className="w-full max-w-md px-2">
          <Forecast forecast={forecast} darkMode={darkMode} />
        </div>
      )}

    </div>
  )
}