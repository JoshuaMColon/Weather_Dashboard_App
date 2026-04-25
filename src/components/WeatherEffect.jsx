function WeatherEffect({ description }) {
    if (!description) return null

    const desc = description.toLowerCase()

    // --- THUNDERSTORM ---
    if (desc.includes("thunderstorm")) {
        const drops = Array.from({ length: 80 }, (_, i) => i)
        return (
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="lightning" />
                {drops.map(function(i) {
                    const left = Math.random() * 100
                    const duration = 0.4 + Math.random() * 0.4
                    const delay = Math.random() * 2
                    const height = 15 + Math.random() * 20
                    return (
                        <div
                        key={i}
                        className="raindrop"
                        style={{
                            left: `${left}%`,
                            height: `${height}px`,
                            animationDuration: `${duration}s`,
                            animationDelay: `${delay}s`,
                            top: 0,
                        }}
                        />
                    )
                })}
            </div>
        )
    }

    // --- RAIN / DRIZZLE ---
    if (desc.includes("rain") || desc.includes("drizzle")) {
        const drops = Array.from({ length: 60 }, (_, i) => i)
        return (
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                {drops.map(function(i) {
                    const left = Math.random() * 100
                    const duration = 0.6 + Math.random() * 0.6
                    const delay = Math.random() * 3
                    const height = 10 + Math.random() * 15
                    return (
                        <div
                        key={i}
                        className="raindrop"
                        style={{
                            left: `${left}%`,
                            height: `${height}px`,
                            animationDuration: `${duration}s`,
                            animationDelay: `${delay}s`,
                            top: 0,
                        }}
                        />
                    )
                })}
            </div>
        )
    }

    // --- SNOW ---
    if (desc.includes("snow")) {
        const flakes = Array.from({ length: 40 }, (_, i) => i)
        return (
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                {flakes.map(function(i) {
                    const left = Math.random() * 100
                    const duration = 3 + Math.random() * 4
                    const delay = Math.random() * 5
                    const size = 10 + Math.random() * 16
                    return (
                        <div
                            key={i}
                            className="snowflake"
                            style={{
                                left: `${left}%`,
                                fontSize: `${size}px`,
                                animationDuration: `${duration}s`,
                                animationDelay: `${delay}s`,
                                top: 0,
                            }}
                        >
                        ❄
                        </div>
                    )
                })}
            </div>
        )
    }

    // --- CLEAR / SUNNY ---
    if (desc.includes("clear") || desc.includes("sunny")) {
        return (
            <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center">
                <div
                    className="absolute text-yellow-300 text-9x1"
                    style={{
                        animation: "pulse-sun 3s ease-in-out infinite",
                        top: "5%",
                        right: "5%",
                        opacity: 0.5,
                        fontSize: "10rem",
                    }}
                >
                    ☀️
                </div>
            </div>
        )
    }

    // --- CLOUDY ---
    if (desc.includes("cloud") || desc.includes("overcast")) {
        const clouds = Array.from({ length: 5 }, (_, i) => i)
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {clouds.map(function(i) {
                const top = 5 + i * 12
                const duration = 20 + i * 8
                const delay = i * 4
                return (
                    <div
                        key={i}
                        className="cloud"
                        style={{
                            top: `${top}%`,
                            animationDuration: `${duration}s`,
                            animationDelay: `${delay}s`,
                        }}
                    >
                        ☁️
                    </div>
                )
            })}
        </div>
    )
}

    return null
}

export default WeatherEffect