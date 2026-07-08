Weather Dashboard 🌦️

A responsive, modern weather application built with React, Tailwind CSS, and the OpenWeatherMap API.
Users can search any city in the world and instantly view current conditions, hourly forecasts, and a 5‑day outlook — all wrapped in a dynamic UI with light/dark mode and animated particle effects.

---

📌 Features

• City Search — Enter any city name to fetch real-time weather data.
• Current Weather Card — Temperature, humidity, wind speed, description, and weather icon.
• Hourly Forecast (Next 24 Hours) — Displays the next 8 forecast entries.
• 5‑Day Forecast — Noon snapshots for each day, toggleable with a button.
• Dynamic Backgrounds — Background gradient changes based on temperature.
• Dark Mode Toggle — Smooth switch between light and dark themes.
• Particle Weather Effects — Visual effects based on weather conditions.
• Error Handling — Friendly messages for invalid cities or network issues.
• Loading State — Animated loading indicator while fetching data.


---

🛠️ Tech Stack

• React (Functional components + Hooks)
• Tailwind CSS
• OpenWeatherMap API
• Custom components:• SearchBar
• WeatherCard
• Forecast
• HourlyForecast
• ParticleEffect
• ErrorMessage



---

📂 Project Structure

src/
│ App.jsx
│ index.css
│ components/
│   ├── SearchBar.jsx
│   ├── WeatherCard.jsx
│   ├── Forecast.jsx
│   ├── HourlyForecast.jsx
│   ├── ParticleEffect.jsx
│   └── ErrorMessage.jsx


---

🔑 API Setup

This project uses the OpenWeatherMap API.

1. Create an account at:
https://openweathermap.org/api
2. Generate an API key.
3. Paste your key inside App.jsx:


const API_KEY =


---

🚀 Getting Started

1. Install dependencies

npm install


2. Run the development server

npm run dev


3. Open your browser

Visit:

http://localhost:5173


---

🔍 How It Works

Searching for a City

When the user enters a city name, handleSearch() runs:

• Clears previous data
• Shows loading state
• Fetches current weather
• Fetches 5‑day forecast
• Extracts hourly forecast
• Updates UI with new data


Current Weather Endpoint

https://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=imperial


Forecast Endpoint

https://api.openweathermap.org/data/2.5/forecast?q={city}&appid={API_KEY}&units=imperial


Forecast Processing

• Filters forecast to 12:00 PM entries for each day
• Extracts next 8 entries for hourly forecast


---

🎨 Dynamic Background Logic

The background gradient changes based on temperature:

• 80°F+ → warm orange
• 60–79°F → yellow
• Below 60°F → cool blue
• Dark mode → gray/black gradient


---

🌙 Dark Mode

A simple toggle updates the darkMode state and adjusts:

• Text colors
• Background gradient
• Component styling


---

⚠️ Error Handling

The app gracefully handles:

• Invalid city names
• Network issues
• Missing API responses


Errors display through the ErrorMessage component.
