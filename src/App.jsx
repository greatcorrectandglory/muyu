import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Cloud, LogIn, LogOut, Settings, Sparkles, Volume2, VolumeX } from "lucide-react";
import templeImage from "./temple-bg.jpg";
import frameIdle from "../1.jpg";
import frameStrike from "../2.jpg";
import { loadPendingDelta, savePendingDelta } from "./lib/pendingDeltaStore";
import { isSupabaseConfigured, supabase } from "./lib/supabaseClient";

const STRIKE_X = "25%";
const STRIKE_Y = "66%";
const FLUSH_INTERVAL_MS = 5000;
const FLUSH_THRESHOLD = 20;

const getLevel = (count) => {
  if (count > 10000) return "Grandmaster";
  if (count > 5000) return "Cloud Monk";
  if (count > 2000) return "Digital Master";
  if (count > 500) return "Dedicated Cultivator";
  if (count > 100) return "Beginner Monk";
  return "Novice";
};

const parseRpcMerit = (data, fallback) => {
  if (typeof data === "number") return data;
  if (typeof data === "string") {
    const parsed = Number.parseInt(data, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  if (Array.isArray(data) && data.length > 0) {
    const row = data[0];
    if (typeof row === "number") return row;
    if (typeof row?.merit_total === "number") return row.merit_total;
    if (typeof row?.merit_total === "string") {
      const parsed = Number.parseInt(row.merit_total, 10);
      return Number.isFinite(parsed) ? parsed : fallback;
    }
  }

  if (typeof data?.merit_total === "number") return data.merit_total;
  if (typeof data?.merit_total === "string") {
    const parsed = Number.parseInt(data.merit_total, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

const App = () => {
  const [isAuto, setIsAuto] = useState(false);
  const [autoSpeed, setAutoSpeed] = useState(800);
  const [floaters, setFloaters] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isStriking, setIsStriking] = useState(false);
  const [isPageHidden, setIsPageHidden] = useState(false);

  const [remoteMeritTotal, setRemoteMeritTotal] = useState(0);
  const [localPendingDelta, setLocalPendingDelta] = useState(() => loadPendingDelta());
  const [syncStatus, setSyncStatus] = useState(isSupabaseConfigured ? "idle" : "disabled");
  const [syncError, setSyncError] = useState("");

  const [session, setSession] = useState(null);
  const [emailInput, setEmailInput] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const pendingRef = useRef(localPendingDelta);
  const remoteRef = useRef(remoteMeritTotal);
  const sessionRef = useRef(session);
  const isFlushingRef = useRef(false);

  const displayMerit = remoteMeritTotal + localPendingDelta;
  const zenLevel = useMemo(() => getLevel(displayMerit), [displayMerit]);
  const isLoggedIn = Boolean(session?.user);
  const shouldRunAutoTap = isAuto && !isPageHidden;

  useEffect(() => {
    pendingRef.current = localPendingDelta;
    savePendingDelta(localPendingDelta);
  }, [localPendingDelta]);

  useEffect(() => {
    remoteRef.current = remoteMeritTotal;
  }, [remoteMeritTotal]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const handleVisibilityChange = () => {
      setIsPageHidden(document.hidden);
    };

    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

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
    setLocalPendingDelta((prev) => prev + 1);
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
    if (!shouldRunAutoTap) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return undefined;
    }

    timerRef.current = setInterval(tap, autoSpeed);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [autoSpeed, shouldRunAutoTap, tap]);

  const flushPendingDelta = useCallback(async (force = false) => {
    if (!supabase || !sessionRef.current) return false;
    if (isFlushingRef.current) return false;

    const delta = pendingRef.current;
    if (delta <= 0) return true;
    if (!force && delta < FLUSH_THRESHOLD) return true;

    isFlushingRef.current = true;
    setSyncStatus("syncing");
    setSyncError("");

    try {
      const { data, error } = await supabase.rpc("increment_merit", { p_delta: delta });
      if (error) throw error;

      const nextRemote = parseRpcMerit(data, remoteRef.current + delta);
      setRemoteMeritTotal(nextRemote);
      setLocalPendingDelta((prev) => Math.max(0, prev - delta));
      setSyncStatus("idle");
      return true;
    } catch (error) {
      setSyncStatus("offline");
      setSyncError(error?.message ?? "Unknown sync error");
      return false;
    } finally {
      isFlushingRef.current = false;
    }
  }, []);

  const bootstrapRemoteState = useCallback(async () => {
    if (!supabase || !sessionRef.current) return false;

    setSyncStatus("syncing");
    setSyncError("");

    const { data, error } = await supabase.rpc("increment_merit", { p_delta: 0 });
    if (error) {
      setSyncStatus("error");
      setSyncError(error.message ?? "Failed to load remote merit");
      return false;
    }

    const nextRemote = parseRpcMerit(data, 0);
    setRemoteMeritTotal(nextRemote);
    setSyncStatus("idle");
    return true;
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setSyncStatus("disabled");
      return undefined;
    }

    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          setSyncStatus("error");
          setSyncError(error.message ?? "Failed to read session");
          return;
        }

        setSession(data.session ?? null);
      })
      .catch((error) => {
        if (!mounted) return;
        setSyncStatus("error");
        setSyncError(error.message ?? "Failed to initialize auth");
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setRemoteMeritTotal(0);
      setSyncError("");
      if (isSupabaseConfigured) {
        setSyncStatus("idle");
      }
      return;
    }

    let cancelled = false;

    const run = async () => {
      const loaded = await bootstrapRemoteState();
      if (!loaded || cancelled) return;
      await flushPendingDelta(true);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [bootstrapRemoteState, flushPendingDelta, session]);

  useEffect(() => {
    if (!session) return undefined;

    const id = setInterval(() => {
      void flushPendingDelta(false);
    }, FLUSH_INTERVAL_MS);

    return () => clearInterval(id);
  }, [flushPendingDelta, session]);

  useEffect(() => {
    if (!session) return;
    if (localPendingDelta < FLUSH_THRESHOLD) return;

    void flushPendingDelta(true);
  }, [flushPendingDelta, localPendingDelta, session]);

  const handleSendMagicLink = useCallback(async () => {
    if (!supabase || !isSupabaseConfigured) {
      setAuthMessage("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }

    const email = emailInput.trim();
    if (!email) {
      setAuthMessage("Please enter your email first.");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setAuthMessage(`Send magic link failed: ${error.message}`);
      return;
    }

    setAuthMessage("Magic link sent. Check your email to login.");
  }, [emailInput]);

  const handleSignOut = useCallback(async () => {
    if (!supabase) return;

    await flushPendingDelta(true);

    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthMessage(`Sign out failed: ${error.message}`);
      return;
    }

    setAuthMessage("Signed out.");
  }, [flushPendingDelta]);

  const handleManualSync = useCallback(async () => {
    if (!session) return;
    await flushPendingDelta(true);
  }, [flushPendingDelta, session]);

  const handleReset = useCallback(() => {
    if (session) {
      setAuthMessage("v1 does not support cloud reset. Edit value in Supabase if needed.");
      return;
    }

    if (window.confirm("Clear local pending merit?")) {
      setLocalPendingDelta(0);
    }
  }, [session]);

  const syncHint = useMemo(() => {
    if (!isSupabaseConfigured) return "Supabase not configured. Local-only mode.";
    if (!isLoggedIn) return `Not logged in. Local pending: ${localPendingDelta}`;
    if (syncStatus === "syncing") return "Syncing to cloud...";
    if (syncStatus === "offline") return `Offline. Pending locally: ${localPendingDelta}`;
    if (syncStatus === "error") return syncError ? `Sync error: ${syncError}` : "Sync error";
    if (localPendingDelta > 0) return `Logged in. Pending: ${localPendingDelta}`;
    return "Logged in. Cloud synced.";
  }, [isLoggedIn, localPendingDelta, syncError, syncStatus]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#2c1d14] text-[#f5e7c8]">
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${templeImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#1d120b]/88 via-[#28180f]/78 to-[#140a05]/92" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col justify-between px-5 py-6">
        <section className="rounded-3xl border border-[#9f7a43]/50 bg-[#2c1d14]/72 p-5 shadow-[0_10px_35px_rgba(0,0,0,0.45)] backdrop-blur-sm">
          <p className="text-[11px] tracking-[0.22em] text-[#d8be8a]">TOTAL MERIT</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <h1 className="text-5xl font-black tabular-nums text-[#f9e5b6]">{displayMerit.toLocaleString()}</h1>
            <div className="rounded-full border border-[#b1884c] bg-[#4e321f]/60 px-4 py-1 text-sm font-bold text-[#f7dba5]">
              {zenLevel}
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-[#8f6a38]/60 bg-[#211108]/55 px-3 py-2 text-xs text-[#e8cc98]">
            <p className="flex items-center gap-2">
              <Cloud size={14} />
              {syncHint}
            </p>
            {isAuto && isPageHidden ? (
              <p className="mt-1 text-[#f8d68f]">Auto tap paused in background. Return to foreground to continue.</p>
            ) : null}
          </div>
        </section>

        <section className="relative flex flex-1 items-center justify-center py-5">
          <div className="relative h-[clamp(320px,70vw,470px)] w-full max-w-[30rem]">
            <div className="absolute inset-0 overflow-hidden rounded-[2rem] border border-[#9f7a43]/40 bg-[#201108]/50 shadow-[0_18px_42px_rgba(0,0,0,0.45)]">
              <img src={isStriking ? frameStrike : frameIdle} alt="Wood fish" className="pointer-events-none h-full w-full object-cover" />
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
                <div className="animate-merit-float text-2xl font-extrabold text-[#ffe3a1]">Merit +1</div>
              </div>
            ))}

            <button
              onClick={tap}
              aria-label="Tap wood fish"
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
                One tap, one merit
                <Sparkles size={14} />
              </span>
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-[#9f7a43]/60 bg-[#2c1d14]/72 p-5 shadow-[0_10px_35px_rgba(0,0,0,0.45)] backdrop-blur-sm">
          <div className="flex flex-col gap-4">
            <div className="grid gap-2 rounded-xl border border-[#8f6a38]/50 bg-[#24130a]/60 p-3">
              {!isLoggedIn ? (
                <>
                  <label htmlFor="email-input" className="text-xs font-semibold tracking-[0.08em] text-[#e6c88f]">
                    EMAIL LOGIN (MAGIC LINK)
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="email-input"
                      type="email"
                      value={emailInput}
                      onChange={(event) => setEmailInput(event.target.value)}
                      placeholder="you@example.com"
                      className="min-w-0 flex-1 rounded-lg border border-[#815e34] bg-[#2f1b10] px-3 py-2 text-sm text-[#f5e7c8] outline-none placeholder:text-[#8f744e] focus:border-[#c59a5d]"
                    />
                    <button
                      onClick={handleSendMagicLink}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#b98b50] px-3 py-2 text-sm font-bold text-[#2a180e]"
                    >
                      <LogIn size={14} />
                      Login
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between gap-2 text-sm text-[#f1d7a6]">
                  <span className="truncate">{session.user.email}</span>
                  <button
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#4a2f1c] px-3 py-2 font-semibold text-[#d8b987]"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              )}

              {authMessage ? <p className="text-xs text-[#ddbf86]">{authMessage}</p> : null}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#f2dbad]">
                <div className={`rounded-xl p-2 ${isAuto ? "bg-[#a4773e] text-[#2d1b0f]" : "bg-[#4a2f1c] text-[#d3b078]"}`}>
                  <Settings size={18} />
                </div>
                Auto Tap
              </div>
              <button
                onClick={() => setIsAuto((prev) => !prev)}
                className={`relative h-7 w-14 rounded-full transition-colors ${isAuto ? "bg-[#b78a4f]" : "bg-[#5c3a22]"}`}
                aria-label="Toggle auto tap"
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
                <span>Tap interval</span>
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
                {isMuted ? "Muted" : "Sound On"}
              </button>
              <button
                onClick={handleManualSync}
                disabled={!isLoggedIn || localPendingDelta <= 0}
                className="rounded-xl border border-[#8b673a] px-4 py-2.5 text-sm font-bold text-[#e3c892] transition-colors hover:bg-[#51331f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sync now
              </button>
              <button
                onClick={handleReset}
                className="rounded-xl border border-[#8b673a] px-4 py-2.5 text-sm font-bold text-[#e3c892] transition-colors hover:bg-[#51331f]"
              >
                Reset
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
