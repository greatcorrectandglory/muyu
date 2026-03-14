import React, { useState, useEffect, useCallback, useRef } from "react";
import { Sparkles, Settings, Volume2, VolumeX } from "lucide-react";
import templeImage from "./temple-bg.jpg";

const getLevel = (count) => {
  if (count > 10000) return "大德菩萨";
  if (count > 5000) return "云端罗汉";
  if (count > 2000) return "数字法师";
  if (count > 500) return "修行居士";
  if (count > 100) return "精进敲鱼人";
  return "初阶敲鱼人";
};

const App = () => {
  const [merit, setMerit] = useState(0);
  const [isAuto, setIsAuto] = useState(false);
  const [autoSpeed, setAutoSpeed] = useState(800);
  const [floaters, setFloaters] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isStriking, setIsStriking] = useState(false);
  const [zenLevel, setZenLevel] = useState("初阶敲鱼人");

  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    setZenLevel(getLevel(merit));
  }, [merit]);

  const playWoodFishSound = useCallback(() => {
    if (typeof window === "undefined") return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioRef.current) {
      audioRef.current = new AudioCtx();
    }

    const ctx = audioRef.current;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(170, now + 0.14);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);
  }, []);

  const tap = useCallback(() => {
    setMerit((prev) => prev + 1);
    setIsStriking(true);
    setTimeout(() => setIsStriking(false), 90);

    const id = Date.now() + Math.random();
    setFloaters((prev) => [...prev, { id, x: Math.random() * 84 - 42 }]);
    setTimeout(() => {
      setFloaters((prev) => prev.filter((item) => item.id !== id));
    }, 1000);

    if (!isMuted) {
      playWoodFishSound();
    }
  }, [isMuted, playWoodFishSound]);

  useEffect(() => {
    if (isAuto) {
      timerRef.current = setInterval(tap, autoSpeed);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAuto, autoSpeed, tap]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#2c1d14] text-[#f5e7c8]">
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center opacity-35"
        style={{ backgroundImage: `url(${templeImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#1f120a]/85 via-[#2a1a0f]/65 to-[#160b06]/90" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col justify-between px-5 py-6">
        <section className="rounded-3xl border border-[#9f7a43]/50 bg-[#2c1d14]/70 p-5 shadow-[0_10px_35px_rgba(0,0,0,0.45)] backdrop-blur-sm">
          <p className="text-[11px] tracking-[0.22em] text-[#d8be8a]">累计功德</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <h1 className="text-5xl font-black tabular-nums text-[#f9e5b6]">{merit.toLocaleString()}</h1>
            <div className="rounded-full border border-[#b1884c] bg-[#4e321f]/60 px-4 py-1 text-sm font-bold text-[#f7dba5]">
              {zenLevel}
            </div>
          </div>
        </section>

        <section className="relative flex flex-1 flex-col items-center justify-center py-8">
          {floaters.map((item) => (
            <div
              key={item.id}
              style={{ left: `calc(50% + ${item.x}px)` }}
              className="pointer-events-none absolute top-1/2 -translate-y-32 animate-merit-float text-2xl font-extrabold text-[#ffe3a1]"
            >
              功德 +1
            </div>
          ))}

          <button
            onClick={tap}
            className={`relative outline-none transition-transform duration-100 ${
              isStriking ? "scale-110 -rotate-2" : "scale-100"
            }`}
            aria-label="敲击木鱼"
          >
            <svg width="240" height="180" viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="wood-body" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#845126" />
                  <stop offset="55%" stopColor="#6d3f1b" />
                  <stop offset="100%" stopColor="#4a2b11" />
                </linearGradient>
                <radialGradient id="wood-light" cx="0.35" cy="0.25" r="0.9">
                  <stop offset="0%" stopColor="#b57a41" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#6d3f1b" stopOpacity="0" />
                </radialGradient>
              </defs>

              <ellipse cx="120" cy="98" rx="95" ry="62" fill="url(#wood-body)" stroke="#3e200e" strokeWidth="6" />
              <ellipse cx="120" cy="98" rx="58" ry="35" fill="none" stroke="#c69054" strokeWidth="5" opacity="0.78" />
              <ellipse cx="120" cy="98" rx="94" ry="62" fill="url(#wood-light)" />
              <path d="M55 57C80 32 160 30 185 57" stroke="#d8ad72" strokeWidth="4" strokeLinecap="round" opacity="0.65" />
              <circle cx="172" cy="97" r="6" fill="#2f1609" />

              <g transform={isStriking ? "translate(12,6) rotate(10 48 32)" : ""}>
                <rect x="30" y="26" width="88" height="13" rx="6.5" fill="#b6874f" />
                <circle cx="34" cy="32.5" r="16" fill="#8b592b" stroke="#41210e" strokeWidth="3" />
                <circle cx="34" cy="32.5" r="8" fill="#6e431f" />
              </g>
            </svg>
          </button>

          <p className="mt-5 flex items-center gap-2 text-sm font-bold tracking-[0.18em] text-[#e4c891]">
            <Sparkles size={14} />
            一念一击，积善修心
            <Sparkles size={14} />
          </p>
        </section>

        <section className="rounded-3xl border border-[#9f7a43]/60 bg-[#2c1d14]/70 p-5 shadow-[0_10px_35px_rgba(0,0,0,0.45)] backdrop-blur-sm">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#f2dbad]">
                <div className={`rounded-xl p-2 ${isAuto ? "bg-[#a4773e] text-[#2d1b0f]" : "bg-[#4a2f1c] text-[#d3b078]"}`}>
                  <Settings size={18} />
                </div>
                自动敲击
              </div>
              <button
                onClick={() => setIsAuto((prev) => !prev)}
                className={`relative h-7 w-14 rounded-full transition-colors ${isAuto ? "bg-[#b78a4f]" : "bg-[#5c3a22]"}`}
                aria-label="切换自动敲击"
              >
                <div
                  className={`absolute top-1 h-5 w-5 rounded-full bg-[#f8e2b1] transition-all ${
                    isAuto ? "left-8" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-xs font-semibold text-[#d8be8a]">
                <span>敲击频率</span>
                <span>{autoSpeed}ms</span>
              </div>
              <input
                type="range"
                min="100"
                max="1500"
                step="50"
                value={autoSpeed}
                onChange={(e) => setAutoSpeed(Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#5c3b23] accent-[#d5aa69]"
              />
            </div>

            <div className="mt-1 flex gap-3">
              <button
                onClick={() => setIsMuted((prev) => !prev)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-colors ${
                  isMuted ? "bg-[#4a2f1c] text-[#d3b078]" : "bg-[#b98b50] text-[#2a180e]"
                }`}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                {isMuted ? "静音" : "音效开"}
              </button>
              <button
                onClick={() => {
                  if (window.confirm("确定重置功德吗？")) setMerit(0);
                }}
                className="rounded-xl border border-[#8b673a] px-4 py-2.5 text-sm font-bold text-[#e3c892] transition-colors hover:bg-[#51331f]"
              >
                重置
              </button>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        @keyframes merit-float {
          0% {
            transform: translateY(0) scale(0.92);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translateY(-96px) scale(1.08);
            opacity: 0;
          }
        }

        .animate-merit-float {
          animation: merit-float 1s ease-out forwards;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          border: 2px solid #f8e2b1;
          background: #d2a56a;
        }

        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          border: 2px solid #f8e2b1;
          background: #d2a56a;
        }
      `}</style>
    </div>
  );
};

export default App;
