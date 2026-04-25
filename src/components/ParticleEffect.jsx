import { useEffect, useMemo, useState } from "react"
import Particles, { initParticlesEngine } from "@tsparticles/react"
import { loadSlim } from "@tsparticles/slim"

function ParticleEffect({ description }) {
  const [init, setInit] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => setInit(true))
  }, [])

  const desc = description ? description.toLowerCase() : ""

  const particleOptions = useMemo(() => {
    if (desc.includes("thunderstorm")) {
      return {
        fullScreen: { enable: true, zIndex: 0 },
        particles: {
          number: { value: 200 },
          color: { value: "#93c5fd" },
          shape: { type: "line" },
          opacity: { value: 0.6 },
          size: { value: { min: 1, max: 3 } },
          move: {
            enable: true,
            speed: 25,
            direction: "bottom",
            straight: true,
          },
          rotate: { value: 10, direction: "clockwise" },
        },
        background: { color: { value: "transparent" } },
      }
    }
    return null
  }, [desc, init])

  // --- RAIN / DRIZZLE (pure CSS) ---
  if (desc.includes("rain") || desc.includes("drizzle")) {
    const drops = Array.from({ length: 80 }, (_, i) => i)
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9999 }}>
        {drops.map(function(i) {
          const left = Math.random() * 100
          const duration = 0.6 + Math.random() * 0.4
          const delay = Math.random() * 2
          const height = 15 + Math.random() * 20
          const opacity = 0.4 + Math.random() * 0.4
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${left}%`,
                top: "-30px",
                width: "2px",
                height: `${height}px`,
                background: "linear-gradient(to bottom, transparent, #93c5fd)",
                borderRadius: "2px",
                opacity: opacity,
                animation: `rain ${duration}s ${delay}s linear infinite`,
              }}
            />
          )
        })}
      </div>
    )
  }

  // --- SNOW (pure CSS) ---
  if (desc.includes("snow")) {
    const flakes = Array.from({ length: 60 }, (_, i) => i)
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9999 }}>
        {flakes.map(function(i) {
          const left = Math.random() * 100
          const duration = 3 + Math.random() * 4
          const delay = Math.random() * 5
          const size = 4 + Math.random() * 8
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${left}%`,
                top: "-20px",
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: "50%",
                background: "white",
                opacity: 0.7 + Math.random() * 0.3,
                animation: `snow ${duration}s ${delay}s linear infinite`,
              }}
            />
          )
        })}
      </div>
    )
  }

  // --- CLEAR / SUNNY (pure CSS) ---
  if (desc.includes("clear") || desc.includes("sunny")) {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {[...Array(6)].map(function(_, i) {
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "-10%",
                right: "-5%",
                width: "3px",
                height: "120vh",
                background: "linear-gradient(to bottom, rgba(253,224,71,0.6), transparent)",
                transformOrigin: "top right",
                transform: `rotate(${170 + i * 8}deg)`,
                opacity: 0.4,
                animation: `beam-pulse ${2 + i * 0.4}s ease-in-out infinite alternate`,
              }}
            />
          )
        })}
        <div
          style={{
            position: "absolute",
            top: "-60px",
            right: "-60px",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(253,224,71,0.8), rgba(251,191,36,0.3), transparent)",
            animation: "pulse-sun 3s ease-in-out infinite",
          }}
        />
      </div>
    )
  }

  // --- CLOUDY (pure CSS) ---
  if (desc.includes("cloud") || desc.includes("overcast")) {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {[...Array(6)].map(function(_, i) {
          const top = 5 + i * 12
          const duration = 25 + i * 10
          const delay = i * 5
          const scale = 0.8 + i * 0.2
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: `${top}%`,
                left: "-250px",
                animation: `drift ${duration}s ${delay}s linear infinite`,
                transform: `scale(${scale})`,
                opacity: 0.6,
              }}
            >
              <div style={{ position: "relative", width: "200px", height: "80px" }}>
                <div style={{
                  position: "absolute", bottom: 0, left: "20px",
                  width: "100px", height: "60px", borderRadius: "50px",
                  background: "rgba(209,213,219,0.9)",
                }} />
                <div style={{
                  position: "absolute", bottom: "20px", left: "30px",
                  width: "70px", height: "70px", borderRadius: "50%",
                  background: "rgba(209,213,219,0.9)",
                }} />
                <div style={{
                  position: "absolute", bottom: "25px", left: "70px",
                  width: "80px", height: "80px", borderRadius: "50%",
                  background: "rgba(229,231,235,0.95)",
                }} />
                <div style={{
                  position: "absolute", bottom: "15px", left: "110px",
                  width: "60px", height: "60px", borderRadius: "50%",
                  background: "rgba(209,213,219,0.9)",
                }} />
                <div style={{
                  position: "absolute", bottom: 0, left: "80px",
                  width: "90px", height: "55px", borderRadius: "50px",
                  background: "rgba(209,213,219,0.9)",
                }} />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (!init || !particleOptions) return null

  return <Particles id="tsparticles" options={particleOptions} />
}

export default ParticleEffect