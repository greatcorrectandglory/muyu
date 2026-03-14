import React, { useCallback, useEffect, useRef, useState } from "react";
import { Settings, Sparkles, Volume2, VolumeX } from "lucide-react";
import templeImage from "./temple-bg.jpg";
import frameIdle from "../1.jpg";
import frameStrike from "../2.jpg";

const STRIKE_X = "25%";
const STRIKE_Y = "66%";

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
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }, []);

  const tap = useCallback(() => {
    setMerit((prev) => prev + 1);
    setIsStriking(true);
    setTimeout(() => setIsStriking(false), 110);

    const id = Date.now() + Math.random();
    setFloaters((prev) => [
      ...prev,
      {
        id,
        dx: Math.random() * 54 - 27,
        dy: Math.random() * 16 - 8,
      },
    ]);

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
        className="absolute inset-0 scale-105 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${templeImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#1d120b]/88 via-[#28180f]/78 to-[#140a05]/92" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col justify-between px-5 py-6">
        <section className="rounded-3xl border border-[#9f7a43]/50 bg-[#2c1d14]/72 p-5 shadow-[0_10px_35px_rgba(0,0,0,0.45)] backdrop-blur-sm">
          <p className="text-[11px] tracking-[0.22em] text-[#d8be8a]">累计功德</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <h1 className="text-5xl font-black tabular-nums text-[#f9e5b6]">{merit.toLocaleString()}</h1>
            <div className="rounded-full border border-[#b1884c] bg-[#4e321f]/60 px-4 py-1 text-sm font-bold text-[#f7dba5]">
              {zenLevel}
            </div>
          </div>
        </section>

        <section className="relative flex flex-1 items-center justify-center py-5">
          <div className="relative h-[clamp(320px,70vw,470px)] w-full max-w-[30rem]">
            <div className="absolute inset-0 overflow-hidden rounded-[2rem] border border-[#9f7a43]/40 bg-[#201108]/50 shadow-[0_18px_42px_rgba(0,0,0,0.45)]">
              <img
                src={isStriking ? frameStrike : frameIdle}
                alt="敲击木鱼人物"
                className="pointer-events-none h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1d1008]/18 via-transparent to-[#1d1008]/3" />
            </div>

            {floaters.map((item) => (
              <div
                key={item.id}
                className="pointer-events-none absolute z-30"
                style={{
                  left: `calc(${STRIKE_X} + ${item.dx}px)`,
                  top: `calc(${STRIKE_Y} + ${item.dy}px)`,
                }}
              >
                <div className="animate-merit-float text-2xl font-extrabold text-[#ffe3a1]">功德 +1</div>
              </div>
            ))}

            <button
              onClick={tap}
              aria-label="敲击木鱼"
              className="absolute z-40 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-xl bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-[#d9b57a]/80"
              style={{
                left: STRIKE_X,
                top: STRIKE_Y,
                width: "clamp(120px, 30vw, 168px)",
                height: "clamp(56px, 14vw, 84px)",
              }}
            />

            <p className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap text-sm font-bold tracking-[0.16em] text-[#ebd1a0]">
              <span className="inline-flex items-center gap-2">
                <Sparkles size={14} />
                一念一击，积善修心
                <Sparkles size={14} />
              </span>
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-[#9f7a43]/60 bg-[#2c1d14]/72 p-5 shadow-[0_10px_35px_rgba(0,0,0,0.45)] backdrop-blur-sm">
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
                onChange={(event) => setAutoSpeed(Number(event.target.value))}
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
            transform: translateY(0) scale(0.9);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          100% {
            transform: translateY(-110px) scale(1.08);
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
