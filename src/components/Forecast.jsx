function Forecast({ forecast }) {
    if (!forecast || forecast.length === 0) return null

    return (
        <div className="w-full max-w-md mt-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">5-Day Forecast</h3>
            <div classname="grid grid-cols-5 gap-2">
                {forecast.map((day, index) => {
                    return (
                    <div key={index} classname="bg-white rounded-x1 shadow p-3 flex flex-col items-center">
                        <p className="text-xs text-gray-400 font-medium">{day.date}</p>
                        <img
                            src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                            alt={day.description}
                            className="w-10 h-10"
                        />
                        <p className="text-sm font-bold text-blue-600">{day.high}°</p>
                        <p className="text-xs text-gray-400">{day.low}°</p>
                    </div>
                    )
                })}
            </div>
        </div>
    )
}

export default Forecast