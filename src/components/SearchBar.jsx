import { useState } from "react";

function SearchBar({ onSearch }) {
  const [city, setCity] = useState("");

  function handleSearch() {
    if (city.trim() === "") return;
    onSearch(city);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSearch();
  }

  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row">
      <label className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-200">
        <span className="text-lg">🔍</span>
        <input
          type="text"
          placeholder="Enter a city..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full border-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 sm:text-base"
        />
      </label>
      <button
        onClick={handleSearch}
        className="w-full rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 sm:w-auto"
      >
        Search
      </button>
    </div>
  );
}

export default SearchBar;
