import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useEffect, useMemo, useState } from "react";

function ParticleEffect({ description, icon }) {
  const [init, setInit] = useState(false);
  const [viewport, setViewport] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1280,
    height: typeof window !== "undefined" ? window.innerHeight : 900,
  });

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setInit(true));

    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const desc = description ? description.toLowerCase() : "";
  const isNight = icon && icon.endsWith("n");

  const particleOptions = useMemo(() => {
    if (desc.includes("thunderstorm")) {
      const count =
        viewport.width < 640 ? 120 : viewport.width < 1024 ? 180 : 260;
      return {
        fullScreen: { enable: false, zIndex: 0 },
        particles: {
          number: { value: count },
          color: { value: "#93c5fd" },
          shape: { type: "line" },
          opacity: { value: 0.6 },
          size: { value: { min: 1, max: 3 } },
          move: {
            enable: true,
            speed: viewport.width < 640 ? 20 : 30,
            direction: "bottom",
            straight: true,
          },
          rotate: { value: 10, direction: "clockwise" },
        },
        background: { color: { value: "transparent" } },
      };
    }
    return null;
  }, [desc, init, viewport]);

  if (desc.includes("rain") || desc.includes("drizzle")) {
    const dropCount =
      viewport.width < 640 ? 50 : viewport.width < 1024 ? 70 : 100;
    const drops = Array.from({ length: dropCount }, (_, i) => i);

    return (
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {drops.map((i) => {
          const left = Math.random() * 100;
          const duration = 0.7 + Math.random() * 0.4;
          const delay = Math.random() * 2;
          const height = 12 + Math.random() * 20;
          const opacity = 0.35 + Math.random() * 0.35;
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
                opacity,
                animation: `rain ${duration}s ${delay}s linear infinite`,
              }}
            />
          );
        })}
      </div>
    );
  }

  if (desc.includes("snow")) {
    const flakeCount =
      viewport.width < 640 ? 40 : viewport.width < 1024 ? 60 : 80;
    const flakes = Array.from({ length: flakeCount }, (_, i) => i);

    return (
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {flakes.map((i) => {
          const left = Math.random() * 100;
          const duration = 3 + Math.random() * 4;
          const delay = Math.random() * 5;
          const size = 4 + Math.random() * 8;
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
          );
        })}
      </div>
    );
  }

  if (desc.includes("clear") || desc.includes("sunny")) {
    if (isNight) {
      return (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div
            style={{
              position: "absolute",
              top: "-10px",
              right: "-20px",
              width: `${Math.min(280, viewport.width * 0.24)}px`,
              height: `${Math.min(280, viewport.width * 0.24)}px`,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.6), rgba(255,255,255,0.15) 35%, transparent 65%)",
              filter: "blur(30px)",
              animation: "pulse-sun 3s ease-in-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "-60px",
              right: "-100px",
              width: `${Math.min(400, viewport.width * 0.32)}px`,
              height: `${Math.min(400, viewport.width * 0.32)}px`,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.25), transparent 60%)",
              filter: "blur(40px)",
            }}
          />
        </div>
      );
    }

    return (
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "-16%",
              left: `${-28 + i * 1.4}%`,
              width: `${14 + (i % 4) * 4}px`,
              height: `${viewport.height * 1.8}px`,
              background:
                "linear-gradient(180deg, rgba(253,224,71,1), transparent 70%)",
              transformOrigin: "top left",
              transform: `rotate(${14 + i * 3.4}deg)`,
              opacity: 0.82 + (i % 2) * 0.05,
              animation: `beam-pulse ${0.9 + i * 0.08}s ease-in-out infinite alternate`,
              filter: "blur(1.2px)",
              boxShadow:
                "0 0 28px rgba(255,255,255,0.22), 0 0 26px rgba(253,224,71,0.45)",
              borderLeft: "1px solid rgba(255,255,255,0.2)",
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            top: "-30px",
            left: "-32px",
            width: `${Math.min(420, viewport.width * 0.34)}px`,
            height: `${viewport.height * 2.4}px`,
            background:
              "linear-gradient(180deg, rgba(253,224,71,0.62), transparent 42%)",
            transform: "rotate(22deg)",
            opacity: 0.78,
            filter: "blur(16px)",
            boxShadow: "0 0 60px rgba(255,255,255,0.18)",
          }}
        />
      </div>
    );
  }

  if (desc.includes("cloud") || desc.includes("overcast")) {
    const cloudCount = viewport.width < 640 ? 4 : 6;
    return (
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {[...Array(cloudCount)].map((_, i) => {
          const top =
            8 +
            ((i * (viewport.height / (cloudCount + 2))) / viewport.height) * 25;
          const duration = 16 + Math.random() * 8;
          const delay = -Math.random() * 18;
          const size = viewport.width < 640 ? 0.9 : 1.1;
          return (
            <div
              key={i}
              className="mist-cloud"
              style={{
                top: `${top}%`,
                left: "-25%",
                animation: `drift ${duration}s ${delay}s linear infinite`,
                width: `${Math.min(340, viewport.width * 0.28) * size}px`,
                height: `${Math.max(90, viewport.height * 0.11) * size}px`,
                opacity: 0.45 + Math.random() * 0.2,
              }}
            />
          );
        })}
      </div>
    );
  }

  if (!init || !particleOptions) return null;

  return <Particles id="tsparticles" options={particleOptions} />;
}

export default ParticleEffect;
