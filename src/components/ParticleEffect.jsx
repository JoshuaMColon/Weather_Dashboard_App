import { useEffect, useMemo, useState } from "react"
import Particles, { initParticlesEngine } from "@tsparticles/react"
import { loadSlim } from "@tsparticles/slim"

function ParticleEffect({ description, icon }) {
  const [init, setInit] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => setInit(true))
  }, [])

  const desc = description ? description.toLowerCase() : ""
  const isNight = icon && icon.endsWith('n')

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
  if ((desc.includes("clear") || desc.includes("sunny"))) {
    // Night time - show moon
    if (isNight) {
      return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Main glow - soft light source */}
          <div
            style={{
              position: "absolute",
              top: "-10px",
              right: "-20px",
              width: "280px",
              height: "280px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,255,255,0.6), rgba(255,255,255,0.15) 35%, transparent 65%)",
              filter: "blur(30px)",
              animation: "pulse-sun 3s ease-in-out infinite",
            }}
          />
          {/* Extended ambient light */}
          <div
            style={{
              position: "absolute",
              top: "-60px",
              right: "-100px",
              width: "400px",
              height: "400px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,255,255,0.25), transparent 60%)",
              filter: "blur(40px)",
            }}
          />
        </div>
      )
    }
    // Daytime - show sun beams
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {[...Array(12)].map(function(_, i) {
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "-16%",
                left: `${-28 + i * 1.4}%`,
                width: `${14 + (i % 4) * 4}px`,
                height: "240vh",
                background: "linear-gradient(180deg, rgba(253,224,71,1), transparent 70%)",
                transformOrigin: "top left",
                transform: `rotate(${14 + i * 3.4}deg)`,
                opacity: 0.82 + (i % 2) * 0.05,
                animation: `beam-pulse ${0.9 + i * 0.08}s ease-in-out infinite alternate`,
                filter: "blur(1.2px)",
                boxShadow: "0 0 28px rgba(255,255,255,0.22), 0 0 26px rgba(253,224,71,0.45)",
                borderLeft: "1px solid rgba(255,255,255,0.2)",
              }}
            />
          )
        })}
        <div
          style={{
            position: "absolute",
            top: "-30px",
            left: "-32px",
            width: "420px",
            height: "260vh",
            background: "linear-gradient(180deg, rgba(253,224,71,0.62), transparent 42%)",
            transform: "rotate(22deg)",
            opacity: 0.78,
            filter: "blur(16px)",
            boxShadow: "0 0 60px rgba(255,255,255,0.18)",
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
          const duration = 18 + Math.random() * 10
          const delay = -Math.random() * 18
          const scale = 0.8 + Math.random() * 0.4
          return (
            <div
              key={i}
              className="mist-cloud"
              style={{
                top: `${top}%`,
                left: "-25%",
                animation: `drift ${duration}s ${delay}s linear infinite`,
                transform: `scale(${scale})`,
                opacity: 0.45 + Math.random() * 0.2,
              }}
            />
          )
        })}
      </div>
    )
  }

  if (!init || !particleOptions) return null

  return <Particles id="tsparticles" options={particleOptions} />
}

export default ParticleEffect