import { useState } from "react"
// SearchBar.jsx
// This component handles user input for city search

function SearchBar({ onSearch }) {
//                   ^ props - parent passes in onSearch function

    // useState holds the current text the user has typed
    // city = the current value. setCity = function to change it
    const [city, setCity] = useState("")

    function handleSearch() {
        if (city.trim() === '') return // don't search empty input
        onSearch(city)                 // call the function from parent
    }

    function handleKeyDown(e) {
        if (e.key === "Enter") handleSearch() // search on Enter Key
    }

    return (
        <div className="flex gap-2 w-full">
      <input
        type="text"
        placeholder="Enter a city..."
        value={city}
        onChange={(e) => setCity(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 px-3 py-2 sm:px-4 sm:py-2 rounded-lg border border-gray-300
        focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-sm sm:text-base"
      />
      <button
        onClick={handleSearch}
        className="px-4 py-2 sm:px-6 bg-blue-600 text-white font-semibold
        text-sm sm:text-base rounded-lg hover:bg-blue-700 cursor-pointer transition-colors
        whitespace-nowrap"
      >
        Search
      </button>
    </div>
  )
}

export default SearchBar